import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/Navigation';
import { SEO } from '@/components/SEO';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Users, Utensils } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { RegionHero } from '@/components/FoodGuide/RegionHero';
import { FeaturedRestaurants } from '@/components/FoodGuide/FeaturedRestaurants';
import { CuisineGuides } from '@/components/FoodGuide/CuisineGuides';
import { RestaurantDetailDialog } from '@/components/RestaurantDetailDialog';
import { OptimizedFoodGuideSkeleton } from '@/components/FoodGuide/OptimizedFoodGuideSkeleton';
import ShareFoodGuide from '@/components/ShareFoodGuide';
import { memoryCache } from '@/lib/performanceOptimizer';
import { useQueryCache, requestDeduplicator } from '@/hooks/useQueryCache';

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
  const location = useLocation();
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  const { user } = useAuth();
  const { getFromCache, setCache, prefetchQuery } = useQueryCache();
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(
    searchParams.get('divisionId') || null
  );
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isRestaurantDialogOpen, setIsRestaurantDialogOpen] = useState(false);
  const [hasAutoLocated, setHasAutoLocated] = useState(false);

  // Auto-locate user's current location on first load
  useEffect(() => {
    // Skip if URL already has divisionId or already auto-located
    if (searchParams.get('divisionId') || hasAutoLocated) return;
    
    const autoLocateUser = async () => {
      if (!navigator.geolocation) {
        console.debug('Geolocation not supported');
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 1000 * 60 * 30 // Cache for 30 minutes
          });
        });

        const { latitude, longitude } = position.coords;
        
        // Use reverse geocoding to get city name
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=zh`
        );
        
        if (!response.ok) throw new Error('Geocoding failed');
        
        const data = await response.json();
        const address = data.address;
        
        // Try to match city or province from the geocoding result
        const cityName = address.city || address.county || address.state;
        
        if (cityName) {
          // Search for matching division in database
          const { data: divisions, error } = await supabase
            .from('administrative_divisions')
            .select('id, name, level')
            .or(`name.ilike.%${cityName}%,name.ilike.%${cityName.replace(/市|省|区|县/g, '')}%`)
            .eq('is_active', true)
            .order('level', { ascending: true })
            .limit(1);

          if (!error && divisions && divisions.length > 0) {
            const matchedDivision = divisions[0];
            console.debug('Auto-located to:', matchedDivision.name);
            setSelectedDivisionId(matchedDivision.id);
            navigate(`/food-guide?divisionId=${matchedDivision.id}`, { replace: true });
          }
        }
      } catch (error) {
        // Silently fail - user will see default Beijing
        console.debug('Auto-location failed:', error);
      } finally {
        setHasAutoLocated(true);
      }
    };

    autoLocateUser();
  }, [searchParams, hasAutoLocated, navigate]);
  
  // Get translations for async functions
  const translations = useMemo(() => ({
    divisionNotFound: t('foodGuide.divisionNotFound'),
    description: t('foodGuide.description'), 
    cuisineDescription: t('foodGuide.cuisineDescription'),
    loadError: t('foodGuide.loadError'),
    loadErrorDescription: t('foodGuide.loadErrorDescription')
  }), [t]);

  // Optimized data fetching with request deduplication and enhanced caching
  const fetchRegionData = useCallback(async (divisionId: string): Promise<RegionInfo> => {
    const cacheKey = `region-${divisionId}`;
    
    // Use request deduplication to prevent duplicate requests
    return requestDeduplicator.deduplicate(cacheKey, async () => {
      // Check query cache first
      const cached = getFromCache<RegionInfo>([cacheKey]);
      if (cached) {
        return cached;
      }

      // Check memory cache
      const memoryCached = memoryCache.get<RegionInfo>(cacheKey);
      if (memoryCached) {
        setCache([cacheKey], memoryCached, 1000 * 60 * 15); // 15 minutes
        return memoryCached;
      }

      try {
        // Parallel requests with timeout and error handling
        const pathPromise = Promise.race([
          supabase.rpc('get_division_path', { division_id_param: divisionId }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);
        
        const restaurantsPromise = Promise.race([
          supabase
            .from('restaurants')
            .select('id, name, cuisine, area, rating, price_range, special_dishes, best_time, group_size, description, is_featured, is_active')
            .eq('division_id', divisionId)
            .eq('is_active', true)
            .order('is_featured', { ascending: false })
            .limit(20),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);

        const [pathResult, restaurantsResult] = await Promise.allSettled([
          pathPromise,
          restaurantsPromise
        ]);
        
        const divisionPath = pathResult.status === 'fulfilled' ? (pathResult.value as any)?.data : null;
        const restaurantsData = restaurantsResult.status === 'fulfilled' ? ((restaurantsResult.value as any)?.data || []) : [];
        
        const currentDivision = divisionPath?.[0];
        if (!currentDivision) {
          throw new Error(translations.divisionNotFound);
        }

        // Create cuisine guides efficiently with memoization
        const cuisineMap = restaurantsData.reduce((acc, restaurant) => {
          const cuisine = restaurant.cuisine || 'Unknown';
          if (!acc[cuisine]) {
            acc[cuisine] = [];
          }
          acc[cuisine].push(restaurant);
          return acc;
        }, {} as Record<string, Restaurant[]>);
        
        const cuisineGuides = Object.entries(cuisineMap)
          .sort(([, a], [, b]) => (b as Restaurant[]).length - (a as Restaurant[]).length) // Sort by restaurant count
          .slice(0, 3)
          .map(([cuisine, restaurants]) => ({
            id: `cuisine-${cuisine}`,
            name: cuisine,
            description: `${cuisine} ${translations.cuisineDescription}`,
            characteristics: [],
            must_try_dishes: [],
            restaurants: (restaurants as Restaurant[]).slice(0, 6)
          }));

        const pathArray: Division[] = (divisionPath || []).reverse().map(d => ({
          id: d.id,
          name: d.name,
          code: '',
          level: d.level as Division['level'],
          parent_id: null
        }));

        const regionInfo: RegionInfo = {
          id: currentDivision.id,
          name: currentDivision.name,
          description: `${currentDivision.name} ${translations.description}`,
          path: pathArray,
          cuisineGuides: cuisineGuides,
          featuredRestaurants: restaurantsData.filter(r => r.is_featured).slice(0, 3)
        };

        // Cache in both memory and query cache
        memoryCache.set(cacheKey, regionInfo, 15);
        setCache([cacheKey], regionInfo, 1000 * 60 * 15);
        
        return regionInfo;
      } catch (error) {
        console.error('Failed to fetch region data:', error);
        throw error;
      }
    });
  }, [translations, getFromCache, setCache]);

  // Get default Beijing division ID with enhanced caching and request deduplication
  const fetchBeijingId = useCallback(async (): Promise<string> => {
    return requestDeduplicator.deduplicate('beijing-id', async () => {
      const cached = getFromCache<string>(['beijing-id']);
      if (cached) return cached;

      const memoryCached = memoryCache.get<string>('beijing-id');
      if (memoryCached) {
        setCache(['beijing-id'], memoryCached, 1000 * 60 * 60); // 1 hour
        return memoryCached;
      }

      try {
        const { data: beijingDivision, error } = await Promise.race([
          supabase
            .from('administrative_divisions')
            .select('id')
            .eq('name', '北京市')
            .eq('level', 'city')
            .single(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);

        if (error) throw error;
        
        // Cache in both places
        memoryCache.set('beijing-id', beijingDivision.id, 60);
        setCache(['beijing-id'], beijingDivision.id, 1000 * 60 * 60);
        
        return beijingDivision.id;
      } catch (error) {
        console.error('Failed to fetch Beijing ID:', error);
        // Fallback to a default ID if available
        throw error;
      }
    });
  }, [getFromCache, setCache]);

  // Determine which division ID to use
  const activeDivisionId = selectedDivisionId || 'default';
  
  // Enhanced React Query with better error handling and retries
  const { data: regionInfo, isLoading, error, refetch } = useQuery({
    queryKey: ['regionData', activeDivisionId],
    queryFn: async () => {
      if (activeDivisionId === 'default') {
        const beijingId = await fetchBeijingId();
        return fetchRegionData(beijingId);
      }
      return fetchRegionData(activeDivisionId);
    },
    enabled: true,
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: (failureCount, error) => {
      // Don't retry on certain errors
      if (error.message.includes('division not found')) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Prefetch common regions for better UX
  useEffect(() => {
    const prefetchCommonRegions = async () => {
      try {
        // Prefetch Beijing data if not already loaded
        if (activeDivisionId !== 'default') {
          const beijingId = await fetchBeijingId();
          prefetchQuery(['regionData', 'default'], () => fetchRegionData(beijingId));
        }
      } catch (error) {
        // Silently fail prefetching
        console.debug('Prefetch failed:', error);
      }
    };

    prefetchCommonRegions();
  }, [activeDivisionId, fetchBeijingId, fetchRegionData, prefetchQuery]);
  
  // SEO data with regionInfo
  const seoData = useMemo(() => getPageSEO('foodGuide', regionInfo ? { 
    city: regionInfo.name, 
    cityKey: regionInfo.path[regionInfo.path.length - 1]?.name || '' 
  } : undefined), [getPageSEO, regionInfo]);

  // Update selected division when URL changes
  useEffect(() => {
    const divisionId = searchParams.get('divisionId');
    if (divisionId !== selectedDivisionId) {
      setSelectedDivisionId(divisionId);
    }
  }, [searchParams, selectedDivisionId]);

  // Show error toast if data fetching fails
  useEffect(() => {
    if (error) {
      console.error('Failed to load region data:', error);
      toast({
        title: translations.loadError,
        description: translations.loadErrorDescription,
        variant: "destructive"
      });
    }
  }, [error, translations]);

  const handleRegionChange = useCallback((divisionId: string | null, divisionPath: Division[]) => {
    if (divisionId) {
      navigate(`/food-guide?divisionId=${divisionId}`, { replace: true });
    } else {
      navigate('/food-guide', { replace: true });
    }
  }, [navigate]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <OptimizedFoodGuideSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO {...seoData} />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <RegionHero
          currentRegionName={currentRegionName}
          regionDescription={regionDescription}
          regionPath={regionInfo?.path || []}
          selectedDivisionId={selectedDivisionId || undefined}
          user={user}
          onRegionChange={handleRegionChange}
        />
        
        {/* Share Button */}
        {regionInfo && (
          <div className="flex justify-end mb-6">
            <ShareFoodGuide 
              regionInfo={{
                name: currentRegionName,
                description: regionDescription,
                path: regionInfo.path || []
              }}
              currentPath={location.pathname}
            />
          </div>
        )}

        {/* Featured Restaurants */}
        {regionInfo?.featuredRestaurants && regionInfo.featuredRestaurants.length > 0 && (
          <FeaturedRestaurants
            restaurants={regionInfo.featuredRestaurants}
            onRestaurantClick={handleRestaurantClick}
          />
        )}

        {/* Cuisine Guides */}
        {regionInfo?.cuisineGuides && regionInfo.cuisineGuides.length > 0 && (
          <CuisineGuides
            cuisineGuides={regionInfo.cuisineGuides}
            onRestaurantClick={handleRestaurantClick}
          />
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

      <RestaurantDetailDialog
        restaurant={selectedRestaurant}
        open={isRestaurantDialogOpen}
        onOpenChange={setIsRestaurantDialogOpen}
      />
    </div>
  );
};