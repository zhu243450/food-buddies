import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

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

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: (restaurant: Restaurant) => void;
}

export const RestaurantCard = React.memo<RestaurantCardProps>(({ restaurant, onClick }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick(restaurant)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg text-foreground">{restaurant.name}</h3>
            <p className="text-muted-foreground">{restaurant.area}</p>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{restaurant.rating}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary">{restaurant.cuisine}</Badge>
          <Badge variant="outline" className="text-primary font-semibold">
            {restaurant.price_range}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {restaurant.description}
        </p>
        {restaurant.special_dishes.length > 0 && (
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
        )}
      </CardContent>
    </Card>
  );
});

RestaurantCard.displayName = 'RestaurantCard';