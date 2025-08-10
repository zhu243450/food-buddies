import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Search, Navigation, Check } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      title: t('location.success'),
      description: t('location.locationSelected', { location: location.name }),
    });
  };

  // 搜索店面和地址
  const searchLocation = async (query: string) => {
    if (!query.trim() || query.length < 2) return;

    try {
      // 根据当前语言设置选择合适的语言参数
      const locale = localStorage.getItem('i18nextLng') === 'en' ? 'en-US,en' : 'zh-CN,zh';
      
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
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&accept-language=${locale}&limit=10&countrycodes=cn&addressdetails=1`
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
      console.error(t('mapPicker.searchError'), error);
    }
  };

  // 获取用户当前位置
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: t('location.notSupported'),
        description: t('location.notSupportedDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // 根据当前语言设置选择合适的语言参数
          const locale = localStorage.getItem('i18nextLng') === 'en' ? 'en-US,en' : 'zh-CN,zh';
          
          // 使用 Nominatim API 进行反向地理编码
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${locale}&zoom=16&addressdetails=1`
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
            title: t('location.success'),
            description: t('location.currentLocation', { location: locationText }),
          });
        } catch (e) {
          console.error(t('mapPicker.geocodeError'), e);
          const locationText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setSearchQuery(locationText);
          setSelectedLocation(locationText);
          setCoordinates({ lat: latitude, lng: longitude });
          toast({
            title: t('location.success'),
            description: t('location.coordinatesObtained'),
          });
        }

        setIsLocating(false);
      },
      (error) => {
        console.error(t('mapPicker.locationError'), error);
        let errorMessage = t('location.failed');
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('location.permissionDenied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('location.unavailable');
            break;
          case error.TIMEOUT:
            errorMessage = t('location.timeout');
            break;
        }
        
        toast({
          title: t('location.failed'),
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
        title: t('location.confirmed'),
        description: t('location.locationSet', { location: searchQuery }),
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
          {t('location.selectLocation')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 搜索框 */}
        <div className="space-y-2">
          <Label htmlFor="search">{t('location.locationSearch')}</Label>
            <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t('location.searchPlaceholder')}
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
              title={t('location.getCurrentLocation')}
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
            <p className="text-sm font-medium text-primary">{t('location.selectedLocation')}</p>
            <p className="text-sm text-muted-foreground">{selectedLocation}</p>
            {coordinates && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('location.coordinates', { lat: coordinates.lat.toFixed(4), lng: coordinates.lng.toFixed(4) })}
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
          {t('location.confirmSelection')}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          {t('location.helpText')}
        </p>
      </CardContent>
    </Card>
  );
};

export default MapLocationPicker;