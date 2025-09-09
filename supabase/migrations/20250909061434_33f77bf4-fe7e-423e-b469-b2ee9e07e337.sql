-- 补充缺失的省份、直辖市、自治区和特别行政区
INSERT INTO administrative_divisions (code, name, level, parent_id, is_active, display_order) VALUES
-- 直辖市
('120000', '天津市', 'province', NULL, true, 1),
('500000', '重庆市', 'province', NULL, true, 1),

-- 省份  
('210000', '辽宁省', 'province', NULL, true, 2),
('230000', '黑龙江省', 'province', NULL, true, 2),
('350000', '福建省', 'province', NULL, true, 2),
('430000', '湖南省', 'province', NULL, true, 2),
('520000', '贵州省', 'province', NULL, true, 2),
('610000', '陕西省', 'province', NULL, true, 2),
('620000', '甘肃省', 'province', NULL, true, 2),
('630000', '青海省', 'province', NULL, true, 2),
('710000', '台湾省', 'province', NULL, true, 2),

-- 自治区
('540000', '西藏自治区', 'province', NULL, true, 2),

-- 特别行政区
('810000', '香港特别行政区', 'province', NULL, true, 3),
('820000', '澳门特别行政区', 'province', NULL, true, 3)

ON CONFLICT (code) DO NOTHING;