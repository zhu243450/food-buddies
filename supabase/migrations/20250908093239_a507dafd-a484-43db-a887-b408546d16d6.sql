-- 创建城市管理表
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE, -- 城市标识符，如 'beijing', 'shanghai'
  name TEXT NOT NULL, -- 显示名称，如 '北京', '上海'
  description TEXT NOT NULL, -- 城市描述
  popular_cuisines TEXT[] NOT NULL DEFAULT '{}', -- 热门菜系数组
  popular_areas TEXT[] NOT NULL DEFAULT '{}', -- 热门区域数组
  dining_tips TEXT[] NOT NULL DEFAULT '{}', -- 用餐贴士数组
  is_active BOOLEAN NOT NULL DEFAULT true, -- 是否启用
  display_order INTEGER NOT NULL DEFAULT 0, -- 显示顺序
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 创建餐厅管理表
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 餐厅名称
  cuisine TEXT NOT NULL, -- 菜系
  area TEXT NOT NULL, -- 区域
  rating DECIMAL(2,1) NOT NULL DEFAULT 4.0, -- 评分 (1.0-5.0)
  price_range TEXT NOT NULL, -- 价格区间，如 '￥60-100/人'
  special_dishes TEXT[] NOT NULL DEFAULT '{}', -- 招牌菜品数组
  best_time TEXT NOT NULL, -- 最佳用餐时间
  group_size TEXT NOT NULL, -- 适合人数
  description TEXT NOT NULL, -- 餐厅描述
  is_featured BOOLEAN NOT NULL DEFAULT false, -- 是否为推荐餐厅
  is_active BOOLEAN NOT NULL DEFAULT true, -- 是否启用
  display_order INTEGER NOT NULL DEFAULT 0, -- 显示顺序
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 创建菜系指南表
CREATE TABLE public.cuisine_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 菜系名称
  description TEXT NOT NULL, -- 菜系描述
  characteristics TEXT[] NOT NULL DEFAULT '{}', -- 菜系特点数组
  must_try_dishes TEXT[] NOT NULL DEFAULT '{}', -- 必尝菜品数组
  is_active BOOLEAN NOT NULL DEFAULT true, -- 是否启用
  display_order INTEGER NOT NULL DEFAULT 0, -- 显示顺序
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 启用行级安全
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuisine_guides ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略 - 所有人可以查看启用的数据
CREATE POLICY "Anyone can view active cities" ON public.cities
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active restaurants" ON public.restaurants
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active cuisine guides" ON public.cuisine_guides
  FOR SELECT USING (is_active = true);

-- 创建RLS策略 - 只有管理员可以管理数据
CREATE POLICY "Admins can manage cities" ON public.cities
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage restaurants" ON public.restaurants
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage cuisine guides" ON public.cuisine_guides
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 创建更新时间触发器
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cuisine_guides_updated_at
  BEFORE UPDATE ON public.cuisine_guides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 插入初始城市数据
INSERT INTO public.cities (key, name, description, popular_cuisines, popular_areas, dining_tips) VALUES
('beijing', '北京', '北京美食荟萃，从传统的北京烤鸭到各地特色菜，应有尽有。在这里找到志趣相投的饭友，一起探索京城美食。', 
 ARRAY['北京菜', '川菜', '粤菜', '湘菜', '东北菜', '西北菜'], 
 ARRAY['三里屯', '国贸', '中关村', '望京', '西单', '王府井'], 
 ARRAY['北京烤鸭是必尝美食，建议提前预约', '胡同里藏着很多地道小馆', '三里屯和国贸适合商务聚餐', '簋街是宵夜聚会的好去处']),

('shanghai', '上海', '上海融合了江南美食和国际美食，从本帮菜到各国料理，满足不同口味需求。与上海饭友一起品味摩登都市美食文化。', 
 ARRAY['本帮菜', '淮扬菜', '西餐', '日料', '韩料', '东南亚菜'], 
 ARRAY['陆家嘴', '徐家汇', '静安寺', '新天地', '外滩', '田子坊'], 
 ARRAY['本帮菜偏甜，适合精致聚餐', '新天地和田子坊有很多网红餐厅', '外滩景观餐厅适合浪漫约会', '生煎包和小笼包是经典小食']),

('guangzhou', '广州', '广州是粤菜发源地，早茶文化深厚。在花城找到同样热爱美食的朋友，一起享受正宗的粤式美食体验。', 
 ARRAY['粤菜', '潮汕菜', '客家菜', '港式茶餐厅', '湘菜', '川菜'], 
 ARRAY['天河', '珠江新城', '北京路', '上下九', '番禺', '荔湾'], 
 ARRAY['早茶是广州特色，建议上午品尝', '白切鸡、烧鹅是经典粤菜', '上下九步行街有很多老字号', '夜宵文化丰富，推荐宵夜聚会']),

('shenzhen', '深圳', '深圳汇聚了全国各地美食，年轻活力的城市氛围。与志同道合的朋友探索这座创新之城的美食地图。', 
 ARRAY['粤菜', '川菜', '湘菜', '东北菜', '西餐', '日韩料理'], 
 ARRAY['南山', '福田', '罗湖', '宝安', '龙华', '前海'], 
 ARRAY['科技园和前海适合商务聚餐', '海鲜是深圳特色，推荐沙井蚝', '各大商场美食街选择丰富', '夜生活丰富，适合朋友聚会']);

-- 插入部分初始餐厅数据
INSERT INTO public.restaurants (city_id, name, cuisine, area, rating, price_range, special_dishes, best_time, group_size, description, is_featured) 
SELECT c.id, '全聚德', '北京菜', '前门', 4.5, '￥150-250/人', ARRAY['北京烤鸭', '宫保鸡丁', '糖醋里脊'], '午餐/晚餐', '4-8人', '百年老字号，北京烤鸭的代表，适合家庭聚会。', true
FROM public.cities c WHERE c.key = 'beijing';

INSERT INTO public.restaurants (city_id, name, cuisine, area, rating, price_range, special_dishes, best_time, group_size, description, is_featured) 
SELECT c.id, '海底捞火锅', '川菜火锅', '三里屯', 4.8, '￥80-120/人', ARRAY['毛肚', '鸭肠', '虾滑'], '晚餐', '2-8人', '服务贴心的火锅连锁，适合朋友聚会和约会。', true
FROM public.cities c WHERE c.key = 'beijing';

INSERT INTO public.restaurants (city_id, name, cuisine, area, rating, price_range, special_dishes, best_time, group_size, description, is_featured) 
SELECT c.id, '鼎泰丰', '台菜', '国贸', 4.6, '￥80-150/人', ARRAY['小笼包', '虾仁炒饭', '红油抄手'], '午餐/晚餐', '2-6人', '台湾知名餐饮品牌，小笼包制作精致。', true
FROM public.cities c WHERE c.key = 'beijing';

-- 插入初始菜系指南数据
INSERT INTO public.cuisine_guides (city_id, name, description, characteristics, must_try_dishes) 
SELECT c.id, '川菜', '川菜是中国八大菜系之一，以麻辣鲜香著称，善用花椒、辣椒调味，菜品丰富多样。', 
       ARRAY['麻辣鲜香', '味型丰富', '调味多变', '荤素并重'], 
       ARRAY['麻婆豆腐', '宫保鸡丁', '回锅肉', '鱼香肉丝', '水煮鱼']
FROM public.cities c WHERE c.key = 'beijing';

INSERT INTO public.cuisine_guides (city_id, name, description, characteristics, must_try_dishes) 
SELECT c.id, '北京菜', '北京菜融合了鲁菜、宫廷菜和民间菜的特色，口味醇厚，制作精细。', 
       ARRAY['口味醇厚', '制作精细', '历史悠久', '宫廷特色'], 
       ARRAY['北京烤鸭', '炸酱面', '豆汁', '卤煮火烧', '京酱肉丝']
FROM public.cities c WHERE c.key = 'beijing';