import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { OptimizedRestaurantCard } from '@/components/OptimizedRestaurantCard';
import { useInView } from '@/hooks/useInView';

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

interface FeaturedRestaurantsProps {
  restaurants: Restaurant[];
  onRestaurantClick: (restaurant: Restaurant) => void;
}

export const FeaturedRestaurants = memo<FeaturedRestaurantsProps>(({ 
  restaurants, 
  onRestaurantClick 
}) => {
  const { t } = useTranslation();
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  // 只在需要时渲染餐厅卡片
  const restaurantCards = useMemo(() => {
    if (!inView) return [];
    
    return restaurants.slice(0, 6).map((restaurant) => (
      <OptimizedRestaurantCard
        key={restaurant.id}
        restaurant={restaurant}
        onClick={onRestaurantClick}
      />
    ));
  }, [restaurants, onRestaurantClick, inView]);

  if (restaurants.length === 0) {
    return null;
  }

  return (
    <section 
      ref={ref}
      className="mb-12" 
      aria-labelledby="featured-restaurants"
    >
      <h2 id="featured-restaurants" className="text-2xl font-bold text-foreground mb-6">
        {t('foodGuide.featuredRestaurants')}
      </h2>
      
      {inView ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurantCards}
        </div>
      ) : (
        // 占位符，避免布局偏移
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: Math.min(6, restaurants.length) }).map((_, index) => (
            <div 
              key={index} 
              className="h-64 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      )}
    </section>
  );
});

FeaturedRestaurants.displayName = 'FeaturedRestaurants';