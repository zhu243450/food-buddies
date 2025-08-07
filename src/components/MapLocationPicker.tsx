import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Search } from 'lucide-react';

interface MapLocationPickerProps {
  onLocationSelect: (location: string, coordinates?: { lat: number; lng: number }) => void;
  initialLocation?: string;
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ 
  onLocationSelect, 
  initialLocation = "" 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialLocation);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // 使用Mapbox的公开token (这里需要配置真实的token)
    mapboxgl.accessToken = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example_token_here';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [116.4074, 39.9042], // 北京坐标
      zoom: 12,
    });

    // 添加地图控件
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // 地图点击事件
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      addMarker(lng, lat);
      
      // 反向地理编码
      reverseGeocode(lng, lat);
    });

    // 获取用户当前位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          map.current?.setCenter([longitude, latitude]);
          addMarker(longitude, latitude);
        },
        (error) => {
          console.log('位置获取失败:', error);
        }
      );
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  const addMarker = (lng: number, lat: number) => {
    if (marker.current) {
      marker.current.remove();
    }

    marker.current = new mapboxgl.Marker({
      color: '#ff6b6b',
      draggable: true
    })
      .setLngLat([lng, lat])
      .addTo(map.current!);

    // 标记拖拽事件
    marker.current.on('dragend', () => {
      const lngLat = marker.current!.getLngLat();
      reverseGeocode(lngLat.lng, lngLat.lat);
    });

    setCoordinates({ lat, lng });
  };

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      // 使用Mapbox地理编码API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&language=zh`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const placeName = data.features[0].place_name;
        setSelectedLocation(placeName);
        setSearchQuery(placeName);
      }
    } catch (error) {
      console.error('反向地理编码失败:', error);
      setSelectedLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    try {
      // 使用Mapbox地理编码API搜索
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}&country=CN&language=zh&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const placeName = data.features[0].place_name;
        
        map.current?.setCenter([lng, lat]);
        map.current?.setZoom(15);
        addMarker(lng, lat);
        
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