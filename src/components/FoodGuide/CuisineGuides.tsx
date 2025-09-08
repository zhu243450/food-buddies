import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Utensils } from 'lucide-react';
import { SmallRestaurantCard } from '@/components/SmallRestaurantCard';
import { useInView } from '@/hooks/useInView';
import { PerformantTabs } from '@/components/PerformantTabs';

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

interface CuisineGuidesProps {
  cuisineGuides: CuisineGuide[];
  onRestaurantClick: (restaurant: Restaurant) => void;
}

export const CuisineGuides = memo<CuisineGuidesProps>(({ 
  cuisineGuides, 
  onRestaurantClick 
}) => {
  const { t } = useTranslation();
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  // 转换为PerformantTabs所需格式
  const tabItems = useMemo(() => 
    cuisineGuides.map((guide) => ({
      id: guide.id,
      label: guide.name,
      content: (
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
                <h4 className="font-semibold mb-3">{t('foodGuide.cuisineCharacteristics')}</h4>
                <div className="flex flex-wrap gap-2">
                  {guide.characteristics.slice(0, 8).map((char, index) => (
                    <Badge key={index} variant="outline">
                      {char}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {guide.must_try_dishes.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">{t('foodGuide.mustTryDishes')}</h4>
                <div className="flex flex-wrap gap-2">
                  {guide.must_try_dishes.slice(0, 8).map((dish, index) => (
                    <Badge key={index} variant="secondary">
                      {dish}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {guide.restaurants.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">{t('foodGuide.recommendedRestaurants')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {guide.restaurants.slice(0, 4).map((restaurant) => (
                    <SmallRestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      onClick={onRestaurantClick}
                    />
                  ))}
                </div>
                {guide.restaurants.length > 4 && (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    {t('common.more')} {guide.restaurants.length - 4} {t('foodGuide.moreRestaurants')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )
    })), 
    [cuisineGuides, onRestaurantClick, t]
  );

  if (cuisineGuides.length === 0) {
    return null;
  }

  return (
    <section ref={ref} className="mb-12">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {t('foodGuide.cuisineGuide')}
      </h2>
      
      {inView ? (
        <PerformantTabs 
          items={tabItems}
          defaultValue={cuisineGuides[0]?.id}
          lazyLoad={true}
        />
      ) : (
        // 占位符
        <div className="space-y-4">
          <div className="h-12 bg-muted animate-pulse rounded-md" />
          <div className="h-96 bg-muted animate-pulse rounded-md" />
        </div>
      )}
    </section>
  );
});

CuisineGuides.displayName = 'CuisineGuides';