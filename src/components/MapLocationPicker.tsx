import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Search } from 'lucide-react';

// 修复 Leaflet 默认图标问题
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapLocationPickerProps {
  onLocationSelect: (location: string, coordinates?: { lat: number; lng: number }) => void;
  initialLocation?: string;
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ 
  onLocationSelect, 
  initialLocation = "" 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialLocation);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // 初始化 Leaflet 地图 (完全免费)
    map.current = L.map(mapContainer.current).setView([39.9042, 116.4074], 12);

    // 添加 OpenStreetMap 瓦片层 (免费)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map.current);

    // 地图点击事件
    map.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      addMarker(lat, lng);
      
      // 反向地理编码
      reverseGeocode(lat, lng);
    });

    // 获取用户当前位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.current?.setView([latitude, longitude], 15);
          addMarker(latitude, longitude);
        },
        (error) => {
          console.log('位置获取失败:', error);
        }
      );
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const addMarker = (lat: number, lng: number) => {
    if (marker.current) {
      map.current?.removeLayer(marker.current);
    }

    marker.current = L.marker([lat, lng], {
      draggable: true
    }).addTo(map.current!);

    // 标记拖拽事件
    marker.current.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      reverseGeocode(lat, lng);
    });

    setCoordinates({ lat, lng });
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // 使用 Nominatim API (OpenStreetMap 免费地理编码服务)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh-CN,zh`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setSelectedLocation(data.display_name);
        setSearchQuery(data.display_name);
      }
    } catch (error) {
      console.error('反向地理编码失败:', error);
      setSelectedLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    try {
      // 使用 Nominatim API 搜索 (免费)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=cn&accept-language=zh-CN,zh&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const placeName = data[0].display_name;
        
        map.current?.setView([lat, lng], 15);
        addMarker(lat, lng);
        
        setSelectedLocation(placeName);
        setSearchQuery(placeName);
      }
    } catch (error) {
      console.error('搜索失败:', error);
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
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">搜索地点</Label>
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索餐厅、地址或地标"
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
            />
          </div>
          <Button onClick={searchLocation} size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* 地图容器 */}
        <div 
          ref={mapContainer} 
          className="w-full h-64 rounded-lg border"
          style={{ minHeight: '256px' }}
        />

        {/* 选中的位置 */}
        {selectedLocation && (
          <div className="p-3 bg-accent/10 rounded-lg">
            <p className="text-sm font-medium">选中的位置：</p>
            <p className="text-sm text-muted-foreground">{selectedLocation}</p>
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
          点击地图选择位置，或者拖动标记调整位置
        </p>
      </CardContent>
    </Card>
  );
};

export default MapLocationPicker;