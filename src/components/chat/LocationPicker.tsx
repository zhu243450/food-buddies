import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Loader2, Search, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  disabled?: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

export function LocationPicker({ onLocationSelect, disabled = false }: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const { toast } = useToast();

  // 获取当前位置
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: '不支持定位',
        description: '您的浏览器不支持地理位置功能',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // 使用反向地理编码获取地址
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'zh-CN,zh;q=0.9'
              }
            }
          );
          const data = await response.json();
          
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setCurrentLocation({
            latitude,
            longitude,
            address,
            name: data.name || '当前位置'
          });
        } catch (error) {
          // 如果反向地理编码失败，使用坐标作为地址
          setCurrentLocation({
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            name: '当前位置'
          });
        }
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        let message = '获取位置失败';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = '请允许获取位置权限';
            break;
          case error.POSITION_UNAVAILABLE:
            message = '位置信息不可用';
            break;
          case error.TIMEOUT:
            message = '获取位置超时';
            break;
        }
        toast({
          title: '定位失败',
          description: message,
          variant: 'destructive'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // 搜索位置
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'zh-CN,zh;q=0.9'
          }
        }
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        setCurrentLocation({
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: result.display_name,
          name: result.name || searchQuery
        });
      } else {
        toast({
          title: '未找到位置',
          description: '请尝试其他搜索词',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '搜索失败',
        description: '请稍后重试',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  // 发送位置
  const handleSendLocation = () => {
    if (currentLocation) {
      onLocationSelect(currentLocation);
      setIsOpen(false);
      setCurrentLocation(null);
      setSearchQuery('');
      setManualAddress('');
    }
  };

  // 手动输入地址
  const handleManualAddress = () => {
    if (manualAddress.trim()) {
      onLocationSelect({
        latitude: 0,
        longitude: 0,
        address: manualAddress.trim(),
        name: '位置'
      });
      setIsOpen(false);
      setManualAddress('');
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="h-9 w-9"
        title="发送位置"
      >
        <MapPin className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              分享位置
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 获取当前位置 */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-12"
              onClick={getCurrentLocation}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Navigation className="h-5 w-5 text-primary" />
              )}
              <span className="flex-1 text-left">
                {loading ? '正在获取位置...' : '发送当前位置'}
              </span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">或</span>
              </div>
            </div>

            {/* 搜索位置 */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索位置..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                  className="pl-9"
                />
              </div>
              <Button onClick={searchLocation} disabled={loading || !searchQuery.trim()}>
                搜索
              </Button>
            </div>

            {/* 手动输入地址 */}
            <div className="flex gap-2">
              <Input
                placeholder="手动输入地址..."
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualAddress()}
              />
              <Button 
                variant="outline" 
                onClick={handleManualAddress}
                disabled={!manualAddress.trim()}
              >
                发送
              </Button>
            </div>

            {/* 显示当前选择的位置 */}
            {currentLocation && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {currentLocation.name || '位置'}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {currentLocation.address}
                    </p>
                    {currentLocation.latitude !== 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={handleSendLocation}
                  className="w-full mt-2"
                >
                  <Send className="h-4 w-4 mr-2" />
                  发送此位置
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
