import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Clock, Users, Utensils, Navigation } from "lucide-react";
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
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // Reset position when dialog opens
  useEffect(() => {
    if (open) {
      setDialogPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);
  
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

  // Touch and mouse event handlers for dragging
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - dialogPosition.x, y: clientY - dialogPosition.y });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    // Limit movement to keep dialog visible
    const maxY = window.innerHeight * 0.3;
    const minY = -window.innerHeight * 0.2;
    
    setDialogPosition({
      x: Math.max(-200, Math.min(200, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    });
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.dialog-content')) {
      handleStart(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Add global event listeners for mouse
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX, e.clientY);
      };
      
      const handleGlobalMouseUp = () => {
        handleEnd();
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStart, dialogPosition]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={dialogRef}
        className="max-w-4xl w-[95vw] max-h-[85vh] p-0 dialog-content"
        style={{
          transform: `translate(${dialogPosition.x}px, ${dialogPosition.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: isDragging ? 'none' : 'auto',
          transition: isDragging ? 'none' : 'transform 0.2s ease'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-xl">
              <span>{restaurant.name}</span>
              <div className="flex items-center gap-2 bg-gradient-primary text-primary-foreground px-3 py-1 rounded-full">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-semibold">{restaurant.rating}</span>
              </div>
            </DialogTitle>
            <DialogDescription>
              查看餐厅详情，了解招牌菜品和就餐建议 - 可拖拽移动位置
            </DialogDescription>
          </DialogHeader>
        </div>
        
        {/* Content */}
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
              <Badge className="text-sm px-3 py-1">推荐</Badge>
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

        {/* Footer */}
        <div className="border-t border-border p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-sm text-muted-foreground">
              喜欢这家餐厅？创建饭局邀请朋友一起品尝吧！
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNavigation} 
                className="flex-1 sm:flex-none"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                <Navigation className="h-4 w-4 mr-2" />
                导航
              </Button>
              <Button 
                size="sm" 
                onClick={handleCreateDinner} 
                className="flex-1 sm:flex-none"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
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
