import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationMessageProps {
  content: string;
  isOwn: boolean;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

export function LocationMessage({ content, isOwn }: LocationMessageProps) {
  let locationData: LocationData;
  
  try {
    locationData = JSON.parse(content);
  } catch {
    // 兼容旧格式或纯文本地址
    return (
      <div className={`rounded-lg px-3 py-2 ${
        isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
      }`}>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{content}</span>
        </div>
      </div>
    );
  }

  const hasCoordinates = locationData.latitude !== 0 && locationData.longitude !== 0;

  const openInMaps = () => {
    if (hasCoordinates) {
      // 优先使用坐标打开地图
      const url = `https://www.openstreetmap.org/?mlat=${locationData.latitude}&mlon=${locationData.longitude}&zoom=16`;
      window.open(url, '_blank');
    } else if (locationData.address) {
      // 使用地址搜索
      const url = `https://www.openstreetmap.org/search?query=${encodeURIComponent(locationData.address)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`rounded-lg overflow-hidden max-w-xs ${
      isOwn ? "bg-primary" : "bg-muted"
    }`}>
      {/* 地图预览占位 */}
      {hasCoordinates && (
        <div 
          className="w-full h-32 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
          onClick={openInMaps}
        >
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto text-primary mb-1" />
            <span className="text-xs text-muted-foreground">点击查看地图</span>
          </div>
        </div>
      )}
      
      {/* 位置信息 */}
      <div className={`p-3 ${isOwn ? "text-primary-foreground" : "text-foreground"}`}>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            {locationData.name && (
              <p className="font-medium text-sm truncate">
                {locationData.name}
              </p>
            )}
            <p className="text-xs opacity-80 line-clamp-2">
              {locationData.address}
            </p>
          </div>
        </div>
        
        {(hasCoordinates || locationData.address) && (
          <Button
            variant="ghost"
            size="sm"
            className={`w-full mt-2 h-8 text-xs ${
              isOwn 
                ? "text-primary-foreground hover:bg-white/20" 
                : "text-foreground hover:bg-black/10"
            }`}
            onClick={openInMaps}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            在地图中查看
          </Button>
        )}
      </div>
    </div>
  );
}
