-- Add more international dinner examples with SEO-optimized content
-- Focus on major English-speaking cities and international food culture

INSERT INTO public.dinners (
  created_by,
  title,
  description,
  dinner_time,
  location,
  max_participants,
  food_preferences,
  dietary_restrictions,
  gender_preference,
  personality_tags,
  dinner_mode,
  urgency_level,
  status,
  friends_only
) VALUES
-- Major US Cities - More detailed cuisine experiences
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Brooklyn Williamsburg Artisanal Pizza Workshop','Learn authentic Neapolitan pizza making in trendy Williamsburg. Wood-fired ovens, fresh ingredients, and Italian wine tasting. Perfect for food enthusiasts and couples.',NOW() + INTERVAL '8 days','Williamsburg, Brooklyn, New York, NY, USA',6,ARRAY['意餐','披萨','面饼'],NULL,'no_preference',ARRAY['学习','创意','美食爱好者'], 'scheduled','normal','active',false),

('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Manhattan Chinatown Dumpling Crawl','Explore the best dumpling spots in NYC Chinatown—xiaolongbao, potstickers, and soup dumplings. Guided food tour with local insights.',NOW() + INTERVAL '11 days','Chinatown, Manhattan, New York, NY, USA',8,ARRAY['饺子','小吃','中餐'],NULL,'no_preference',ARRAY['冒险','文化探索者','社交'], 'scheduled','normal','active',false),

('43271470-2b48-440f-a1d0-eaaa2b65b6e1','LA Beverly Hills Michelin Star Tasting Menu','Experience fine dining at a Michelin-starred restaurant. Multi-course tasting menu with wine pairings. Dress code: business casual.',NOW() + INTERVAL '21 days','Beverly Hills, Los Angeles, CA, USA',4,ARRAY['精致料理','法餐','品鉴'],NULL,'no_preference',ARRAY['精致','品鉴','高端'], 'scheduled','normal','active',false),

('43271470-2b48-440f-a1d0-eaaa2b65b6e1','San Francisco Mission Burrito Challenge','Mission District burrito crawl—compare SF s legendary taquerias. Carnitas, al pastor, and veggie options available.',NOW() + INTERVAL '9 days','Mission District, San Francisco, CA, USA',6,ARRAY['墨西哥','玉米饼','街头小吃'],ARRAY['素食可选'],'no_preference',ARRAY['挑战','随意','社交'], 'scheduled','normal','active',false),

-- International Cities - English-speaking markets
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','London Borough Market Food Tour','Explore London s famous Borough Market—artisan cheeses, fresh oysters, and international street food. Weekend market adventure.',NOW() + INTERVAL '13 days','Borough Market, London, UK',8,ARRAY['国际菜','海鲜','奶酪'],NULL,'no_preference',ARRAY['探索','美食家','文化'], 'scheduled','normal','active',false),

('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Sydney Circular Quay Harbour Seafood','Fresh Australian seafood with harbour views—barramundi, prawns, and local wines. Iconic Sydney dining experience.',NOW() + INTERVAL '15 days','Circular Quay, Sydney, NSW, Australia',6,ARRAY['海鲜','澳洲菜','白酒'],NULL,'no_preference',ARRAY['海景','澳洲风情','轻松'], 'scheduled','normal','active',false),

('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Toronto Kensington Market Global Food Walk','Multi-cultural food walk through Kensington Market—Jamaican patties, Vietnamese pho, and Mexican tacos in one neighborhood.',NOW() + INTERVAL '17 days','Kensington Market, Toronto, ON, Canada',6,ARRAY['多元文化','街头小吃','国际菜'],NULL,'no_preference',ARRAY['多元','探索','开放'], 'scheduled','normal','active',false),

-- Cuisine-specific experiences with SEO keywords
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Chicago Deep Dish vs Tavern Style Pizza Debate','Settle the Chicago pizza debate—try both deep dish and tavern style at legendary spots. Local pizza expert guide included.',NOW() + INTERVAL '19 days','Chicago Loop, Chicago, IL, USA',8,ARRAY['披萨','芝加哥菜','美式'],NULL,'no_preference',ARRAY['本地文化','辩论','社交'], 'scheduled','normal','active',false),

('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Portland Food Cart Pod Adventure','Explore Portland s famous food cart pods—gourmet grilled cheese, Korean-Mexican fusion, and craft donuts. Rain or shine!',NOW() + INTERVAL '14 days','Downtown, Portland, OR, USA',6,ARRAY['融合菜','街头小吃','美式'],NULL,'no_preference',ARRAY['冒险','随意','创新'], 'scheduled','normal','active',false),

-- Health-conscious and dietary-specific
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Denver Farm-to-Table Vegan Experience','Plant-based fine dining using Colorado ingredients. Chef will explain sustainable farming and innovative vegan techniques.',NOW() + INTERVAL '16 days','RiNo District, Denver, CO, USA',6,ARRAY['素食','有机','本地食材'],ARRAY['素食主义'],'no_preference',ARRAY['健康','环保','教育'], 'scheduled','normal','active',false),

('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Nashville Hot Chicken and Honky Tonk Night','Authentic Nashville hot chicken crawl followed by live country music. Experience Music City s food and culture.',NOW() + INTERVAL '22 days','Music Row, Nashville, TN, USA',8,ARRAY['南方菜','炸鸡','美式'],NULL,'no_preference',ARRAY['音乐','南方文化','热闹'], 'scheduled','normal','active',false),

-- Business networking focused
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Silicon Valley Entrepreneur Breakfast Club','Monthly networking breakfast for startup founders and tech professionals. Healthy options and productivity-focused conversations.',NOW() + INTERVAL '28 days','Palo Alto, CA, USA',12,ARRAY['早餐','健康','轻食'],NULL,'no_preference',ARRAY['创业','科技','人脉'], 'scheduled','normal','active',false),

('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Wall Street Power Lunch Networking','High-end business lunch in Financial District. Network with finance professionals over premium steaks and wine.',NOW() + INTERVAL '25 days','Financial District, New York, NY, USA',8,ARRAY['牛排','商务餐','高端'],NULL,'no_preference',ARRAY['商务','金融','高端'], 'scheduled','normal','active',false),

-- Cultural immersion experiences
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Philadelphia Cheesesteak vs Roast Pork Showdown','Ultimate Philly sandwich battle—visit legendary spots for authentic cheesesteaks and Italian roast pork. Local history included.',NOW() + INTERVAL '18 days','South Philadelphia, Philadelphia, PA, USA',6,ARRAY['费城菜','三明治','美式'],NULL,'no_preference',ARRAY['本地','传统','历史'], 'scheduled','normal','active',false),

('43271470-2b48-440f-a1d0-eaaa2b65b6e1','New Orleans French Quarter Creole Cooking Class','Learn authentic Creole cooking—gumbo, jambalaya, and beignets. Includes market tour and recipe cards to take home.',NOW() + INTERVAL '26 days','French Quarter, New Orleans, LA, USA',8,ARRAY['克里奥尔菜','南方菜','海鲜'],NULL,'no_preference',ARRAY['学习','文化','历史'], 'scheduled','normal','active',false),

-- International cuisine in US cities
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Houston Food Hall International Tour','Explore Houston s diverse food scene—Vietnamese pho, Nigerian jollof rice, and Salvadoran pupusas all in one food hall.',NOW() + INTERVAL '20 days','Montrose, Houston, TX, USA',8,ARRAY['国际菜','多元文化','融合菜'],NULL,'no_preference',ARRAY['多元','探索','文化交流'], 'scheduled','normal','active',false),

('43271470-2b48-440f-a1d0-eaaa2b65b6e1','DC Ethiopian Coffee Ceremony and Injera Feast','Traditional Ethiopian coffee ceremony followed by authentic injera and various stews. Cultural education included.',NOW() + INTERVAL '23 days','Adams Morgan, Washington, DC, USA',6,ARRAY['埃塞俄比亚菜','咖啡','非洲菜'],NULL,'no_preference',ARRAY['文化','传统','教育'], 'scheduled','normal','active',false),

-- Weekend and leisure experiences
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Napa Valley Wine Country Brunch Tour','Scenic wine country brunch—farm fresh eggs, artisan breads, and wine tastings at boutique wineries.',NOW() + INTERVAL '30 days','Napa Valley, CA, USA',6,ARRAY['早午餐','酒庄','加州菜'],NULL,'no_preference',ARRAY['休闲','品酒','风景'], 'scheduled','normal','active',false),

('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Las Vegas Off-Strip Hidden Gems Food Tour','Discover local Vegas favorites away from the Strip—family restaurants, ethnic eateries, and neighborhood gems.',NOW() + INTERVAL '24 days','Downtown Las Vegas, NV, USA',8,ARRAY['本地菜','多元文化','美式'],NULL,'no_preference',ARRAY['探索','本地','隐藏美食'], 'scheduled','normal','active',false);