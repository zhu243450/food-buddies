-- 1) Create administrative_divisions table with hierarchical structure
CREATE TABLE IF NOT EXISTS public.administrative_divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE, -- optional national code when available
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('province','city','district','town','subdistrict')),
  parent_id UUID NULL REFERENCES public.administrative_divisions(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_divisions_level ON public.administrative_divisions(level);
CREATE INDEX IF NOT EXISTS idx_admin_divisions_parent ON public.administrative_divisions(parent_id);
CREATE INDEX IF NOT EXISTS idx_admin_divisions_name ON public.administrative_divisions(name);

-- RLS
ALTER TABLE public.administrative_divisions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all administrative_divisions
CREATE POLICY IF NOT EXISTS "Admins can manage administrative divisions"
ON public.administrative_divisions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active administrative divisions
CREATE POLICY IF NOT EXISTS "Anyone can view active administrative divisions"
ON public.administrative_divisions
FOR SELECT
USING (is_active = true);

-- Timestamps trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_divisions_updated_at ON public.administrative_divisions;
CREATE TRIGGER trg_admin_divisions_updated_at
BEFORE UPDATE ON public.administrative_divisions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Alter restaurants to add division_id (nullable for back-compat)
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS division_id UUID NULL REFERENCES public.administrative_divisions(id);

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_restaurants_division ON public.restaurants(division_id);

-- 3) Optional: function to find the top-level city ancestor for a division
CREATE OR REPLACE FUNCTION public.get_city_ancestor(_division_id uuid)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  cur_id uuid := _division_id;
  cur_level text;
  parent uuid;
BEGIN
  IF cur_id IS NULL THEN RETURN NULL; END IF;
  LOOP
    SELECT level, parent_id INTO cur_level, parent FROM public.administrative_divisions WHERE id = cur_id;
    IF NOT FOUND THEN RETURN NULL; END IF;
    IF cur_level = 'city' OR cur_level = 'province' THEN
      RETURN cur_id;
    END IF;
    cur_id := parent;
    IF cur_id IS NULL THEN RETURN NULL; END IF;
  END LOOP;
END; $$;

-- 4) Minimal seed for four municipalities and key districts (to demonstrate)
-- Provinces/municipalities
INSERT INTO public.administrative_divisions (code, name, level)
VALUES
  ('110000', '北京市', 'province'),
  ('310000', '上海市', 'province'),
  ('440000', '广东省', 'province'),
  ('440300', '深圳市', 'city')
ON CONFLICT (code) DO NOTHING;

-- Cities under provinces
INSERT INTO public.administrative_divisions (code, name, level, parent_id)
SELECT '110100', '北京市', 'city', ad.id FROM public.administrative_divisions ad WHERE ad.code = '110000'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.administrative_divisions (code, name, level, parent_id)
SELECT '310100', '上海市', 'city', ad.id FROM public.administrative_divisions ad WHERE ad.code = '310000'
ON CONFLICT (code) DO NOTHING;

-- Districts for Shenzhen
WITH shenzhen AS (
  SELECT COALESCE((SELECT id FROM public.administrative_divisions WHERE code='440300'),
                  (SELECT id FROM public.administrative_divisions WHERE code='440000')) AS city_id
)
INSERT INTO public.administrative_divisions (code, name, level, parent_id)
SELECT d.code, d.name, 'district', (SELECT city_id FROM shenzhen)
FROM (
  VALUES
    ('440303','罗湖区'),
    ('440304','福田区'),
    ('440305','南山区'),
    ('440306','宝安区'),
    ('440307','龙岗区'),
    ('440308','盐田区'),
    ('440309','龙华区'),
    ('440310','坪山区'),
    ('440311','光明区')
) AS d(code,name)
ON CONFLICT (code) DO NOTHING;

-- Example towns for Nanshan (demo only)
WITH nanshan AS (
  SELECT id FROM public.administrative_divisions WHERE code='440305'
)
INSERT INTO public.administrative_divisions (code, name, level, parent_id)
SELECT t.code, t.name, 'town', (SELECT id FROM nanshan)
FROM (
  VALUES
    ('440305001','南山街道'),
    ('440305003','蛇口街道'),
    ('440305005','粤海街道'),
    ('440305006','沙河街道'),
    ('440305007','招商街道'),
    ('440305008','西丽街道')
) AS t(code,name)
ON CONFLICT (code) DO NOTHING;
