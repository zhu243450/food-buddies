import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Users } from 'lucide-react';

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

interface OptimizedRestaurantCardProps {
  restaurant: Restaurant;
  onClick: (restaurant: Restaurant) => void;
}

export const OptimizedRestaurantCard = memo<OptimizedRestaurantCardProps>(({ restaurant, onClick }) => {
  const handleClick = () => onClick(restaurant);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(restaurant);
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-card transition-all duration-300 transform hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary" 
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`查看 ${restaurant.name} 详情`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg leading-6">{restaurant.name}</CardTitle>
          <div className="flex items-center gap-1 bg-gradient-primary text-primary-foreground px-2 py-1 rounded-full">
            <Star className="h-3 w-3 fill-current" aria-hidden="true" />
            <span className="text-sm font-medium" aria-label={`评分 ${restaurant.rating} 分`}>
              {restaurant.rating}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-medium">{restaurant.area}</p>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>{restaurant.best_time}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>{restaurant.group_size}</span>
          </div>
        </div>
        
        <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
          {restaurant.description}
        </p>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-medium">
            {restaurant.cuisine}
          </Badge>
          <Badge variant="secondary" className="font-medium">
            {restaurant.price_range}
          </Badge>
          {restaurant.is_featured && (
            <Badge variant="default" className="bg-gradient-accent font-medium">
              推荐
            </Badge>
          )}
        </div>
        
        {restaurant.special_dishes && restaurant.special_dishes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">招牌菜</p>
            <div className="flex flex-wrap gap-1">
              {restaurant.special_dishes.slice(0, 3).map((dish, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {dish}
                </Badge>
              ))}
              {restaurant.special_dishes.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{restaurant.special_dishes.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OptimizedRestaurantCard.displayName = 'OptimizedRestaurantCard';
