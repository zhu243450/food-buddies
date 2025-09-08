import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { SEO } from '@/components/SEO';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChefHat, MapPin, Clock, Users, Star, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  area: string;
  rating: number;
  priceRange: string;
  specialDishes: string[];
  bestTime: string;
  groupSize: string;
  description: string;
}

interface CuisineGuide {
  name: string;
  description: string;
  characteristics: string[];
  mustTryDishes: string[];
  restaurants: Restaurant[];
}

interface CityInfo {
  name: string;
  description: string;
  popularCuisines: string[];
  popularAreas: string[];
  featuredRestaurants: Array<{
    name: string;
    cuisine: string;
    rating: number;
    area: string;
  }>;
  diningTips: string[];
  cuisineGuides: CuisineGuide[];
}

const cityData: Record<string, CityInfo> = {
  beijing: {
    name: '北京',
    description: '北京美食荟萃，从传统的北京烤鸭到各地特色菜，应有尽有。在这里找到志趣相投的饭友，一起探索京城美食。',
    popularCuisines: ['北京菜', '川菜', '粤菜', '湘菜', '东北菜', '西北菜'],
    popularAreas: ['三里屯', '国贸', '中关村', '望京', '西单', '王府井'],
    featuredRestaurants: [
      { name: '全聚德', cuisine: '北京菜', rating: 4.5, area: '前门' },
      { name: '海底捞', cuisine: '川菜', rating: 4.8, area: '三里屯' },
      { name: '鼎泰丰', cuisine: '台菜', rating: 4.6, area: '国贸' }
    ],
    diningTips: [
      '北京烤鸭是必尝美食，建议提前预约',
      '胡同里藏着很多地道小馆',
      '三里屯和国贸适合商务聚餐',
      '簋街是宵夜聚会的好去处'
    ],
    cuisineGuides: [
      {
        name: '川菜',
        description: '川菜是中国八大菜系之一，以麻辣鲜香著称，善用花椒、辣椒调味，菜品丰富多样。',
        characteristics: ['麻辣鲜香', '味型丰富', '调味多变', '荤素并重'],
        mustTryDishes: ['麻婆豆腐', '宫保鸡丁', '回锅肉', '鱼香肉丝', '水煮鱼'],
        restaurants: [
          {
            id: 'sichuan-1',
            name: '海底捞火锅',
            cuisine: '川菜火锅',
            area: '三里屯',
            rating: 4.8,
            priceRange: '￥80-120/人',
            specialDishes: ['毛肚', '鸭肠', '虾滑'],
            bestTime: '晚餐',
            groupSize: '2-8人',
            description: '服务贴心的火锅连锁，适合朋友聚会和约会。'
          },
          {
            id: 'sichuan-2',
            name: '眉州东坡',
            cuisine: '川菜',
            area: '国贸',
            rating: 4.5,
            priceRange: '￥60-100/人',
            specialDishes: ['东坡肘子', '毛血旺', '口水鸡'],
            bestTime: '午餐/晚餐',
            groupSize: '3-6人',
            description: '正宗川菜连锁，环境雅致，适合商务聚餐。'
          }
        ]
      },
      {
        name: '北京菜',
        description: '北京菜融合了鲁菜、宫廷菜和民间菜的特色，口味醇厚，制作精细。',
        characteristics: ['口味醇厚', '制作精细', '历史悠久', '宫廷特色'],
        mustTryDishes: ['北京烤鸭', '炸酱面', '豆汁', '卤煮火烧', '京酱肉丝'],
        restaurants: [
          {
            id: 'beijing-1',
            name: '全聚德',
            cuisine: '北京菜',
            area: '前门',
            rating: 4.5,
            priceRange: '￥150-250/人',
            specialDishes: ['北京烤鸭', '宫保鸡丁', '糖醋里脊'],
            bestTime: '午餐/晚餐',
            groupSize: '4-8人',
            description: '百年老字号，北京烤鸭的代表，适合家庭聚会。'
          }
        ]
      }
    ]
  },
  shanghai: {
    name: '上海',
    description: '上海融合了江南美食和国际美食，从本帮菜到各国料理，满足不同口味需求。与上海饭友一起品味摩登都市美食文化。',
    popularCuisines: ['本帮菜', '淮扬菜', '西餐', '日料', '韩料', '东南亚菜'],
    popularAreas: ['陆家嘴', '徐家汇', '静安寺', '新天地', '外滩', '田子坊'],
    featuredRestaurants: [
      { name: '老正兴', cuisine: '本帮菜', rating: 4.4, area: '豫园' },
      { name: '鹅夫人', cuisine: '西餐', rating: 4.7, area: '新天地' },
      { name: '小南国', cuisine: '粤菜', rating: 4.5, area: '陆家嘴' }
    ],
    diningTips: [
      '本帮菜偏甜，适合精致聚餐',
      '新天地和田子坊有很多网红餐厅',
      '外滩景观餐厅适合浪漫约会',
      '生煎包和小笼包是经典小食'
    ],
    cuisineGuides: [
      {
        name: '本帮菜',
        description: '本帮菜是上海地区传统菜系，口味偏甜，制作精细，注重食材的新鲜。',
        characteristics: ['口味偏甜', '制作精细', '注重食材', '江南特色'],
        mustTryDishes: ['红烧肉', '白切鸡', '糖醋排骨', '蒸蛋羹', '上海菜饭'],
        restaurants: [
          {
            id: 'benbang-1',
            name: '老正兴',
            cuisine: '本帮菜',
            area: '豫园',
            rating: 4.4,
            priceRange: '￥80-150/人',
            specialDishes: ['红烧肉', '白切鸡', '糖醋排骨'],
            bestTime: '午餐/晚餐',
            groupSize: '2-6人',
            description: '百年老字号，正宗本帮菜，环境典雅。'
          }
        ]
      },
      {
        name: '西餐',
        description: '上海西餐文化发达，从法式到意式，各种风格应有尽有。',
        characteristics: ['国际化', '精致摆盘', '氛围优雅', '价位较高'],
        mustTryDishes: ['牛排', '意面', '法式焗蜗牛', '提拉米苏', '红酒'],
        restaurants: [
          {
            id: 'western-1',
            name: '鹅夫人',
            cuisine: '西餐',
            area: '新天地',
            rating: 4.7,
            priceRange: '￥200-400/人',
            specialDishes: ['法式鹅肝', '牛排', '红酒'],
            bestTime: '晚餐',
            groupSize: '2-4人',
            description: '高端西餐厅，环境优雅，适合商务宴请。'
          }
        ]
      }
    ]
  },
  guangzhou: {
    name: '广州',
    description: '广州是粤菜发源地，早茶文化深厚。在花城找到同样热爱美食的朋友，一起享受正宗的粤式美食体验。',
    popularCuisines: ['粤菜', '潮汕菜', '客家菜', '港式茶餐厅', '湘菜', '川菜'],
    popularAreas: ['天河', '珠江新城', '北京路', '上下九', '番禺', '荔湾'],
    featuredRestaurants: [
      { name: '白天鹅宾馆', cuisine: '粤菜', rating: 4.6, area: '荔湾' },
      { name: '点都德', cuisine: '茶餐厅', rating: 4.5, area: '天河' },
      { name: '炳胜', cuisine: '粤菜', rating: 4.4, area: '珠江新城' }
    ],
    diningTips: [
      '早茶是广州特色，建议上午品尝',
      '白切鸡、烧鹅是经典粤菜',
      '上下九步行街有很多老字号',
      '夜宵文化丰富，推荐宵夜聚会'
    ],
    cuisineGuides: [
      {
        name: '粤菜',
        description: '粤菜注重原汁原味，选料精细，制作精良，以清、鲜、爽、嫩、滑为特色。',
        characteristics: ['清淡鲜美', '注重食材', '制作精细', '营养搭配'],
        mustTryDishes: ['白切鸡', '烧鹅', '蒸蛋羹', '广式点心', '老火汤'],
        restaurants: [
          {
            id: 'cantonese-1',
            name: '点都德',
            cuisine: '粤菜茶餐厅',
            area: '天河',
            rating: 4.6,
            priceRange: '￥50-80/人',
            specialDishes: ['虾饺', '烧卖', '叉烧包'],
            bestTime: '早茶/午餐',
            groupSize: '2-6人',
            description: '港式茶餐厅，早茶文化体验首选。'
          },
          {
            id: 'cantonese-2',
            name: '炳胜',
            cuisine: '粤菜',
            area: '珠江新城',
            rating: 4.7,
            priceRange: '￥100-200/人',
            specialDishes: ['白切鸡', '蒸石斑鱼', '广式煲汤'],
            bestTime: '午餐/晚餐',
            groupSize: '4-8人',
            description: '高端粤菜餐厅，适合商务宴请和家庭聚会。'
          }
        ]
      }
    ]
  },
  shenzhen: {
    name: '深圳',
    description: '深圳汇聚了全国各地美食，年轻活力的城市氛围。与志同道合的朋友探索这座创新之城的美食地图。',
    popularCuisines: ['粤菜', '川菜', '湘菜', '东北菜', '西餐', '日韩料理'],
    popularAreas: ['南山', '福田', '罗湖', '宝安', '龙华', '前海'],
    featuredRestaurants: [
      { name: '探鱼', cuisine: '川菜', rating: 4.5, area: '南山' },
      { name: '太二酸菜鱼', cuisine: '川菜', rating: 4.6, area: '福田' },
      { name: '外婆家', cuisine: '杭帮菜', rating: 4.3, area: '罗湖' }
    ],
    diningTips: [
      '科技园和前海适合商务聚餐',
      '海鲜是深圳特色，推荐沙井蚝',
      '各大商场美食街选择丰富',
      '夜生活丰富，适合朋友聚会'
    ],
    cuisineGuides: [
      {
        name: '川菜',
        description: '川菜是中国八大菜系之一，以麻辣鲜香著称，善用花椒、辣椒调味，菜品丰富多样。',
        characteristics: ['麻辣鲜香', '味型丰富', '调味多变', '荤素并重'],
        mustTryDishes: ['麻婆豆腐', '宫保鸡丁', '回锅肉', '鱼香肉丝', '水煮鱼'],
        restaurants: [
          {
            id: 'sz-sichuan-1',
            name: '探鱼',
            cuisine: '川菜',
            area: '南山',
            rating: 4.5,
            priceRange: '￥60-100/人',
            specialDishes: ['酸菜鱼', '毛血旺', '口水鸡'],
            bestTime: '晚餐',
            groupSize: '2-6人',
            description: '年轻时尚的川菜品牌，环境轻松，适合朋友聚会。'
          }
        ]
      }
    ]
  }
};

export const CombinedFoodGuide: React.FC = () => {
  const { city: urlCity } = useParams<{ city?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(urlCity || 'beijing');
  
  const currentCityData = cityData[selectedCity];
  const seoData = getPageSEO(urlCity ? 'city' : 'foodGuide', urlCity ? { city: currentCityData?.name, cityKey: selectedCity } : undefined);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Update URL when city changes
  useEffect(() => {
    if (urlCity && urlCity !== selectedCity) {
      setSelectedCity(urlCity);
    }
  }, [urlCity]);

  const handleCityChange = (newCity: string) => {
    setSelectedCity(newCity);
    if (urlCity) {
      navigate(`/city/${newCity}`);
    } else {
      navigate(`/food-guide?city=${newCity}`);
    }
  };

  if (!currentCityData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">城市页面未找到</h1>
          <Link to="/discover">
            <Button>返回发现页面</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO {...seoData} />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            <ChefHat className="inline-block h-10 w-10 mr-3 text-primary" />
            {urlCity ? `${currentCityData.name}美食社交指南` : '美食指南'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {currentCityData.description}
          </p>
          
          {/* City Selector */}
          <div className="flex justify-center mb-8">
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(cityData).map(([key, data]) => (
                  <SelectItem key={key} value={key}>
                    <MapPin className="h-4 w-4 inline mr-2" />
                    {data.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center gap-4">
            {!loading && (
              user ? (
                <>
                  <Link to="/my-dinners">
                    <Button size="lg" className="gap-2">
                      <Users className="h-5 w-5" />
                      我的饭局
                    </Button>
                  </Link>
                  <Link to="/create-dinner">
                    <Button variant="outline" size="lg" className="gap-2">
                      <Utensils className="h-5 w-5" />
                      创建饭局
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button size="lg">立即注册</Button>
                  </Link>
                  <Link to="/discover">
                    <Button variant="outline" size="lg">浏览饭局</Button>
                  </Link>
                </>
              )
            )}
          </div>
        </section>

        {/* Popular Cuisines */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">热门菜系</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {currentCityData.popularCuisines.map((cuisine) => (
              <Card key={cuisine} className="text-center hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <Utensils className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-foreground">{cuisine}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Popular Areas */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">热门区域</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {currentCityData.popularAreas.map((area) => (
              <Badge key={area} variant="secondary" className="p-3 text-center justify-center">
                <MapPin className="h-4 w-4 mr-1" />
                {area}
              </Badge>
            ))}
          </div>
        </section>

        {/* Cuisine Guide Tabs */}
        {currentCityData.cuisineGuides && currentCityData.cuisineGuides.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">菜系详解</h2>
            <Tabs defaultValue={currentCityData.cuisineGuides[0]?.name} className="w-full">
              <TabsList className={`grid w-full ${currentCityData.cuisineGuides.length <= 3 ? 'grid-cols-' + currentCityData.cuisineGuides.length : 'grid-cols-3'} mb-8`}>
                {currentCityData.cuisineGuides.map((guide) => (
                  <TabsTrigger key={guide.name} value={guide.name}>
                    {guide.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {currentCityData.cuisineGuides.map((guide) => (
                <TabsContent key={guide.name} value={guide.name} className="space-y-8">
                  {/* Cuisine Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">{guide.name}特色</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-6">{guide.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-foreground mb-3">菜系特点</h4>
                          <div className="flex flex-wrap gap-2">
                            {guide.characteristics.map((char) => (
                              <Badge key={char} variant="secondary">{char}</Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-foreground mb-3">必尝菜品</h4>
                          <div className="flex flex-wrap gap-2">
                            {guide.mustTryDishes.map((dish) => (
                              <Badge key={dish} variant="outline">{dish}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommended Restaurants */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-6">推荐餐厅</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {guide.restaurants.map((restaurant) => (
                        <Card key={restaurant.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>{restaurant.name}</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{restaurant.rating}</span>
                              </div>
                            </CardTitle>
                            <Badge variant="outline" className="w-fit">{restaurant.cuisine}</Badge>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-muted-foreground">{restaurant.description}</p>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{restaurant.area}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{restaurant.bestTime}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{restaurant.groupSize}</span>
                              </div>
                              <div className="font-medium text-primary">
                                {restaurant.priceRange}
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-foreground mb-2">招牌菜品</h5>
                              <div className="flex flex-wrap gap-1">
                                {restaurant.specialDishes.map((dish) => (
                                  <Badge key={dish} variant="secondary" className="text-xs">
                                    {dish}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </section>
        )}

        {/* Featured Restaurants */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">推荐餐厅</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCityData.featuredRestaurants.map((restaurant) => (
              <Card key={restaurant.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{restaurant.name}</span>
                    <Badge variant="outline">{restaurant.cuisine}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    {restaurant.area}
                  </p>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium">{restaurant.rating}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Dining Tips */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {urlCity ? '美食贴士' : '聚餐小贴士'}
          </h2>
          {urlCity ? (
            <div className="grid md:grid-cols-2 gap-4">
              {currentCityData.diningTips.map((tip, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <p className="text-foreground">{tip}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    人数选择
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• 2-3人：适合精致餐厅，深度交流</li>
                    <li>• 4-6人：适合火锅、烧烤等互动性强的</li>
                    <li>• 6人以上：建议选择包间或大桌</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    时间安排
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• 工作日午餐：12:00-13:30</li>
                    <li>• 周末早茶：10:00-14:00</li>
                    <li>• 晚餐聚会：18:00-21:00</li>
                    <li>• 夜宵时间：21:00-23:00</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    点餐建议
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• 提前了解餐厅特色菜</li>
                    <li>• 考虑食客饮食偏好和禁忌</li>
                    <li>• 荤素搭配，营养均衡</li>
                    <li>• 预算透明，AA制说明</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            开启你的{urlCity ? currentCityData.name : ''}美食社交之旅
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {urlCity 
              ? `立即加入饭约社，与志趣相投的朋友一起探索${currentCityData.name}美食`
              : '加入饭约社，与志趣相投的朋友一起探索美食世界'
            }
          </p>
          <div className="flex justify-center gap-4">
            {!loading && (
              user ? (
                <>
                  <Link to="/my-dinners">
                    <Button size="lg" className="gap-2">
                      <Users className="h-5 w-5" />
                      我的饭局
                    </Button>
                  </Link>
                  <Link to="/create-dinner">
                    <Button variant="outline" size="lg" className="gap-2">
                      <Utensils className="h-5 w-5" />
                      创建饭局
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button size="lg">立即注册</Button>
                  </Link>
                  <Link to="/discover">
                    <Button variant="outline" size="lg">浏览饭局</Button>
                  </Link>
                </>
              )
            )}
          </div>
        </section>
      </main>
    </div>
  );
};