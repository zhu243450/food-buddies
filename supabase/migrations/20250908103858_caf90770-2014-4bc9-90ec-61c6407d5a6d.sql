-- 添加广州市的行政区划数据
-- 首先获取广东省的ID（如果不存在则创建）
WITH guangdong AS (
  SELECT id FROM administrative_divisions WHERE code = '440000'
  UNION ALL
  SELECT gen_random_uuid() WHERE NOT EXISTS (
    SELECT 1 FROM administrative_divisions WHERE code = '440000'
  )
  LIMIT 1
),
-- 插入广州市
guangzhou_city AS (
  INSERT INTO administrative_divisions (code, name, level, parent_id, is_active, display_order)
  SELECT '440100', '广州市', 'city', (SELECT id FROM guangdong LIMIT 1), true, 0
  ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active
  RETURNING id
)
-- 插入广州的主要区县
INSERT INTO administrative_divisions (code, name, level, parent_id, is_active, display_order)
SELECT d.code, d.name, 'district', (SELECT id FROM guangzhou_city), true, 0
FROM (
  VALUES
    ('440103', '荔湾区'),
    ('440104', '越秀区'),
    ('440105', '海珠区'),
    ('440106', '天河区'),
    ('440111', '白云区'),
    ('440112', '黄埔区'),
    ('440113', '番禺区'),
    ('440114', '花都区'),
    ('440115', '南沙区'),
    ('440117', '从化区'),
    ('440118', '增城区')
) AS d(code, name)
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- 为天河区添加一些街道（示例）
WITH tianhe AS (
  SELECT id FROM administrative_divisions WHERE code = '440106'
)
INSERT INTO administrative_divisions (code, name, level, parent_id, is_active, display_order)
SELECT t.code, t.name, 'town', (SELECT id FROM tianhe), true, 0
FROM (
  VALUES
    ('440106001', '五山街道'),
    ('440106002', '员村街道'),
    ('440106003', '车陂街道'),
    ('440106004', '石牌街道'),
    ('440106005', '天河南街道'),
    ('440106006', '林和街道'),
    ('440106007', '沙东街道'),
    ('440106008', '兴华街道'),
    ('440106009', '棠下街道'),
    ('440106010', '天园街道'),
    ('440106011', '冼村街道'),
    ('440106012', '猎德街道'),
    ('440106013', '元岗街道'),
    ('440106014', '黄村街道'),
    ('440106015', '长兴街道'),
    ('440106016', '龙洞街道'),
    ('440106017', '凤凰街道'),
    ('440106018', '前进街道'),
    ('440106019', '珠吉街道'),
    ('440106020', '新塘街道')
) AS t(code, name)
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;