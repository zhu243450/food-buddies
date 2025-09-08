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

interface SmallRestaurantCardProps {
  restaurant: Restaurant;
  onClick: (restaurant: Restaurant) => void;
}

export const SmallRestaurantCard = React.memo<SmallRestaurantCardProps>(({ restaurant, onClick }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(restaurant)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h5 className="font-medium text-foreground">{restaurant.name}</h5>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs">{restaurant.rating}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{restaurant.area}</p>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            {restaurant.price_range}
          </Badge>
          {restaurant.is_featured && (
            <Badge variant="default" className="text-xs">
              推荐
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

SmallRestaurantCard.displayName = 'SmallRestaurantCard';