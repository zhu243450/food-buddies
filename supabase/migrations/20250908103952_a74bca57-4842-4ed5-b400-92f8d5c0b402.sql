-- 先获取或创建广州的城市记录
WITH guangzhou_city_record AS (
  INSERT INTO cities (
    key, name, description, is_active, display_order,
    popular_cuisines, popular_areas, dining_tips
  ) VALUES (
    'guangzhou',
    '广州市',
    '广州美食指南，发现地道粤菜，结交志同道合的朋友',
    true,
    0,
    ARRAY['粤菜', '茶点', '潮汕菜', '客家菜', '西餐', '日韩料理'],
    ARRAY['天河', '越秀', '海珠', '荔湾', '番禺'],
    ARRAY['早茶是广州特色，建议上午体验', '粤菜讲究原汁原味', '推荐尝试老字号茶楼']
  )
  ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    popular_cuisines = EXCLUDED.popular_cuisines,
    popular_areas = EXCLUDED.popular_areas,
    dining_tips = EXCLUDED.dining_tips
  RETURNING id
),
-- 获取天河区的ID
tianhe_district AS (
  SELECT id FROM administrative_divisions WHERE code = '440106' LIMIT 1
)
-- 添加几家广州测试餐厅
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
) VALUES 
(
  (SELECT id FROM guangzhou_city_record),
  (SELECT id FROM tianhe_district),
  '点都德(天河店)',
  '粤菜',
  '天河',
  4.6,
  '¥¥',
  ARRAY['虾饺', '烧卖', '叉烧包', '流沙包'],
  '早茶',
  '2-8人',
  '知名粤式茶楼，传统点心制作精良，环境典雅',
  true,
  true,
  0
),
(
  (SELECT id FROM guangzhou_city_record),
  (SELECT id FROM tianhe_district),
  '陶陶居',
  '粤菜',
  '天河',
  4.5,
  '¥¥',
  ARRAY['姜撞奶', '艇仔粥', '白切鸡', '红烧乳鸽'],
  '午餐',
  '2-6人',
  '百年老字号，正宗广府菜，承载着广州人的美食记忆',
  true,
  true,
  1
),
(
  (SELECT id FROM guangzhou_city_record),
  (SELECT id FROM tianhe_district),
  '海底捞火锅(天河店)',
  '火锅',
  '天河',
  4.4,
  '¥¥',
  ARRAY['毛肚', '虾滑', '土豆片', '鸭血'],
  '晚餐',
  '2-10人',
  '服务周到的连锁火锅品牌，适合朋友聚餐',
  false,
  true,
  2
);