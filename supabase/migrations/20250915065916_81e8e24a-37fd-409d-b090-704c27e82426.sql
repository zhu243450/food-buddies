-- 添加欧美国家和城市数据到 administrative_divisions 表
-- 使用现有的级别系统：province=国家, city=州/省, county=城市

-- 添加美国
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('usa-country', '美国', 'US', 'province', null, true, 1000),
  ('usa-ca', '加利福尼亚州', 'CA', 'city', 'usa-country', true, 0),
  ('usa-ny', '纽约州', 'NY', 'city', 'usa-country', true, 0),
  ('usa-tx', '德克萨斯州', 'TX', 'city', 'usa-country', true, 0),
  ('usa-fl', '佛罗里达州', 'FL', 'city', 'usa-country', true, 0),
  ('usa-il', '伊利诺伊州', 'IL', 'city', 'usa-country', true, 0),
  ('usa-wa', '华盛顿州', 'WA', 'city', 'usa-country', true, 0);

-- 美国主要城市
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('usa-nyc', '纽约', 'NYC', 'county', 'usa-ny', true, 0),
  ('usa-la', '洛杉矶', 'LA', 'county', 'usa-ca', true, 0),
  ('usa-sf', '旧金山', 'SF', 'county', 'usa-ca', true, 0),
  ('usa-chicago', '芝加哥', 'CHI', 'county', 'usa-il', true, 0),
  ('usa-houston', '休斯顿', 'HOU', 'county', 'usa-tx', true, 0),
  ('usa-miami', '迈阿密', 'MIA', 'county', 'usa-fl', true, 0),
  ('usa-seattle', '西雅图', 'SEA', 'county', 'usa-wa', true, 0);

-- 添加英国
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('uk-country', '英国', 'UK', 'province', null, true, 1001),
  ('uk-england', '英格兰', 'ENG', 'city', 'uk-country', true, 0),
  ('uk-scotland', '苏格兰', 'SCO', 'city', 'uk-country', true, 0),
  ('uk-wales', '威尔士', 'WAL', 'city', 'uk-country', true, 0);

-- 英国主要城市
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('uk-london', '伦敦', 'LON', 'county', 'uk-england', true, 0),
  ('uk-manchester', '曼彻斯特', 'MAN', 'county', 'uk-england', true, 0),
  ('uk-birmingham', '伯明翰', 'BIR', 'county', 'uk-england', true, 0),
  ('uk-edinburgh', '爱丁堡', 'EDI', 'county', 'uk-scotland', true, 0),
  ('uk-glasgow', '格拉斯哥', 'GLA', 'county', 'uk-scotland', true, 0);

-- 添加法国
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('france-country', '法国', 'FR', 'province', null, true, 1002),
  ('france-idf', '法兰西岛大区', 'IDF', 'city', 'france-country', true, 0),
  ('france-paca', '普罗旺斯-阿尔卑斯-蔚蓝海岸大区', 'PACA', 'city', 'france-country', true, 0),
  ('france-ara', '奥弗涅-罗纳-阿尔卑斯大区', 'ARA', 'city', 'france-country', true, 0);

-- 法国主要城市
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('france-paris', '巴黎', 'PAR', 'county', 'france-idf', true, 0),
  ('france-marseille', '马赛', 'MAR', 'county', 'france-paca', true, 0),
  ('france-lyon', '里昂', 'LYO', 'county', 'france-ara', true, 0),
  ('france-nice', '尼斯', 'NIC', 'county', 'france-paca', true, 0);

-- 添加意大利
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('italy-country', '意大利', 'IT', 'province', null, true, 1003),
  ('italy-lazio', '拉齐奥大区', 'LAZ', 'city', 'italy-country', true, 0),
  ('italy-lombardy', '伦巴第大区', 'LOM', 'city', 'italy-country', true, 0),
  ('italy-veneto', '威尼托大区', 'VEN', 'city', 'italy-country', true, 0),
  ('italy-tuscany', '托斯卡纳大区', 'TUS', 'city', 'italy-country', true, 0);

-- 意大利主要城市
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('italy-rome', '罗马', 'ROM', 'county', 'italy-lazio', true, 0),
  ('italy-milan', '米兰', 'MIL', 'county', 'italy-lombardy', true, 0),
  ('italy-venice', '威尼斯', 'VEN', 'county', 'italy-veneto', true, 0),
  ('italy-florence', '佛罗伦萨', 'FLO', 'county', 'italy-tuscany', true, 0);

-- 添加德国
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('germany-country', '德国', 'DE', 'province', null, true, 1004),
  ('germany-bavaria', '巴伐利亚州', 'BY', 'city', 'germany-country', true, 0),
  ('germany-nrw', '北莱茵-威斯特法伦州', 'NRW', 'city', 'germany-country', true, 0),
  ('germany-berlin-state', '柏林州', 'BE', 'city', 'germany-country', true, 0);

-- 德国主要城市
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('germany-berlin', '柏林', 'BER', 'county', 'germany-berlin-state', true, 0),
  ('germany-munich', '慕尼黑', 'MUN', 'county', 'germany-bavaria', true, 0),
  ('germany-cologne', '科隆', 'COL', 'county', 'germany-nrw', true, 0),
  ('germany-frankfurt', '法兰克福', 'FRA', 'county', 'germany-nrw', true, 0);

-- 添加加拿大
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('canada-country', '加拿大', 'CA', 'province', null, true, 1005),
  ('canada-on', '安大略省', 'ON', 'city', 'canada-country', true, 0),
  ('canada-qc', '魁北克省', 'QC', 'city', 'canada-country', true, 0),
  ('canada-bc', '不列颠哥伦比亚省', 'BC', 'city', 'canada-country', true, 0);

-- 加拿大主要城市
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('canada-toronto', '多伦多', 'TOR', 'county', 'canada-on', true, 0),
  ('canada-montreal', '蒙特利尔', 'MTL', 'county', 'canada-qc', true, 0),
  ('canada-vancouver', '温哥华', 'VAN', 'county', 'canada-bc', true, 0);

-- 添加澳大利亚
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('australia-country', '澳大利亚', 'AU', 'province', null, true, 1006),
  ('australia-nsw', '新南威尔士州', 'NSW', 'city', 'australia-country', true, 0),
  ('australia-vic', '维多利亚州', 'VIC', 'city', 'australia-country', true, 0),
  ('australia-qld', '昆士兰州', 'QLD', 'city', 'australia-country', true, 0);

-- 澳大利亚主要城市
INSERT INTO administrative_divisions (id, name, code, level, parent_id, is_active, display_order) VALUES
  ('australia-sydney', '悉尼', 'SYD', 'county', 'australia-nsw', true, 0),
  ('australia-melbourne', '墨尔本', 'MEL', 'county', 'australia-vic', true, 0),
  ('australia-brisbane', '布里斯班', 'BRI', 'county', 'australia-qld', true, 0);