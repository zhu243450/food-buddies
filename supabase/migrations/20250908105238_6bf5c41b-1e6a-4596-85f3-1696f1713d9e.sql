-- 添加省级行政区划
INSERT INTO public.administrative_divisions (name, code, level, parent_id, is_active, display_order) VALUES
-- 直辖市 (已存在，跳过)

-- 省份
('河北省', '130000', 'province', null, true, 2),
('山西省', '140000', 'province', null, true, 2),
('内蒙古自治区', '150000', 'province', null, true, 2),
('辽宁省', '210000', 'province', null, true, 2),
('吉林省', '220000', 'province', null, true, 2),
('黑龙江省', '230000', 'province', null, true, 2),
('江苏省', '320000', 'province', null, true, 2),
('浙江省', '330000', 'province', null, true, 2),
('安徽省', '340000', 'province', null, true, 2),
('福建省', '350000', 'province', null, true, 2),
('江西省', '360000', 'province', null, true, 2),
('山东省', '370000', 'province', null, true, 2),
('河南省', '410000', 'province', null, true, 2),
('湖北省', '420000', 'province', null, true, 2),
('湖南省', '430000', 'province', null, true, 2),
('广东省', '440000', 'province', null, true, 2),
('广西壮族自治区', '450000', 'province', null, true, 2),
('海南省', '460000', 'province', null, true, 2),
('四川省', '510000', 'province', null, true, 2),
('贵州省', '520000', 'province', null, true, 2),
('云南省', '530000', 'province', null, true, 2),
('西藏自治区', '540000', 'province', null, true, 2),
('陕西省', '610000', 'province', null, true, 2),
('甘肃省', '620000', 'province', null, true, 2),
('青海省', '630000', 'province', null, true, 2),
('宁夏回族自治区', '640000', 'province', null, true, 2),
('新疆维吾尔自治区', '650000', 'province', null, true, 2)

ON CONFLICT (code) DO NOTHING;