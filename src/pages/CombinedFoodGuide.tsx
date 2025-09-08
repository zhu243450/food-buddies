import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { SEO } from '@/components/SEO';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, MapPin, Clock, Users, Star, Utensils, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { RestaurantDetailDialog } from '@/components/RestaurantDetailDialog';
import { RegionSelector } from '@/components/RegionSelector';
import { RestaurantCard } from '@/components/RestaurantCard';
import { SmallRestaurantCard } from '@/components/SmallRestaurantCard';
import { useAuth } from '@/hooks/useAuth';

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

interface Division {
  id: string;
  name: string;
  code: string;
  level: 'province' | 'city' | 'county' | 'town';
  parent_id: string | null;
}

interface RegionInfo {
  id: string;
  name: string;
  description: string;
  path: Division[];
  cuisineGuides: CuisineGuide[];
  featuredRestaurants: Restaurant[];
}

export const CombinedFoodGuide: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(
    searchParams.get('divisionId')
  );
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isRestaurantDialogOpen, setIsRestaurantDialogOpen] = useState(false);
  
  // 缓存区域数据
  const [regionCache, setRegionCache] = useState<Record<string, RegionInfo>>({});
  
  const seoData = getPageSEO('foodGuide', regionInfo ? { 
    city: regionInfo.name, 
    cityKey: regionInfo.path[regionInfo.path.length - 1]?.name || '' 
  } : undefined);

  // Load region data from database with caching
  const loadRegionData = useCallback(async (divisionId: string) => {
    // 检查缓存
    if (regionCache[divisionId]) {
      setRegionInfo(regionCache[divisionId]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get division info and path
      const { data: divisionPath, error: pathError } = await supabase
        .rpc('get_division_path', { division_id_param: divisionId });
      
      if (pathError) throw pathError;
      
      const currentDivision = divisionPath?.[0];
      if (!currentDivision) {
        throw new Error('Division not found');
      }

      // Get all descendant divisions for restaurant filtering
      const { data: descendants, error: descendantsError } = await supabase
        .rpc('get_division_descendants', { division_id_param: divisionId });
      
      if (descendantsError) throw descendantsError;
      
      const descendantIds = [divisionId, ...(descendants || []).map(d => d.id)];

      // Get restaurants for this region and all its sub-regions
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .in('division_id', descendantIds)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('display_order')
        .order('name');
      
      if (restaurantsError) throw restaurantsError;

      // Get cuisine guides (use city-level guides or create default ones)
      let cuisineGuides: CuisineGuide[] = [];
      
      // Try to find a city-level division in the path for cuisine guides
      const cityDivision = divisionPath?.find(d => d.level === 'city');
      if (cityDivision) {
        const { data: existingCity } = await supabase
          .from('cities')
          .select('*')
          .ilike('name', `%${cityDivision.name}%`)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (existingCity) {
          const { data: cuisinesData } = await supabase
            .from('cuisine_guides')
            .select('*')
            .eq('city_id', existingCity.id)
            .eq('is_active', true)
            .order('display_order')
            .order('name');

          cuisineGuides = (cuisinesData || []).map(cuisine => {
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
        }
      }

      // If no cuisine guides found, create default ones based on restaurants
      if (cuisineGuides.length === 0 && restaurantsData) {
        const uniqueCuisines = [...new Set(restaurantsData.map(r => r.cuisine))];
        cuisineGuides = uniqueCuisines.map(cuisine => ({
          id: `default-${cuisine}`,
          name: cuisine,
          description: `${cuisine}餐厅推荐`,
          characteristics: [],
          must_try_dishes: [],
          restaurants: restaurantsData.filter(r => r.cuisine === cuisine)
        }));
      }

      const pathArray: Division[] = (divisionPath || []).reverse().map(d => ({
        id: d.id,
        name: d.name,
        code: '',
        level: d.level as Division['level'],
        parent_id: null
      }));

      const newRegionInfo = {
        id: currentDivision.id,
        name: currentDivision.name,
        description: `${currentDivision.name}美食指南，发现地道美食，结交志同道合的朋友`,
        path: pathArray,
        cuisineGuides,
        featuredRestaurants: (restaurantsData || []).filter(r => r.is_featured)
      };
      
      setRegionInfo(newRegionInfo);
      // 缓存区域数据
      setRegionCache(prev => ({ ...prev, [divisionId]: newRegionInfo }));
      
    } catch (error: any) {
      console.error('Failed to load region data:', error);
      toast({
        title: "加载失败",
        description: "无法加载区域数据，请刷新页面重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [regionCache]);

  // Load default data (Beijing) if no division is selected
  const loadDefaultData = async () => {
    try {
      // Find Beijing division
      const { data: beijingDivision, error } = await supabase
        .from('administrative_divisions')
        .select('id')
        .eq('name', '北京市')
        .eq('level', 'city')
        .single();

      if (error) throw error;

      if (beijingDivision) {
        setSelectedDivisionId(beijingDivision.id);
        await loadRegionData(beijingDivision.id);
      }
    } catch (error) {
      console.error('Failed to load default data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const divisionId = searchParams.get('divisionId');
    if (divisionId) {
      setSelectedDivisionId(divisionId);
      loadRegionData(divisionId);
    } else {
      loadDefaultData();
    }
  }, [searchParams, loadRegionData]);

  const handleRegionChange = useCallback((divisionId: string | null, divisionPath: Division[]) => {
    setSelectedDivisionId(divisionId);
    
    if (divisionId) {
      navigate(`/food-guide?divisionId=${divisionId}`);
      loadRegionData(divisionId);
    } else {
      navigate('/food-guide');
      setRegionInfo(null);
      loadDefaultData();
    }
  }, [navigate, loadRegionData]);

  const handleRestaurantClick = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsRestaurantDialogOpen(true);
  }, []);

  // 使用 useMemo 优化计算
  const currentRegionName = useMemo(() => 
    regionInfo ? 
      (regionInfo.path.length > 0 ? regionInfo.path[regionInfo.path.length - 1].name : regionInfo.name) : 
      '全国'
  , [regionInfo]);
  
  const regionDescription = useMemo(() => 
    regionInfo?.description || '发现全国各地美食，结交志同道合的朋友'
  , [regionInfo]);

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

  return (
    <div className="min-h-screen bg-background">
      <SEO {...seoData} />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            <ChefHat className="inline-block h-10 w-10 mr-3 text-primary" />
            {currentRegionName}美食社交指南
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {regionDescription}
          </p>
          
          {/* Region Path Breadcrumb */}
          {regionInfo && regionInfo.path.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-8">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {regionInfo.path.map((division, index) => (
                  <React.Fragment key={division.id}>
                    <span>{division.name}</span>
                    {index < regionInfo.path.length - 1 && (
                      <span className="text-xs">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
          
          {/* Region Selector */}
          <div className="mb-8">
            <RegionSelector
              selectedDivisionId={selectedDivisionId || undefined}
              onSelectionChange={handleRegionChange}
              placeholder="选择区域"
            />
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

        {/* Featured Restaurants */}
        {regionInfo && regionInfo.featuredRestaurants.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">精选餐厅</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regionInfo.featuredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={handleRestaurantClick}
                />
              ))}
            </div>
          </section>
        )}

        {/* Cuisine Guide Tabs */}
        {regionInfo && regionInfo.cuisineGuides && regionInfo.cuisineGuides.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">菜系详解</h2>
            <Tabs defaultValue={regionInfo.cuisineGuides[0]?.id} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                {regionInfo.cuisineGuides.slice(0, 4).map((guide) => (
                  <TabsTrigger key={guide.id} value={guide.id}>
                    {guide.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {regionInfo.cuisineGuides.map((guide) => (
                <TabsContent key={guide.id} value={guide.id} className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Utensils className="h-6 w-6 text-primary" />
                        {guide.name}
                      </CardTitle>
                      <p className="text-muted-foreground">{guide.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {guide.characteristics.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">菜系特色</h4>
                          <div className="flex flex-wrap gap-2">
                            {guide.characteristics.map((char, index) => (
                              <Badge key={index} variant="outline">
                                {char}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {guide.must_try_dishes.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">必尝菜品</h4>
                          <div className="flex flex-wrap gap-2">
                            {guide.must_try_dishes.map((dish, index) => (
                              <Badge key={index} variant="secondary">
                                {dish}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {guide.restaurants.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">推荐餐厅</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {guide.restaurants.slice(0, 4).map((restaurant) => (
                              <SmallRestaurantCard
                                key={restaurant.id}
                                restaurant={restaurant}
                                onClick={handleRestaurantClick}
                              />
                            ))}
                          </div>
                          {guide.restaurants.length > 4 && (
                            <p className="text-sm text-muted-foreground text-center mt-4">
                              还有 {guide.restaurants.length - 4} 家餐厅...
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </section>
        )}

        {/* Dining Tips */}
        {regionInfo && regionInfo.path.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">用餐贴士</h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2 mt-1">
                      <Utensils className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-foreground">推荐提前预约热门餐厅</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2 mt-1">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-foreground">避开用餐高峰期</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2 mt-1">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-foreground">适合社交聚餐</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      <RestaurantDetailDialog
        restaurant={selectedRestaurant}
        open={isRestaurantDialogOpen}
        onOpenChange={setIsRestaurantDialogOpen}
      />
    </div>
  );
};