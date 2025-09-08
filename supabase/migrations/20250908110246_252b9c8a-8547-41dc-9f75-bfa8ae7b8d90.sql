-- 添加江苏省的地级市
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '320000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('南京市','320100','city',(SELECT id FROM prov), true, 0),
('无锡市','320200','city',(SELECT id FROM prov), true, 0),
('徐州市','320300','city',(SELECT id FROM prov), true, 0),
('常州市','320400','city',(SELECT id FROM prov), true, 0),
('苏州市','320500','city',(SELECT id FROM prov), true, 0),
('南通市','320600','city',(SELECT id FROM prov), true, 0),
('连云港市','320700','city',(SELECT id FROM prov), true, 0),
('淮安市','320800','city',(SELECT id FROM prov), true, 0),
('盐城市','320900','city',(SELECT id FROM prov), true, 0),
('扬州市','321000','city',(SELECT id FROM prov), true, 0),
('镇江市','321100','city',(SELECT id FROM prov), true, 0),
('泰州市','321200','city',(SELECT id FROM prov), true, 0),
('宿迁市','321300','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;

-- 添加浙江省的地级市
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '330000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('杭州市','330100','city',(SELECT id FROM prov), true, 0),
('宁波市','330200','city',(SELECT id FROM prov), true, 0),
('温州市','330300','city',(SELECT id FROM prov), true, 0),
('嘉兴市','330400','city',(SELECT id FROM prov), true, 0),
('湖州市','330500','city',(SELECT id FROM prov), true, 0),
('绍兴市','330600','city',(SELECT id FROM prov), true, 0),
('金华市','330700','city',(SELECT id FROM prov), true, 0),
('衢州市','330800','city',(SELECT id FROM prov), true, 0),
('舟山市','330900','city',(SELECT id FROM prov), true, 0),
('台州市','331000','city',(SELECT id FROM prov), true, 0),
('丽水市','331100','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;

-- 添加山东省的地级市
WITH prov AS (
  SELECT id FROM public.administrative_divisions 
  WHERE code = '370000' AND level = 'province' AND is_active = true
  LIMIT 1
)
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order)
VALUES
('济南市','370100','city',(SELECT id FROM prov), true, 0),
('青岛市','370200','city',(SELECT id FROM prov), true, 0),
('淄博市','370300','city',(SELECT id FROM prov), true, 0),
('枣庄市','370400','city',(SELECT id FROM prov), true, 0),
('东营市','370500','city',(SELECT id FROM prov), true, 0),
('烟台市','370600','city',(SELECT id FROM prov), true, 0),
('潍坊市','370700','city',(SELECT id FROM prov), true, 0),
('济宁市','370800','city',(SELECT id FROM prov), true, 0),
('泰安市','370900','city',(SELECT id FROM prov), true, 0),
('威海市','371000','city',(SELECT id FROM prov), true, 0),
('日照市','371100','city',(SELECT id FROM prov), true, 0),
('临沂市','371300','city',(SELECT id FROM prov), true, 0),
('德州市','371400','city',(SELECT id FROM prov), true, 0),
('聊城市','371500','city',(SELECT id FROM prov), true, 0),
('滨州市','371600','city',(SELECT id FROM prov), true, 0),
('菏泽市','371700','city',(SELECT id FROM prov), true, 0)
ON CONFLICT (code) DO NOTHING;