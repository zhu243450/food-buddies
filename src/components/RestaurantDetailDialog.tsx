import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Clock, Users, Utensils, Phone, Navigation } from "lucide-react";
import { toast } from "sonner";

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

interface RestaurantDetailDialogProps {
  restaurant: Restaurant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestaurantDetailDialog({ restaurant, open, onOpenChange }: RestaurantDetailDialogProps) {
  const navigate = useNavigate();
  
  if (!restaurant) return null;

  const handleNavigation = () => {
    const searchQuery = encodeURIComponent(`${restaurant.name} ${restaurant.area}`);
    const mapUrl = `https://maps.google.com/maps?q=${searchQuery}`;
    window.open(mapUrl, '_blank');
    toast.success('正在打开地图导航');
  };

  const handleCreateDinner = () => {
    onOpenChange(false);
    navigate('/create-dinner', { 
      state: { 
        selectedRestaurant: restaurant.name,
        location: restaurant.area 
      }
    });
    toast.success('正在跳转到创建饭局页面');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="flex flex-col p-0" 
        style={{
          maxWidth: '48rem',
          width: '95%',
          maxHeight: '85vh',
          overflowY: 'hidden'
        }}
      >
        <DialogHeader className="p-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center justify-between text-xl">
            <span>{restaurant.name}</span>
            <div className="flex items-center gap-2 bg-gradient-primary text-primary-foreground px-3 py-1 rounded-full">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-semibold">{restaurant.rating}</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            查看餐厅详情，了解招牌菜品和就餐建议
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 基本信息 */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Utensils className="h-4 w-4 mr-2" />
              {restaurant.cuisine}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              <MapPin className="h-4 w-4 mr-2" />
              {restaurant.area}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1 font-semibold text-primary">
              {restaurant.price_range}
            </Badge>
            {restaurant.is_featured && (
              <Badge className="text-sm px-3 py-1">
                推荐
              </Badge>
            )}
          </div>

          {/* 餐厅描述 */}
          <Card>
            <CardContent className="p-4">
              <p className="text-foreground leading-relaxed">{restaurant.description}</p>
            </CardContent>
          </Card>

          {/* 详细信息 */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">推荐时间</h4>
                </div>
                <p className="text-muted-foreground">{restaurant.best_time}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">适合人数</h4>
                </div>
                <p className="text-muted-foreground">{restaurant.group_size}</p>
              </CardContent>
            </Card>
          </div>

          {/* 招牌菜品 */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              招牌菜品
            </h4>
            <div className="flex flex-wrap gap-2">
              {restaurant.special_dishes.map((dish, index) => (
                <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                  {dish}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

        </div>

        {/* 操作按钮 - 固定在底部 */}
        <div className="border-t border-border p-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-sm text-muted-foreground">
              喜欢这家餐厅？创建饭局邀请朋友一起品尝吧！
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleNavigation} className="flex-1 sm:flex-none">
                <Navigation className="h-4 w-4 mr-2" />
                导航
              </Button>
              <Button size="sm" onClick={handleCreateDinner} className="flex-1 sm:flex-none">
                <Utensils className="h-4 w-4 mr-2" />
                创建饭局
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}