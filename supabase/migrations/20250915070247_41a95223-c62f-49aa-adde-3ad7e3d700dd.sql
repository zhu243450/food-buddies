-- 添加欧美国家和城市数据到 administrative_divisions 表
-- 使用现有的级别系统：province=国家, city=州/省, district=城市

-- 添加美国
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) VALUES
  ('美国', 'US', 'province', null, true, 1000);

-- 获取美国的ID，然后添加州
WITH usa AS (
  SELECT id FROM administrative_divisions WHERE name = '美国' AND level = 'province'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) 
SELECT name, code, level, usa.id, is_active, display_order
FROM usa, (VALUES 
  ('加利福尼亚州', 'US-CA', 'city', true, 0),
  ('纽约州', 'US-NY', 'city', true, 0),
  ('德克萨斯州', 'US-TX', 'city', true, 0),
  ('佛罗里达州', 'US-FL', 'city', true, 0),
  ('伊利诺伊州', 'US-IL', 'city', true, 0),
  ('华盛顿州', 'US-WA', 'city', true, 0)
) AS states(name, code, level, is_active, display_order);

-- 添加美国主要城市
WITH usa_states AS (
  SELECT ad.id, ad.code, ad.name 
  FROM administrative_divisions ad 
  JOIN administrative_divisions usa ON ad.parent_id = usa.id 
  WHERE usa.name = '美国' AND ad.level = 'city'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order)
SELECT cities.name, cities.code, 'district', usa_states.id, true, 0
FROM usa_states
JOIN (VALUES 
  ('纽约', 'US-NYC', 'US-NY'),
  ('洛杉矶', 'US-LA', 'US-CA'),
  ('旧金山', 'US-SF', 'US-CA'),
  ('芝加哥', 'US-CHI', 'US-IL'),
  ('休斯顿', 'US-HOU', 'US-TX'),
  ('迈阿密', 'US-MIA', 'US-FL'),
  ('西雅图', 'US-SEA', 'US-WA')
) AS cities(name, code, state_code) ON usa_states.code = cities.state_code;

-- 添加英国
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) VALUES
  ('英国', 'UK', 'province', null, true, 1001);

WITH uk AS (
  SELECT id FROM administrative_divisions WHERE name = '英国' AND level = 'province'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) 
SELECT name, code, level, uk.id, is_active, display_order
FROM uk, (VALUES 
  ('英格兰', 'UK-ENG', 'city', true, 0),
  ('苏格兰', 'UK-SCO', 'city', true, 0),
  ('威尔士', 'UK-WAL', 'city', true, 0)
) AS regions(name, code, level, is_active, display_order);

WITH uk_regions AS (
  SELECT ad.id, ad.code, ad.name 
  FROM administrative_divisions ad 
  JOIN administrative_divisions uk ON ad.parent_id = uk.id 
  WHERE uk.name = '英国' AND ad.level = 'city'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order)
SELECT cities.name, cities.code, 'district', uk_regions.id, true, 0
FROM uk_regions
JOIN (VALUES 
  ('伦敦', 'UK-LON', 'UK-ENG'),
  ('曼彻斯特', 'UK-MAN', 'UK-ENG'),
  ('伯明翰', 'UK-BIR', 'UK-ENG'),
  ('爱丁堡', 'UK-EDI', 'UK-SCO'),
  ('格拉斯哥', 'UK-GLA', 'UK-SCO')
) AS cities(name, code, region_code) ON uk_regions.code = cities.region_code;

-- 添加法国
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) VALUES
  ('法国', 'FR', 'province', null, true, 1002);

WITH france AS (
  SELECT id FROM administrative_divisions WHERE name = '法国' AND level = 'province'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) 
SELECT name, code, level, france.id, is_active, display_order
FROM france, (VALUES 
  ('法兰西岛大区', 'FR-IDF', 'city', true, 0),
  ('普罗旺斯-阿尔卑斯-蔚蓝海岸大区', 'FR-PACA', 'city', true, 0),
  ('奥弗涅-罗纳-阿尔卑斯大区', 'FR-ARA', 'city', true, 0)
) AS regions(name, code, level, is_active, display_order);

WITH france_regions AS (
  SELECT ad.id, ad.code, ad.name 
  FROM administrative_divisions ad 
  JOIN administrative_divisions france ON ad.parent_id = france.id 
  WHERE france.name = '法国' AND ad.level = 'city'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order)
SELECT cities.name, cities.code, 'district', france_regions.id, true, 0
FROM france_regions
JOIN (VALUES 
  ('巴黎', 'FR-PAR', 'FR-IDF'),
  ('马赛', 'FR-MAR', 'FR-PACA'),
  ('里昂', 'FR-LYO', 'FR-ARA'),
  ('尼斯', 'FR-NIC', 'FR-PACA')
) AS cities(name, code, region_code) ON france_regions.code = cities.region_code;

-- 添加意大利
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) VALUES
  ('意大利', 'IT', 'province', null, true, 1003);

WITH italy AS (
  SELECT id FROM administrative_divisions WHERE name = '意大利' AND level = 'province'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) 
SELECT name, code, level, italy.id, is_active, display_order
FROM italy, (VALUES 
  ('拉齐奥大区', 'IT-LAZ', 'city', true, 0),
  ('伦巴第大区', 'IT-LOM', 'city', true, 0),
  ('威尼托大区', 'IT-VEN', 'city', true, 0),
  ('托斯卡纳大区', 'IT-TUS', 'city', true, 0)
) AS regions(name, code, level, is_active, display_order);

WITH italy_regions AS (
  SELECT ad.id, ad.code, ad.name 
  FROM administrative_divisions ad 
  JOIN administrative_divisions italy ON ad.parent_id = italy.id 
  WHERE italy.name = '意大利' AND ad.level = 'city'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order)
SELECT cities.name, cities.code, 'district', italy_regions.id, true, 0
FROM italy_regions
JOIN (VALUES 
  ('罗马', 'IT-ROM', 'IT-LAZ'),
  ('米兰', 'IT-MIL', 'IT-LOM'),
  ('威尼斯', 'IT-VCE', 'IT-VEN'),
  ('佛罗伦萨', 'IT-FLO', 'IT-TUS')
) AS cities(name, code, region_code) ON italy_regions.code = cities.region_code;

-- 添加德国
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) VALUES
  ('德国', 'DE', 'province', null, true, 1004);

WITH germany AS (
  SELECT id FROM administrative_divisions WHERE name = '德国' AND level = 'province'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) 
SELECT name, code, level, germany.id, is_active, display_order
FROM germany, (VALUES 
  ('巴伐利亚州', 'DE-BY', 'city', true, 0),
  ('北莱茵-威斯特法伦州', 'DE-NRW', 'city', true, 0),
  ('柏林州', 'DE-BE', 'city', true, 0)
) AS states(name, code, level, is_active, display_order);

WITH germany_states AS (
  SELECT ad.id, ad.code, ad.name 
  FROM administrative_divisions ad 
  JOIN administrative_divisions germany ON ad.parent_id = germany.id 
  WHERE germany.name = '德国' AND ad.level = 'city'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order)
SELECT cities.name, cities.code, 'district', germany_states.id, true, 0
FROM germany_states
JOIN (VALUES 
  ('柏林', 'DE-BER', 'DE-BE'),
  ('慕尼黑', 'DE-MUN', 'DE-BY'),
  ('科隆', 'DE-COL', 'DE-NRW'),
  ('法兰克福', 'DE-FRA', 'DE-NRW')
) AS cities(name, code, state_code) ON germany_states.code = cities.state_code;

-- 添加加拿大
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) VALUES
  ('加拿大', 'CA', 'province', null, true, 1005);

WITH canada AS (
  SELECT id FROM administrative_divisions WHERE name = '加拿大' AND level = 'province'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) 
SELECT name, code, level, canada.id, is_active, display_order
FROM canada, (VALUES 
  ('安大略省', 'CA-ON', 'city', true, 0),
  ('魁北克省', 'CA-QC', 'city', true, 0),
  ('不列颠哥伦比亚省', 'CA-BC', 'city', true, 0)
) AS provinces(name, code, level, is_active, display_order);

WITH canada_provinces AS (
  SELECT ad.id, ad.code, ad.name 
  FROM administrative_divisions ad 
  JOIN administrative_divisions canada ON ad.parent_id = canada.id 
  WHERE canada.name = '加拿大' AND ad.level = 'city'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order)
SELECT cities.name, cities.code, 'district', canada_provinces.id, true, 0
FROM canada_provinces
JOIN (VALUES 
  ('多伦多', 'CA-TOR', 'CA-ON'),
  ('蒙特利尔', 'CA-MTL', 'CA-QC'),
  ('温哥华', 'CA-VAN', 'CA-BC')
) AS cities(name, code, province_code) ON canada_provinces.code = cities.province_code;

-- 添加澳大利亚
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) VALUES
  ('澳大利亚', 'AU', 'province', null, true, 1006);

WITH australia AS (
  SELECT id FROM administrative_divisions WHERE name = '澳大利亚' AND level = 'province'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order) 
SELECT name, code, level, australia.id, is_active, display_order
FROM australia, (VALUES 
  ('新南威尔士州', 'AU-NSW', 'city', true, 0),
  ('维多利亚州', 'AU-VIC', 'city', true, 0),
  ('昆士兰州', 'AU-QLD', 'city', true, 0)
) AS states(name, code, level, is_active, display_order);

WITH australia_states AS (
  SELECT ad.id, ad.code, ad.name 
  FROM administrative_divisions ad 
  JOIN administrative_divisions australia ON ad.parent_id = australia.id 
  WHERE australia.name = '澳大利亚' AND ad.level = 'city'
)
INSERT INTO administrative_divisions (name, code, level, parent_id, is_active, display_order)
SELECT cities.name, cities.code, 'district', australia_states.id, true, 0
FROM australia_states
JOIN (VALUES 
  ('悉尼', 'AU-SYD', 'AU-NSW'),
  ('墨尔本', 'AU-MEL', 'AU-VIC'),
  ('布里斯班', 'AU-BRI', 'AU-QLD')
) AS cities(name, code, state_code) ON australia_states.code = cities.state_code;