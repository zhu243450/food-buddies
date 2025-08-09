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

// 中国常见城市和地标的预设坐标
const PRESET_LOCATIONS = [
  { name: "北京市", coords: { lat: 39.9042, lng: 116.4074 } },
  { name: "上海市", coords: { lat: 31.2304, lng: 121.4737 } },
  { name: "广州市", coords: { lat: 23.1291, lng: 113.2644 } },
  { name: "深圳市", coords: { lat: 22.5431, lng: 114.0579 } },
  { name: "杭州市", coords: { lat: 30.2741, lng: 120.1551 } },
  { name: "南京市", coords: { lat: 32.0603, lng: 118.7969 } },
  { name: "武汉市", coords: { lat: 30.5928, lng: 114.3055 } },
  { name: "成都市", coords: { lat: 30.6598, lng: 104.0633 } },
  { name: "西安市", coords: { lat: 34.3416, lng: 108.9398 } },
  { name: "重庆市", coords: { lat: 29.5647, lng: 106.5507 } },
  { name: "天津市", coords: { lat: 39.3434, lng: 117.3616 } },
  { name: "苏州市", coords: { lat: 31.2989, lng: 120.5853 } },
  { name: "东莞市", coords: { lat: 23.0489, lng: 113.7447 } },
  { name: "佛山市", coords: { lat: 23.0219, lng: 113.1068 } },
  { name: "厦门市", coords: { lat: 24.4798, lng: 118.0819 } }
];

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ 
  onLocationSelect, 
  initialLocation = "" 
}) => {
  const [searchQuery, setSearchQuery] = useState(initialLocation);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof PRESET_LOCATIONS>([]);
  const { toast } = useToast();

  // 搜索建议
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (value.trim().length > 1) {
      // 先显示预设城市的匹配结果
      const presetMatches = PRESET_LOCATIONS.filter(location =>
        location.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(presetMatches.slice(0, 3));

      // 延迟搜索在线地址
      const timeoutId = setTimeout(() => {
        searchLocation(value);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  };

  // 选择预设位置
  const selectPresetLocation = (location: typeof PRESET_LOCATIONS[0]) => {
    setSearchQuery(location.name);
    setSelectedLocation(location.name);
    setCoordinates(location.coords);
    setSuggestions([]);
    
    toast({
      title: "位置已选择",
      description: `已选择：${location.name}`,
    });
  };

  // 搜索地址
  const searchLocation = async (query: string) => {
    if (!query.trim() || query.length < 2) return;

    try {
      // 使用高德地图API进行地理编码搜索
      const response = await fetch(
        `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(query)}&output=json&key=your_gaode_key`
      );
      
      if (!response.ok) {
        // 回退到 Nominatim API
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=zh-CN,zh&limit=5&countrycodes=cn`
        );
        const nominatimData = await nominatimResponse.json();
        
        const searchResults = nominatimData.map((item: any) => ({
          name: item.display_name,
          coords: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
        }));
        
        setSuggestions(searchResults.slice(0, 5));
        return;
      }

      const data = await response.json();
      if (data.geocodes && data.geocodes.length > 0) {
        const searchResults = data.geocodes.map((item: any) => {
          const [lng, lat] = item.location.split(',');
          return {
            name: item.formatted_address || item.district + item.township,
            coords: { lat: parseFloat(lat), lng: parseFloat(lng) }
          };
        });
        setSuggestions(searchResults.slice(0, 5));
      }
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
          // 首先尝试使用高德地图逆地理编码
          let locationText = '';
          try {
            const gaodeResponse = await fetch(
              `https://restapi.amap.com/v3/geocode/regeo?location=${longitude},${latitude}&output=json&key=your_gaode_key&radius=1000&extensions=all`
            );
            
            if (gaodeResponse.ok) {
              const gaodeData = await gaodeResponse.json();
              if (gaodeData.status === "1" && gaodeData.regeocode) {
                const addr = gaodeData.regeocode.formatted_address;
                locationText = addr;
              }
            }
          } catch (e) {
            console.log('高德API不可用，使用备选方案');
          }

          // 如果高德失败，使用 Nominatim
          if (!locationText) {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-CN,zh&zoom=16&addressdetails=1`
            );
            const data = await response.json();

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
      // 尝试匹配预设坐标
      const matchedLocation = PRESET_LOCATIONS.find(loc => 
        loc.name.includes(searchQuery) || searchQuery.includes(loc.name.replace('市', ''))
      );
      
      if (matchedLocation) {
        setCoordinates(matchedLocation.coords);
      }
      
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
                placeholder="点击定位按钮获取当前位置，或输入地址搜索"
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
                  onClick={() => selectPresetLocation(location)}
                >
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  {location.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* 快速选择常用城市 */}
        <div>
          <Label className="text-sm font-medium mb-2 block">快速选择</Label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_LOCATIONS.slice(0, 9).map((location) => (
              <Button
                key={location.name}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => selectPresetLocation(location)}
              >
                {location.name.replace('市', '')}
              </Button>
            ))}
          </div>
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
          选择城市或输入详细地址，支持GPS定位
        </p>
      </CardContent>
    </Card>
  );
};

export default MapLocationPicker;