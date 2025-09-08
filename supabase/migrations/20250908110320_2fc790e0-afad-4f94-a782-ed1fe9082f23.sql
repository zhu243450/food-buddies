-- 添加河南省的地级市
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '410000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('郑州市','410100','city',(SELECT id FROM prov), true, 0),
('开封市','410200','city',(SELECT id FROM prov), true, 0),
('洛阳市','410300','city',(SELECT id FROM prov), true, 0),
('平顶山市','410400','city',(SELECT id FROM prov), true, 0),
('安阳市','410500','city',(SELECT id FROM prov), true, 0),
('鹤壁市','410600','city',(SELECT id FROM prov), true, 0),
('新乡市','410700','city',(SELECT id FROM prov), true, 0),
('焦作市','410800','city',(SELECT id FROM prov), true, 0),
('濮阳市','410900','city',(SELECT id FROM prov), true, 0),
('许昌市','411000','city',(SELECT id FROM prov), true, 0),
('漯河市','411100','city',(SELECT id FROM prov), true, 0),
('三门峡市','411200','city',(SELECT id FROM prov), true, 0),
('南阳市','411300','city',(SELECT id FROM prov), true, 0),
('商丘市','411400','city',(SELECT id FROM prov), true, 0),
('信阳市','411500','city',(SELECT id FROM prov), true, 0),
('周口市','411600','city',(SELECT id FROM prov), true, 0),
('驻马店市','411700','city',(SELECT id FROM prov), true, 0),
('济源市','419001','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;

-- 添加四川省的地级市
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '510000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('成都市','510100','city',(SELECT id FROM prov), true, 0),
('自贡市','510300','city',(SELECT id FROM prov), true, 0),
('攀枝花市','510400','city',(SELECT id FROM prov), true, 0),
('泸州市','510500','city',(SELECT id FROM prov), true, 0),
('德阳市','510600','city',(SELECT id FROM prov), true, 0),
('绵阳市','510700','city',(SELECT id FROM prov), true, 0),
('广元市','510800','city',(SELECT id FROM prov), true, 0),
('遂宁市','510900','city',(SELECT id FROM prov), true, 0),
('内江市','511000','city',(SELECT id FROM prov), true, 0),
('乐山市','511100','city',(SELECT id FROM prov), true, 0),
('南充市','511300','city',(SELECT id FROM prov), true, 0),
('眉山市','511400','city',(SELECT id FROM prov), true, 0),
('宜宾市','511500','city',(SELECT id FROM prov), true, 0),
('广安市','511600','city',(SELECT id FROM prov), true, 0),
('达州市','511700','city',(SELECT id FROM prov), true, 0),
('雅安市','511800','city',(SELECT id FROM prov), true, 0),
('巴中市','511900','city',(SELECT id FROM prov), true, 0),
('资阳市','512000','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;