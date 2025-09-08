-- 添加一个测试餐厅到深圳，验证显示功能
INSERT INTO restaurants (
  city_id, 
  division_id,
  name, 
  cuisine, 
  area, 
  rating, 
  price_range, 
  special_dishes, 
  best_time, 
  group_size, 
  description, 
  is_featured, 
  is_active,
  display_order
) VALUES (
  '89a2045d-9e3b-465e-a471-bad2b1f58145', -- 深圳城市ID
  '4c0c24f0-f823-44a3-a584-c19e5611a397', -- 南山区ID 
  '海底捞火锅(南山店)',
  '火锅',
  '南山',
  4.6,
  '¥¥',
  ARRAY['毛肚', '鸭血', '土豆片'],
  '晚餐',
  '2-8人',
  '知名连锁火锅品牌，服务优质，食材新鲜',
  true,
  true,
  0
),
(
  '89a2045d-9e3b-465e-a471-bad2b1f58145', -- 深圳城市ID
  '9ec5a24f-a8e9-40f7-95fe-1ac3d876c6dc', -- 福田区ID 
  '点都德(福田店)',
  '粤菜',
  '福田',
  4.5,
  '¥¥',
  ARRAY['虾饺', '烧卖', '叉烧包'],
  '早茶',
  '2-6人',
  '正宗广式茶点，品种丰富，环境优雅',
  true,
  true,
  1
);