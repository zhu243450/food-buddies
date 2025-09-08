import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { SEO } from '@/components/SEO';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Utensils, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    ]
  }
};

export const CityPage: React.FC = () => {
  const { city } = useParams<{ city: string }>();
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  
  const cityInfo = city ? cityData[city] : null;
  
  if (!cityInfo) {
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
  
  const seoData = getPageSEO('city', { city: cityInfo.name, cityKey: city });
  
  return (
    <div className="min-h-screen bg-background">
      <SEO {...seoData} />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {cityInfo.name}美食社交指南
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {cityInfo.description}
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

        {/* Popular Cuisines */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">热门菜系</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cityInfo.popularCuisines.map((cuisine) => (
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
            {cityInfo.popularAreas.map((area) => (
              <Badge key={area} variant="secondary" className="p-3 text-center justify-center">
                <MapPin className="h-4 w-4 mr-1" />
                {area}
              </Badge>
            ))}
          </div>
        </section>

        {/* Featured Restaurants */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">推荐餐厅</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cityInfo.featuredRestaurants.map((restaurant) => (
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
          <h2 className="text-2xl font-bold text-foreground mb-6">美食贴士</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {cityInfo.diningTips.map((tip, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <p className="text-foreground">{tip}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            开始你的{cityInfo.name}美食之旅
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            立即加入饭约社，与志趣相投的朋友一起探索{cityInfo.name}美食
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