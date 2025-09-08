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
import { ChefHat, MapPin, Clock, Users, Star, Utensils, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  area: string;
  rating: number;
  price_range: string;
  special_dishes: string[];
  best_time: string;
  group_size: string;
  description: string;
  is_featured: boolean;
  is_active: boolean;
}

interface CuisineGuide {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  must_try_dishes: string[];
  restaurants: Restaurant[];
}

interface CityInfo {
  id: string;
  key: string;
  name: string;
  description: string;
  popular_cuisines: string[];
  popular_areas: string[];
  dining_tips: string[];
  is_active: boolean;
  cuisineGuides: CuisineGuide[];
  featuredRestaurants: Restaurant[];
}

const cityData: Record<string, CityInfo> = {};

export const CombinedFoodGuide: React.FC = () => {
  const { city: urlCity } = useParams<{ city?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [selectedCity, setSelectedCity] = useState(urlCity || 'beijing');
  
  const currentCityData = cities.find(c => c.key === selectedCity);
  const seoData = getPageSEO(urlCity ? 'city' : 'foodGuide', urlCity && currentCityData ? { city: currentCityData.name, cityKey: selectedCity } : undefined);

  // Load cities data from database
  const loadCitiesData = async () => {
    try {
      setLoading(true);
      
      // Get cities
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
        .order('name');
      
      if (citiesError) throw citiesError;
      
      const citiesWithData: CityInfo[] = await Promise.all(
        (citiesData || []).map(async (city) => {
          // Get restaurants for this city
          const { data: restaurantsData, error: restaurantsError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('city_id', city.id)
            .eq('is_active', true)
            .order('is_featured', { ascending: false })
            .order('display_order')
            .order('name');
          
          if (restaurantsError) throw restaurantsError;
          
          // Get cuisine guides for this city
          const { data: cuisinesData, error: cuisinesError } = await supabase
            .from('cuisine_guides')
            .select('*')
            .eq('city_id', city.id)
            .eq('is_active', true)
            .order('display_order')
            .order('name');
          
          if (cuisinesError) throw cuisinesError;
          
          // Group restaurants by cuisine for cuisine guides
          const cuisineGuides: CuisineGuide[] = (cuisinesData || []).map(cuisine => {
            const cuisineRestaurants = (restaurantsData || []).filter(r => 
              r.cuisine.toLowerCase().includes(cuisine.name.toLowerCase()) ||
              cuisine.name.toLowerCase().includes(r.cuisine.toLowerCase())
            );
            
            return {
              id: cuisine.id,
              name: cuisine.name,
              description: cuisine.description,
              characteristics: cuisine.characteristics || [],
              must_try_dishes: cuisine.must_try_dishes || [],
              restaurants: cuisineRestaurants
            };
          });
          
          return {
            id: city.id,
            key: city.key,
            name: city.name,
            description: city.description,
            popular_cuisines: city.popular_cuisines || [],
            popular_areas: city.popular_areas || [],
            dining_tips: city.dining_tips || [],
            is_active: city.is_active,
            cuisineGuides,
            featuredRestaurants: (restaurantsData || []).filter(r => r.is_featured)
          };
        })
      );
      
      setCities(citiesWithData);
      
      // Set default city if URL doesn't specify one
      if (!urlCity && citiesWithData.length > 0) {
        setSelectedCity(citiesWithData[0].key);
      }
      
    } catch (error: any) {
      console.error('Failed to load cities data:', error);
      toast({
        title: "加载失败",
        description: "无法加载城市数据，请刷新页面重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCitiesData();
  }, []);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

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
                {cities.map((city) => (
                  <SelectItem key={city.key} value={city.key}>
                    <MapPin className="h-4 w-4 inline mr-2" />
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center gap-4">
            {user ? (
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
            )}
          </div>
        </section>

        {/* Popular Cuisines */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">热门菜系</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {currentCityData.popular_cuisines.map((cuisine) => (
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
            {currentCityData.popular_areas.map((area) => (
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
                            {guide.must_try_dishes.map((dish) => (
                              <Badge key={dish} variant="outline">{dish}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommended Restaurants */}
                  {guide.restaurants && guide.restaurants.length > 0 && (
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
                                  <span>{restaurant.best_time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span>{restaurant.group_size}</span>
                                </div>
                                <div className="font-medium text-primary">
                                  {restaurant.price_range}
                                </div>
                              </div>
                              
                              <div>
                                <h5 className="font-medium text-foreground mb-2">招牌菜品</h5>
                                <div className="flex flex-wrap gap-1">
                                  {restaurant.special_dishes.map((dish) => (
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
                  )}
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
              <Card key={restaurant.id} className="hover:shadow-lg transition-shadow">
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
              {currentCityData.dining_tips.map((tip, index) => (
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
            {user ? (
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
            )}
          </div>
        </section>
      </main>
    </div>
  );
};