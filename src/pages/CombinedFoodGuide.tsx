import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy, useRef, startTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { SEO } from '@/components/SEO';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Users, Utensils, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Skeleton, RestaurantCardSkeleton, HeroSkeleton, TabsSkeleton } from '@/components/SkeletonLoader';

// 拆分的组件 - 懒加载以减少初始包大小
const RegionHero = lazy(() => import('@/components/FoodGuide/RegionHero').then(m => ({ default: m.RegionHero })));
const FeaturedRestaurants = lazy(() => import('@/components/FoodGuide/FeaturedRestaurants').then(m => ({ default: m.FeaturedRestaurants })));
const CuisineGuides = lazy(() => import('@/components/FoodGuide/CuisineGuides').then(m => ({ default: m.CuisineGuides })));

// 按需加载重型组件
const RestaurantDetailDialog = lazy(() => import('@/components/RestaurantDetailDialog').then(m => ({ default: m.RestaurantDetailDialog })));

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
  const { markRenderStart, markRenderEnd } = usePerformanceMonitor('CombinedFoodGuide');
  const [loading, setLoading] = useState(true);
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(
    searchParams.get('divisionId')
  );
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isRestaurantDialogOpen, setIsRestaurantDialogOpen] = useState(false);
  
  // Cache region data with performance optimization
  const [regionCache, setRegionCache] = useState<Record<string, RegionInfo>>({});
  
  // Memoized abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Get translations for async functions
  const translations = {
    divisionNotFound: t('foodGuide.divisionNotFound'),
    description: t('foodGuide.description'), 
    cuisineDescription: t('foodGuide.cuisineDescription'),
    loadError: t('foodGuide.loadError'),
    loadErrorDescription: t('foodGuide.loadErrorDescription')
  };
  
  const seoData = getPageSEO('foodGuide', regionInfo ? { 
    city: regionInfo.name, 
    cityKey: regionInfo.path[regionInfo.path.length - 1]?.name || '' 
  } : undefined);

  // 优化的数据加载 - 减少不必要的重渲染
  const loadRegionData = useCallback(async (divisionId: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    // Check cache first - instant return for cached data
    if (regionCache[divisionId]) {
      setRegionInfo(regionCache[divisionId]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      markRenderStart();
      
      // 优化查询 - 获取所有必要字段
      const [pathResult, restaurantsResult] = await Promise.allSettled([
        supabase.rpc('get_division_path', { division_id_param: divisionId }),
        supabase
          .from('restaurants')
          .select('*')
          .eq('division_id', divisionId)
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .limit(12) // 减少初始加载量
      ]);
      
      // Handle results with fallbacks
      const divisionPath = pathResult.status === 'fulfilled' ? pathResult.value.data : null;
      let restaurantsData = restaurantsResult.status === 'fulfilled' ? restaurantsResult.value.data : [];
      
      const currentDivision = divisionPath?.[0];
      if (!currentDivision) {
        throw new Error(translations.divisionNotFound);
      }

      // 简化cuisine guides处理 - 减少计算复杂度
      let cuisineGuides: CuisineGuide[] = [];
      
      if (restaurantsData && restaurantsData.length > 0) {
        // 更高效的分组处理
        const cuisineMap = restaurantsData.reduce((acc, restaurant) => {
          if (!acc[restaurant.cuisine]) {
            acc[restaurant.cuisine] = [];
          }
          acc[restaurant.cuisine].push(restaurant);
          return acc;
        }, {} as Record<string, Restaurant[]>);
        
        cuisineGuides = Object.entries(cuisineMap)
          .slice(0, 3) // 限制为3个标签页以减少渲染负担
          .map(([cuisine, restaurants]) => ({
            id: `cuisine-${cuisine}`,
            name: cuisine,
            description: `${cuisine} ${translations.cuisineDescription}`,
            characteristics: [],
            must_try_dishes: [],
            restaurants: (restaurants as Restaurant[]).slice(0, 4) // 进一步减少数量
          }));
      }

      const pathArray: Division[] = (divisionPath || []).reverse().map(d => ({
        id: d.id,
        name: d.name,
        code: '',
        level: d.level as Division['level'],
        parent_id: null
      }));

      const newRegionInfo: RegionInfo = {
        id: currentDivision.id,
        name: currentDivision.name,
        description: `${currentDivision.name} ${translations.description}`,
        path: pathArray,
        cuisineGuides: cuisineGuides,
        featuredRestaurants: Array.isArray(restaurantsData) ? 
          restaurantsData.filter(r => r.is_featured).slice(0, 3) : 
          []
      };
      
      setRegionInfo(newRegionInfo);
      setRegionCache(prev => ({ ...prev, [divisionId]: newRegionInfo }));
      markRenderEnd();
      
    } catch (error: any) {
      console.error('Failed to load region data:', error);
      toast({
        title: translations.loadError,
        description: translations.loadErrorDescription,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [regionCache, translations, markRenderStart, markRenderEnd]);

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
    
    // 使用startTransition包装状态更新
    startTransition(() => {
      if (divisionId) {
        setSelectedDivisionId(divisionId);
        loadRegionData(divisionId);
      } else {
        loadDefaultData();
      }
    });
  }, [searchParams, loadRegionData]);

  // 优化的区域变更处理 - 使用startTransition
  const handleRegionChange = useCallback((divisionId: string | null, divisionPath: Division[]) => {
    // 使用React 18的并发特性
    React.startTransition(() => {
      setSelectedDivisionId(divisionId);
      
      if (divisionId) {
        navigate(`/food-guide?divisionId=${divisionId}`, { replace: true });
        loadRegionData(divisionId);
      } else {
        navigate('/food-guide', { replace: true });
        setRegionInfo(null);
        loadDefaultData();
      }
    });
  }, [navigate, loadRegionData]);

  const handleRestaurantClick = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsRestaurantDialogOpen(true);
  }, []);

  // Optimize calculations with useMemo
  const currentRegionName = useMemo(() => 
    regionInfo ? 
      (regionInfo.path.length > 0 ? regionInfo.path[regionInfo.path.length - 1].name : regionInfo.name) : 
      t('foodGuide.nationalGuide')
  , [regionInfo, t]);
  
  const regionDescription = useMemo(() => 
    regionInfo?.description || t('foodGuide.defaultDescription')
  , [regionInfo, t]);

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
        {/* Hero Section - 优化骨架屏减少CLS */}
        <Suspense fallback={<HeroSkeleton />}>
          <RegionHero
            currentRegionName={currentRegionName}
            regionDescription={regionDescription}
            regionPath={regionInfo?.path || []}
            selectedDivisionId={selectedDivisionId || undefined}
            user={user}
            onRegionChange={handleRegionChange}
          />
        </Suspense>

        {/* Featured Restaurants - 固定高度减少布局偏移 */}
        {regionInfo?.featuredRestaurants && regionInfo.featuredRestaurants.length > 0 && (
          <div style={{ minHeight: '400px' }}>
            <Suspense fallback={
              <div className="mb-12 space-y-4">
                <Skeleton height="32px" width="300px" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <RestaurantCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            }>
              <FeaturedRestaurants
                restaurants={regionInfo.featuredRestaurants}
                onRestaurantClick={handleRestaurantClick}
              />
            </Suspense>
          </div>
        )}

        {/* Cuisine Guides - 固定高度容器 */}
        {regionInfo?.cuisineGuides && regionInfo.cuisineGuides.length > 0 && (
          <div style={{ minHeight: '500px' }}>
            <Suspense fallback={<TabsSkeleton />}>
              <CuisineGuides
                cuisineGuides={regionInfo.cuisineGuides}
                onRestaurantClick={handleRestaurantClick}
              />
            </Suspense>
          </div>
        )}

        {/* Dining Tips */}
        {regionInfo && regionInfo.path.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">{t('foodGuide.diningTips')}</h2>
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
        )}
      </main>

      <Suspense fallback={<div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />}>
        <RestaurantDetailDialog
          restaurant={selectedRestaurant}
          open={isRestaurantDialogOpen}
          onOpenChange={setIsRestaurantDialogOpen}
        />
      </Suspense>
    </div>
  );
};