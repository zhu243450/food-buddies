-- 批量添加广东省的地级市（若已存在则跳过）
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '440000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('深圳市','440300','city',(SELECT id FROM prov), true, 0),
('珠海市','440400','city',(SELECT id FROM prov), true, 0),
('汕头市','440500','city',(SELECT id FROM prov), true, 0),
('佛山市','440600','city',(SELECT id FROM prov), true, 0),
('江门市','440700','city',(SELECT id FROM prov), true, 0),
('湛江市','440800','city',(SELECT id FROM prov), true, 0),
('茂名市','440900','city',(SELECT id FROM prov), true, 0),
('肇庆市','441200','city',(SELECT id FROM prov), true, 0),
('惠州市','441300','city',(SELECT id FROM prov), true, 0),
('梅州市','441400','city',(SELECT id FROM prov), true, 0),
('汕尾市','441500','city',(SELECT id FROM prov), true, 0),
('河源市','441600','city',(SELECT id FROM prov), true, 0),
('阳江市','441700','city',(SELECT id FROM prov), true, 0),
('清远市','441800','city',(SELECT id FROM prov), true, 0),
('东莞市','441900','city',(SELECT id FROM prov), true, 0),
('中山市','442000','city',(SELECT id FROM prov), true, 0),
('潮州市','445100','city',(SELECT id FROM prov), true, 0),
('揭阳市','445200','city',(SELECT id FROM prov), true, 0),
('云浮市','445300','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;