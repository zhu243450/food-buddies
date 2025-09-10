-- Bulk insert additional international SEO-friendly dinners
-- All created by an existing admin user to bypass RLS during migration

-- Use existing user as creator (updated earlier)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = '43271470-2b48-440f-a1d0-eaaa2b65b6e1') THEN
    RAISE EXCEPTION 'Creator profile not found';
  END IF;
END $$;

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
-- New York City
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','SoHo NYC Dim Sum Brunch Meetup','Weekend dim sum in SoHo—great for foodies who love Cantonese traditions and social brunch vibes. Meet new friends over baskets of fresh dumplings.',NOW() + INTERVAL '7 days','SoHo, Manhattan, New York, NY, USA',6,ARRAY['粤菜','点心','中餐'],NULL,'no_preference',ARRAY['社交','美食爱好者','轻松'], 'scheduled','normal','active',false),
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Upper West Side Vegan Ramen Night','Cozy vegan ramen night near Central Park. Perfect for plant-based diners looking to connect and share healthy, flavorful bowls.',NOW() + INTERVAL '9 days','Upper West Side, New York, NY, USA',4,ARRAY['素食','日餐','拉面'],ARRAY['素食主义'],'no_preference',ARRAY['健康意识','友好','分享'], 'scheduled','normal','active',false),
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Flushing Sichuan Street Food Tour','Explore authentic Sichuan street eats in Flushing—spicy skewers, noodles, and more. Ideal for adventurous palates and culture lovers.',NOW() + INTERVAL '12 days','Flushing, Queens, New York, NY, USA',8,ARRAY['川菜','小吃','中餐'],NULL,'no_preference',ARRAY['冒险','文化探索者','外向'], 'scheduled','normal','active',false),

-- Los Angeles
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Santa Monica Sunset Seafood Dinner','Watch the sunset and enjoy fresh seafood by the beach. Great for ocean lovers and relaxed conversations.',NOW() + INTERVAL '10 days','Santa Monica, Los Angeles, CA, USA',6,ARRAY['海鲜','西式','地中海'],NULL,'no_preference',ARRAY['放松','海滩爱好者','友好'], 'scheduled','normal','active',false),
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Downtown LA Taco Tuesday Social','Taco Tuesday crawl through DTLA—street tacos, salsa, and good company. Budget-friendly and fun!',NOW() + INTERVAL '13 days','Downtown, Los Angeles, CA, USA',8,ARRAY['墨西哥','街头小吃','玉米饼'],NULL,'no_preference',ARRAY['社交','热闹','随意'], 'scheduled','normal','active',false),
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Silver Lake Craft Beer & Bao Buns','Pair local craft beers with fluffy bao buns. Great for casual foodies who love new flavor combos.',NOW() + INTERVAL '14 days','Silver Lake, Los Angeles, CA, USA',6,ARRAY['精酿啤酒','小吃','中餐融合'],NULL,'no_preference',ARRAY['创意','随意','美食爱好者'], 'scheduled','normal','active',false),

-- San Francisco Bay Area
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Palo Alto Startup Founder Lunch','Network with founders over tasty fusion bowls—share product ideas and growth stories.',NOW() + INTERVAL '11 days','University Ave, Palo Alto, CA, USA',6,ARRAY['融合菜','健康','碗餐'],NULL,'no_preference',ARRAY['专业','人脉','上进'], 'scheduled','normal','active',false),
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Berkeley Vegetarian Noodle House Meetup','Affordable veggie noodles near campus. Ideal for students and mindful eaters.',NOW() + INTERVAL '8 days','Downtown, Berkeley, CA, USA',5,ARRAY['素食','面食','亚洲菜'],ARRAY['素食主义'],'no_preference',ARRAY['学生友好','健康意识','轻松'], 'scheduled','normal','active',false),
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Oakland Soul Food & Jazz Night','Soul food classics with a live jazz set—culture, comfort, and conversation.',NOW() + INTERVAL '16 days','Uptown, Oakland, CA, USA',6,ARRAY['美式','灵魂食物','炸鸡'],NULL,'no_preference',ARRAY['文化','音乐爱好者','热情'], 'scheduled','normal','active',false),

-- Chicago
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Wicker Park Brunch & Coffee Crawl','Third-wave coffee and brunch plates—walkable, photogenic spots for weekend vibes.',NOW() + INTERVAL '15 days','Wicker Park, Chicago, IL, USA',6,ARRAY['早午餐','咖啡','美式'],NULL,'no_preference',ARRAY['轻松','拍照打卡','社交'], 'scheduled','normal','active',false),
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','River North Steak Night Networking','Classic steakhouse dinner for professionals—connect over prime cuts and wine.',NOW() + INTERVAL '18 days','River North, Chicago, IL, USA',5,ARRAY['牛排','美式','红酒'],NULL,'no_preference',ARRAY['专业','人脉','稳重'], 'scheduled','normal','active',false),

-- Miami
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Wynwood Latin Tapas Crawl','Street art meets Latin tapas—colorful plates and lively conversations.',NOW() + INTERVAL '17 days','Wynwood, Miami, FL, USA',6,ARRAY['拉丁菜','小吃','融合菜'],NULL,'no_preference',ARRAY['活力','文化','社交'], 'scheduled','normal','active',false),
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Brickell Healthy Poke Bowl Lunch','Clean eating and quick networking for busy professionals.',NOW() + INTERVAL '19 days','Brickell, Miami, FL, USA',4,ARRAY['夏威夷碗','健康','海鲜'],ARRAY['无麸质'],'no_preference',ARRAY['效率','健康意识','专业'], 'scheduled','normal','active',false),

-- Seattle
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Fremont Pho & Board Games Night','Warm pho bowls and board games—cozy community vibes.',NOW() + INTERVAL '20 days','Fremont, Seattle, WA, USA',6,ARRAY['越南菜','河粉','亚洲菜'],NULL,'no_preference',ARRAY['友好','轻松','社群'], 'scheduled','normal','active',false),
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Ballard Oysters & IPA Pairing','Fresh oysters matched with local IPAs—seafood lovers welcome.',NOW() + INTERVAL '22 days','Ballard, Seattle, WA, USA',4,ARRAY['海鲜','生蚝','精酿啤酒'],NULL,'no_preference',ARRAY['海鲜控','品鉴','轻松'], 'scheduled','normal','active',false),

-- Boston
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Cambridge Student Hot Pot Night','Budget-friendly hot pot near MIT/Harvard—meet fellow students.',NOW() + INTERVAL '21 days','Central Square, Cambridge, MA, USA',8,ARRAY['火锅','川菜','中餐'],NULL,'no_preference',ARRAY['学生友好','外向','分享'], 'scheduled','normal','active',false),
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Back Bay Italian Pasta Night','Classic Italian pasta and tiramisu—comfort food done right.',NOW() + INTERVAL '23 days','Back Bay, Boston, MA, USA',5,ARRAY['意面','意餐','甜品'],NULL,'no_preference',ARRAY['传统','温暖','社交'], 'scheduled','normal','active',false),

-- Austin
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','South Congress Tex-Mex Fiesta','Queso, fajitas, and margaritas—Austin Tex-Mex essentials!',NOW() + INTERVAL '24 days','South Congress, Austin, TX, USA',8,ARRAY['德州-墨西哥','美式','玉米饼'],NULL,'no_preference',ARRAY['热闹','社交','音乐爱好者'], 'scheduled','normal','active',false),

-- Canada
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Toronto Chinatown Hot Pot Mixer','Meet global food lovers over classic hot pot in Chinatown.',NOW() + INTERVAL '12 days','Chinatown, Toronto, ON, Canada',6,ARRAY['火锅','川菜','中餐'],NULL,'no_preference',ARRAY['国际化','外向','友好'], 'scheduled','normal','active',false),
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Vancouver Sushi Omakase Night','Hand-picked omakase experience—fresh, seasonal, refined.',NOW() + INTERVAL '26 days','Downtown, Vancouver, BC, Canada',4,ARRAY['寿司','日餐','生食'],NULL,'no_preference',ARRAY['品鉴','安静','精致'], 'scheduled','normal','active',false),

-- United Kingdom
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','London Shoreditch Curry Night','Modern Indian curry house—bold flavors and great chats.',NOW() + INTERVAL '14 days','Shoreditch, London, UK',6,ARRAY['印度菜','咖喱','融合菜'],NULL,'no_preference',ARRAY['活力','文化','社交'], 'scheduled','normal','active',false), 
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Manchester NQ Neapolitan Pizza','Wood-fired Neapolitan-style pies—light, airy, delicious.',NOW() + INTERVAL '18 days','Northern Quarter, Manchester, UK',5,ARRAY['披萨','意餐','面饼'],NULL,'no_preference',ARRAY['随意','友好','分享'], 'scheduled','normal','active',false),

-- Europe
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Paris Le Marais Chinese Fusion Dinner','Trendy Chinese-fusion plates in the heart of Paris.',NOW() + INTERVAL '25 days','Le Marais, Paris, France',6,ARRAY['中餐融合','法餐','小盘菜'],NULL,'no_preference',ARRAY['精致','文化','拍照打卡'], 'scheduled','normal','active',false),
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Berlin Kreuzberg Ramen & Tech Talk','Slurp ramen and chat startups—informal tech community night.',NOW() + INTERVAL '16 days','Kreuzberg, Berlin, Germany',6,ARRAY['拉面','日餐','亚洲菜'],NULL,'no_preference',ARRAY['科技','社群','开放'], 'scheduled','normal','active',false),

-- Australia
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Sydney Surry Hills Yum Cha Brunch','Classic yum cha with modern twist—tea, buns, and laughs.',NOW() + INTERVAL '20 days','Surry Hills, Sydney, NSW, Australia',6,ARRAY['点心','粤菜','中餐'],NULL,'no_preference',ARRAY['轻松','社交','周末'], 'scheduled','normal','active',false),
('43271470-2b48-440f-a1d0-eaaa2b65b6e1','Melbourne CBD Dumpling Crawl','Try the city’s best dumpling spots—fast, tasty, affordable.',NOW() + INTERVAL '27 days','CBD, Melbourne, VIC, Australia',8,ARRAY['饺子','小吃','中餐'],NULL,'no_preference',ARRAY['活力','随意','快节奏'], 'scheduled','normal','active',false);
