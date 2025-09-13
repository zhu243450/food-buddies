import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { SEO } from '@/components/SEO';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, Utensils, MapPin, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  price_range: string;
  description: string;
}

export const CombinedFoodGuide: React.FC = () => {
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const seoData = getPageSEO('foodGuide');

  // 模拟数据
  const featuredRestaurants: Restaurant[] = [
    {
      id: '1',
      name: '老北京炸酱面',
      cuisine: '北京菜',
      rating: 4.5,
      price_range: '￥50-100',
      description: '正宗北京炸酱面，传统手工制作'
    },
    {
      id: '2', 
      name: '川味火锅',
      cuisine: '川菜',
      rating: 4.7,
      price_range: '￥100-200',
      description: '地道四川火锅，麻辣鲜香'
    },
    {
      id: '3',
      name: '粤式茶餐厅',
      cuisine: '粤菜',
      rating: 4.3,
      price_range: '￥80-150',
      description: '精致粤菜，港式茶点'
    }
  ];

  const cuisineGuides = [
    {
      id: 'sichuan',
      name: '川菜',
      description: '以麻辣鲜香著称的川菜，是中国八大菜系之一',
      restaurants: featuredRestaurants.filter(r => r.cuisine === '川菜')
    },
    {
      id: 'beijing',
      name: '北京菜',
      description: '融合宫廷菜与民间菜的北京菜，历史悠久',
      restaurants: featuredRestaurants.filter(r => r.cuisine === '北京菜')
    },
    {
      id: 'cantonese',
      name: '粤菜',
      description: '注重原汁原味，制作精细的粤菜',
      restaurants: featuredRestaurants.filter(r => r.cuisine === '粤菜')
    }
  ];

  useEffect(() => {
    // 模拟加载过程
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('foodGuide.loading')}</p>
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
        <section className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t('foodGuide.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('foodGuide.defaultDescription')}
          </p>
        </section>

        {/* Featured Restaurants */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('foodGuide.featuredRestaurants')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-muted-foreground">{restaurant.rating}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{restaurant.cuisine}</span>
                    </div>
                    <div className="text-sm font-medium text-primary">
                      {restaurant.price_range}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {restaurant.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Cuisine Guides */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('foodGuide.cuisineGuide')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {cuisineGuides.map((guide) => (
              <Card key={guide.id}>
                <CardHeader>
                  <CardTitle>{guide.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {guide.description}
                  </p>
                  {guide.restaurants.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">{t('foodGuide.recommendedRestaurants')}</h4>
                      {guide.restaurants.map((restaurant) => (
                        <div key={restaurant.id} className="text-sm text-muted-foreground">
                          • {restaurant.name}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Dining Tips */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t('foodGuide.diningTips')}
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-1">
                    <Utensils className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-foreground">{t('foodGuide.bookingTip')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-1">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-foreground">{t('foodGuide.avoidPeakTip')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-1">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-foreground">{t('foodGuide.socialDiningTip')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action */}
        {!user && (
          <section className="text-center">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">加入我们</h3>
                <p className="text-muted-foreground mb-4">
                  注册账号，发现更多美食，结交志同道合的朋友
                </p>
                <Button className="w-full">
                  {t('foodGuide.registerNow')}
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
};