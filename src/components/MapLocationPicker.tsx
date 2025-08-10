import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Search, Navigation, Check } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface MapLocationPickerProps {
  onLocationSelect: (location: string, coordinates?: { lat: number; lng: number }) => void;
  initialLocation?: string;
}

// 搜索结果类型定义
interface SearchResult {
  name: string;
  coords: { lat: number; lng: number };
  type?: string;
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ 
  onLocationSelect, 
  initialLocation = "" 
}) => {
  const [searchQuery, setSearchQuery] = useState(initialLocation);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const { toast } = useToast();

  // 搜索建议
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (value.trim().length > 1) {
      // 延迟搜索店面和地址
      const timeoutId = setTimeout(() => {
        searchLocation(value);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  };

  // 选择搜索结果
  const selectSearchResult = (location: SearchResult) => {
    setSearchQuery(location.name);
    setSelectedLocation(location.name);
    setCoordinates(location.coords);
    setSuggestions([]);
    
    toast({
      title: "位置已选择",
      description: `已选择：${location.name}`,
    });
  };

  // 搜索店面和地址
  const searchLocation = async (query: string) => {
    if (!query.trim() || query.length < 2) return;

    try {
      // 使用 Nominatim API 搜索餐厅、店面等POI
      // 添加餐厅、商店等关键词来提高搜索准确性
      const searchQueries = [
        query,
        `${query} 餐厅`,
        `${query} 饭店`,
        `${query} 商店`
      ];

      const allResults: SearchResult[] = [];

      for (const searchQuery of searchQueries) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&accept-language=zh-CN,zh&limit=10&countrycodes=cn&addressdetails=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          const results = data.map((item: any) => {
            // 优先显示商店、餐厅等POI
            let displayName = item.display_name;
            const address = item.address || {};
            
            // 如果有具体的店名或餐厅名，优先显示
            if (address.shop || address.restaurant || address.amenity) {
              const parts = [];
              if (address.shop) parts.push(address.shop);
              if (address.restaurant) parts.push(address.restaurant);
              if (address.amenity) parts.push(address.amenity);
              if (address.road) parts.push(address.road);
              if (address.suburb || address.neighbourhood) {
                parts.push(address.suburb || address.neighbourhood);
              }
              if (address.city || address.county) {
                parts.push(address.city || address.county);
              }
              displayName = parts.join(', ');
            }

            return {
              name: displayName,
              coords: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
              type: item.type || 'place'
            };
          });
          
          allResults.push(...results);
        }
      }

      // 去重并按相关性排序
      const uniquResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.coords.lat === result.coords.lat && r.coords.lng === result.coords.lng)
      );

      // 优先显示包含查询关键词的结果
      const sortedResults = uniquResults.sort((a, b) => {
        const aIncludes = a.name.toLowerCase().includes(query.toLowerCase());
        const bIncludes = b.name.toLowerCase().includes(query.toLowerCase());
        if (aIncludes && !bIncludes) return -1;
        if (!aIncludes && bIncludes) return 1;
        return 0;
      });

      setSuggestions(sortedResults.slice(0, 8));
    } catch (error) {
      console.error('搜索地址失败:', error);
    }
  };

  // 获取用户当前位置
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "不支持定位",
        description: "您的浏览器不支持地理位置服务",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // 使用 Nominatim API 进行反向地理编码
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-CN,zh&zoom=16&addressdetails=1`
          );
          const data = await response.json();

          let locationText = '';
          if (data.display_name) {
            // 提取更有用的地址信息
            const address = data.address || {};
            const parts = [];
            
            if (address.city || address.county) {
              parts.push(address.city || address.county);
            }
            if (address.suburb || address.neighbourhood) {
              parts.push(address.suburb || address.neighbourhood);
            }
            if (address.road) {
              parts.push(address.road);
            }
            if (address.house_number) {
              parts.push(address.house_number);
            }

            locationText = parts.length > 0 ? parts.join(' ') : data.display_name.split(',').slice(0, 3).join(',');
          }

          // 如果仍然没有获取到地址，使用坐标
          if (!locationText) {
            locationText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }

          setSearchQuery(locationText);
          setSelectedLocation(locationText);
          setCoordinates({ lat: latitude, lng: longitude });

          toast({
            title: "定位成功",
            description: `当前位置：${locationText}`,
          });
        } catch (e) {
          console.error('地址解析失败:', e);
          const locationText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setSearchQuery(locationText);
          setSelectedLocation(locationText);
          setCoordinates({ lat: latitude, lng: longitude });
          toast({
            title: "定位成功",
            description: "已获取GPS坐标",
          });
        }

        setIsLocating(false);
      },
      (error) => {
        console.error('定位失败:', error);
        let errorMessage = "定位失败";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "请允许位置访问权限";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "位置服务不可用，请检查GPS设置";
            break;
          case error.TIMEOUT:
            errorMessage = "定位超时，请重试";
            break;
        }
        
        toast({
          title: "定位失败",
          description: errorMessage,
          variant: "destructive",
        });
        
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  // 确认手动输入的位置
  const confirmManualLocation = () => {
    if (searchQuery.trim()) {
      setSelectedLocation(searchQuery);
      
      toast({
        title: "位置已确认",
        description: `已设置位置：${searchQuery}`,
      });
    }
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation, coordinates || undefined);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          选择地点
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 搜索框 */}
        <div className="space-y-2">
          <Label htmlFor="search">位置搜索</Label>
            <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="搜索餐厅、店面名称或地址，支持GPS定位"
                className="pr-8"
                onClick={() => {
                  if (!searchQuery) {
                    getCurrentLocation();
                  }
                }}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={confirmManualLocation}
                >
                  <Check className="w-3 h-3" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={getCurrentLocation}
              disabled={isLocating}
              title="获取当前位置"
              className="shrink-0"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {/* 搜索建议 */}
          {suggestions.length > 0 && (
            <div className="border rounded-lg bg-background shadow-lg">
              {suggestions.map((location, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 border-0 rounded-none"
                  onClick={() => selectSearchResult(location)}
                >
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  {location.name}
                </Button>
              ))}
            </div>
          )}
        </div>


        {/* 选中的位置 */}
        {selectedLocation && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm font-medium text-primary">选中的位置：</p>
            <p className="text-sm text-muted-foreground">{selectedLocation}</p>
            {coordinates && (
              <p className="text-xs text-muted-foreground mt-1">
                坐标：{coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </p>
            )}
          </div>
        )}

        {/* 确认按钮 */}
        <Button 
          onClick={confirmLocation} 
          className="w-full" 
          disabled={!selectedLocation}
        >
          确认选择此位置
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          搜索餐厅店名或输入详细地址，支持GPS定位
        </p>
      </CardContent>
    </Card>
  );
};

export default MapLocationPicker;