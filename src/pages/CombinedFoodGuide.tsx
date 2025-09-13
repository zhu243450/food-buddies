import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import { SEO } from '@/components/SEO';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Users, Utensils, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { RegionHero } from '@/components/FoodGuide/RegionHero';
import { FeaturedRestaurants } from '@/components/FoodGuide/FeaturedRestaurants';
import { CuisineGuides } from '@/components/FoodGuide/CuisineGuides';
import { RestaurantDetailDialog } from '@/components/RestaurantDetailDialog';

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

  const loadRegionData = useCallback(async (divisionId: string) => {
    try {
      setLoading(true);
      
      const [pathResult, restaurantsResult] = await Promise.all([
        supabase.rpc('get_division_path', { division_id_param: divisionId }),
        supabase
          .from('restaurants')
          .select('id, name, cuisine, area, rating, price_range, special_dishes, best_time, group_size, description, is_featured, is_active')
          .eq('division_id', divisionId)
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .limit(20)
      ]);
      
      const divisionPath = pathResult.data;
      const restaurantsData = restaurantsResult.data || [];
      
      const currentDivision = divisionPath?.[0];
      if (!currentDivision) {
        throw new Error(translations.divisionNotFound);
      }

      // Create cuisine guides
      const cuisineMap = restaurantsData.reduce((acc, restaurant) => {
        if (!acc[restaurant.cuisine]) {
          acc[restaurant.cuisine] = [];
        }
        acc[restaurant.cuisine].push(restaurant);
        return acc;
      }, {} as Record<string, Restaurant[]>);
      
      const cuisineGuides = Object.entries(cuisineMap)
        .slice(0, 3)
        .map(([cuisine, restaurants]) => ({
          id: `cuisine-${cuisine}`,
          name: cuisine,
          description: `${cuisine} ${translations.cuisineDescription}`,
          characteristics: [],
          must_try_dishes: [],
          restaurants: restaurants.slice(0, 6)
        }));

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
        featuredRestaurants: restaurantsData.filter(r => r.is_featured).slice(0, 3)
      };
      
      setRegionInfo(newRegionInfo);
      
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
  }, [translations]);

  // Load default data (Beijing) if no division is selected
  const loadDefaultData = useCallback(async () => {
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
  }, [loadRegionData]);

  useEffect(() => {
    const divisionId = searchParams.get('divisionId');
    
    if (divisionId) {
      if (selectedDivisionId !== divisionId) {
        setSelectedDivisionId(divisionId);
        loadRegionData(divisionId);
      }
    } else {
      if (!regionInfo) {
        loadDefaultData();
      }
    }
  }, [searchParams, selectedDivisionId, loadRegionData, loadDefaultData, regionInfo]);

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
        <RegionHero
          currentRegionName={currentRegionName}
          regionDescription={regionDescription}
          regionPath={regionInfo?.path || []}
          selectedDivisionId={selectedDivisionId || undefined}
          user={user}
          onRegionChange={handleRegionChange}
        />

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