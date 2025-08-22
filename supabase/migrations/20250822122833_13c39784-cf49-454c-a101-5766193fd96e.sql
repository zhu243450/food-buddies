-- Create overrides table and update restriction logic (fixed policies without IF NOT EXISTS)
-- 1) Table for admin overrides
CREATE TABLE IF NOT EXISTS public.restriction_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('remove','delay')),
  delay_until timestamptz NULL,
  reason text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restriction_overrides ENABLE ROW LEVEL SECURITY;

-- Policies: admins full control
CREATE POLICY "Admins can manage overrides"
ON public.restriction_overrides
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: users can view their own overrides
CREATE POLICY "Users can view their own overrides"
ON public.restriction_overrides
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_restriction_overrides_user_id ON public.restriction_overrides(user_id);

-- Trigger to stamp created_by
CREATE OR REPLACE FUNCTION public.set_created_by_override()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_created_by_override ON public.restriction_overrides;
CREATE TRIGGER trg_set_created_by_override
BEFORE INSERT ON public.restriction_overrides
FOR EACH ROW
EXECUTE FUNCTION public.set_created_by_override();

-- 2) Update restriction logic function to "same-day late cancellations > 10 => 3 days ban"
CREATE OR REPLACE FUNCTION public.check_user_cancellation_restrictions(user_id_param uuid)
RETURNS TABLE(
  can_create_dinner boolean,
  restriction_reason text,
  late_cancellation_count integer,
  restriction_end_date timestamptz
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  late_cnt integer := 0;
  latest_late timestamptz;
  restriction_end timestamptz;
  override_rec record;
  day_start timestamptz;
  day_end timestamptz;
BEGIN
  -- Define current natural day window in server timezone
  day_start := date_trunc('day', now());
  day_end := day_start + interval '1 day';

  -- Check admin overrides first
  SELECT ro.* INTO override_rec
  FROM public.restriction_overrides ro
  WHERE ro.user_id = user_id_param
    AND (
      (ro.mode = 'remove' AND (ro.delay_until IS NULL OR ro.delay_until > now()))
      OR (ro.mode = 'delay' AND ro.delay_until > now())
    )
  ORDER BY ro.created_at DESC
  LIMIT 1;

  IF override_rec IS NOT NULL THEN
    IF override_rec.mode = 'remove' THEN
      RETURN QUERY SELECT true, '管理员已解除处罚'::text, 0, NULL::timestamptz;
      RETURN;
    ELSIF override_rec.mode = 'delay' THEN
      RETURN QUERY SELECT true, '处罚已被管理员延迟至 ' || to_char(override_rec.delay_until, 'YYYY-MM-DD HH24:MI:SS TZ'), 0, override_rec.delay_until;
      RETURN;
    END IF;
  END IF;

  -- Count late cancellations for the current day
  SELECT COUNT(*), MAX(cancelled_at)
  INTO late_cnt, latest_late
  FROM public.cancellation_records
  WHERE user_id = user_id_param
    AND is_late_cancellation = true
    AND cancelled_at >= day_start
    AND cancelled_at < day_end;

  -- If greater than 10, apply 3-day restriction
  IF late_cnt > 10 THEN
    restriction_end := COALESCE(latest_late, now()) + interval '3 days';
    IF now() < restriction_end THEN
      RETURN QUERY SELECT false, '当天迟到取消次数超过10次，限制发布饭局3天'::text, late_cnt, restriction_end;
      RETURN;
    END IF;
  END IF;

  -- Otherwise allowed
  RETURN QUERY SELECT true, ''::text, late_cnt, NULL::timestamptz;
END;
$$;

-- Ensure dinner creation trigger still uses the updated function
CREATE OR REPLACE FUNCTION public.check_dinner_creation_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  restriction_check RECORD;
BEGIN
  SELECT * INTO restriction_check FROM public.check_user_cancellation_restrictions(NEW.created_by);
  IF NOT restriction_check.can_create_dinner THEN
    RAISE EXCEPTION '无法创建饭局: %', restriction_check.restriction_reason;
  END IF;
  RETURN NEW;
END;
$$;