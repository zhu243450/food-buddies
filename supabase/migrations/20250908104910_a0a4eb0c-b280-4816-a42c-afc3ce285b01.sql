-- 添加更多主要城市到 administrative_divisions 表
INSERT INTO public.administrative_divisions (name, code, level, is_active, display_order) VALUES
-- 直辖市
('天津市', '120100', 'city', true, 0),
('重庆市', '500100', 'city', true, 0),

-- 省会城市和重要城市
('杭州市', '330100', 'city', true, 1),
('南京市', '320100', 'city', true, 1),
('苏州市', '320500', 'city', true, 1),
('成都市', '510100', 'city', true, 1),
('武汉市', '420100', 'city', true, 1),
('西安市', '610100', 'city', true, 1),
('长沙市', '430100', 'city', true, 1),
('郑州市', '410100', 'city', true, 1),
('济南市', '370100', 'city', true, 1),
('青岛市', '370200', 'city', true, 1),
('大连市', '210200', 'city', true, 1),
('沈阳市', '210100', 'city', true, 1),
('哈尔滨市', '230100', 'city', true, 1),
('长春市', '220100', 'city', true, 1),
('石家庄市', '130100', 'city', true, 1),
('太原市', '140100', 'city', true, 1),
('呼和浩特市', '150100', 'city', true, 1),
('南昌市', '360100', 'city', true, 1),
('合肥市', '340100', 'city', true, 1),
('福州市', '350100', 'city', true, 1),
('厦门市', '350200', 'city', true, 1),
('昆明市', '530100', 'city', true, 1),
('贵阳市', '520100', 'city', true, 1),
('南宁市', '450100', 'city', true, 1),
('海口市', '460100', 'city', true, 1),
('三亚市', '460200', 'city', true, 1),
('银川市', '640100', 'city', true, 1),
('兰州市', '620100', 'city', true, 1),
('西宁市', '630100', 'city', true, 1),
('乌鲁木齐市', '650100', 'city', true, 1),
('拉萨市', '540100', 'city', true, 1)

ON CONFLICT (code) DO NOTHING;