-- 关联城市到正确的省级行政区
UPDATE administrative_divisions AS city
SET parent_id = prov.id
FROM administrative_divisions AS prov
WHERE city.code = '440300' AND city.level = 'city' AND prov.code = '440000' AND prov.level = 'province';

UPDATE administrative_divisions AS city
SET parent_id = prov.id
FROM administrative_divisions AS prov
WHERE city.code = '120100' AND city.level = 'city' AND prov.code = '120000' AND prov.level = 'province';

UPDATE administrative_divisions AS city
SET parent_id = prov.id
FROM administrative_divisions AS prov
WHERE city.code = '500100' AND city.level = 'city' AND prov.code = '500000' AND prov.level = 'province';

-- 确保这些城市标记为激活
UPDATE administrative_divisions SET is_active = true WHERE code IN ('440300','120100','500100');