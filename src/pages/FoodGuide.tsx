import React from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { SEO } from '@/components/SEO';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, MapPin, Clock, Users, Star, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

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

const cuisineGuides: CuisineGuide[] = [
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
        area: '全城多店',
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
        area: '商圈',
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
    name: '粤菜',
    description: '粤菜注重原汁原味，选料精细，制作精良，以清、鲜、爽、嫩、滑为特色。',
    characteristics: ['清淡鲜美', '注重食材', '制作精细', '营养搭配'],
    mustTryDishes: ['白切鸡', '烧鹅', '蒸蛋羹', '广式点心', '老火汤'],
    restaurants: [
      {
        id: 'cantonese-1',
        name: '点都德',
        cuisine: '粤菜茶餐厅',
        area: '商圈',
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
        area: '高端商圈',
        rating: 4.7,
        priceRange: '￥100-200/人',
        specialDishes: ['白切鸡', '蒸石斑鱼', '广式煲汤'],
        bestTime: '午餐/晚餐',
        groupSize: '4-8人',
        description: '高端粤菜餐厅，适合商务宴请和家庭聚会。'
      }
    ]
  },
  {
    name: '日料',
    description: '日式料理注重季节感，追求食材的新鲜和原味，制作工艺精致。',
    characteristics: ['新鲜食材', '制作精致', '季节性强', '摆盘美观'],
    mustTryDishes: ['寿司', '刺身', '天妇罗', '拉面', '日式烤肉'],
    restaurants: [
      {
        id: 'japanese-1',
        name: '和民',
        cuisine: '日式居酒屋',
        area: '商圈',
        rating: 4.4,
        priceRange: '￥80-120/人',
        specialDishes: ['烤鸡串', '日式炸鸡', '清酒'],
        bestTime: '晚餐/夜宵',
        groupSize: '2-6人',
        description: '日式居酒屋，氛围轻松，适合朋友小聚。'
      },
      {
        id: 'japanese-2',
        name: '松子日式料理',
        cuisine: '日料',
        area: '高端区域',
        rating: 4.8,
        priceRange: '￥150-300/人',
        specialDishes: ['刺身拼盘', '寿司套餐', '和牛'],
        bestTime: '晚餐',
        groupSize: '2-4人',
        description: '高端日料，食材新鲜，适合商务宴请。'
      }
    ]
  }
];

export const FoodGuide: React.FC = () => {
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  
  const seoData = getPageSEO('foodGuide');
  
  return (
    <div className="min-h-screen bg-background">
      <SEO {...seoData} />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            <ChefHat className="inline-block h-10 w-10 mr-3 text-primary" />
            美食指南
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            探索各大菜系特色，发现最佳用餐地点，与志趣相投的朋友分享美食体验
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/discover">
              <Button size="lg" className="gap-2">
                <Users className="h-5 w-5" />
                发现饭局
              </Button>
            </Link>
            <Link to="/create-dinner">
              <Button variant="outline" size="lg" className="gap-2">
                <Utensils className="h-5 w-5" />
                创建饭局
              </Button>
            </Link>
          </div>
        </section>

        {/* Cuisine Guide Tabs */}
        <section className="mb-12">
          <Tabs defaultValue="川菜" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              {cuisineGuides.map((guide) => (
                <TabsTrigger key={guide.name} value={guide.name}>
                  {guide.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {cuisineGuides.map((guide) => (
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

        {/* Dining Tips Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">聚餐小贴士</h2>
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
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            开启你的美食社交之旅
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            加入饭约社，与志趣相投的朋友一起探索美食世界
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/auth">
              <Button size="lg">立即注册</Button>
            </Link>
            <Link to="/discover">
              <Button variant="outline" size="lg">浏览饭局</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};