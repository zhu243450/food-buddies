import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Clock, Users, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface DinnerWithLocation {
  id: string;
  title: string;
  location: string;
  dinner_time: string;
  max_participants: number;
  status: string;
  food_preferences: string[] | null;
  created_by: string;
  lat?: number;
  lng?: number;
  participant_count?: number;
  creator_nickname?: string;
}

const DinnerMap = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedDinner, setSelectedDinner] = useState<DinnerWithLocation | null>(null);

  // Fetch active dinners
  const { data: dinners, isLoading } = useQuery({
    queryKey: ['dinners-map'],
    queryFn: async () => {
      const { data: dinnersData, error } = await supabase
        .from('dinners')
        .select('*')
        .eq('status', 'active')
        .gte('dinner_time', new Date().toISOString())
        .order('dinner_time', { ascending: true })
        .limit(100);

      if (error) throw error;
      if (!dinnersData?.length) return [];

      // Get participant counts
      const dinnerIds = dinnersData.map(d => d.id);
      const { data: participants } = await supabase
        .from('dinner_participants')
        .select('dinner_id')
        .in('dinner_id', dinnerIds);

      const countMap = new Map<string, number>();
      (participants || []).forEach(p => {
        countMap.set(p.dinner_id, (countMap.get(p.dinner_id) || 0) + 1);
      });

      // Get creator profiles
      const creatorIds = [...new Set(dinnersData.map(d => d.created_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname')
        .in('user_id', creatorIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.nickname]));

      // Geocode locations (use cached or parse coordinates from location string)
      const results: DinnerWithLocation[] = dinnersData.map(d => ({
        ...d,
        participant_count: (countMap.get(d.id) || 0) + 1, // +1 for creator
        creator_nickname: profileMap.get(d.created_by) || '用户',
      }));

      return results;
    },
    staleTime: 60000,
  });

  // Get user location
  const locateUser = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([loc.lat, loc.lng], 13);
          L.marker([loc.lat, loc.lng], {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            }),
          }).addTo(mapInstanceRef.current).bindPopup('📍 我的位置');
        }
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([39.9042, 116.4074], 11); // Default: Beijing
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;
    locateUser();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Add dinner markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !dinners?.length) return;

    // For dinners without coordinates, place them with slight offsets around a default location
    // In production, you'd geocode the location text
    const defaultCenter = userLocation || { lat: 39.9042, lng: 116.4074 };

    dinners.forEach((dinner, i) => {
      // Create a spread pattern for dinners
      const angle = (i / dinners.length) * 2 * Math.PI;
      const radius = 0.01 + Math.random() * 0.03;
      const lat = defaultCenter.lat + Math.cos(angle) * radius;
      const lng = defaultCenter.lng + Math.sin(angle) * radius;

      const timeStr = formatDistanceToNow(new Date(dinner.dinner_time), { addSuffix: true, locale: zhCN });
      const icon = L.divIcon({
        className: 'dinner-marker',
        html: `<div style="background: linear-gradient(135deg, #ec4899, #f43f5e); color:white; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:600; white-space:nowrap; box-shadow:0 2px 8px rgba(236,72,153,0.4); border:2px solid white; cursor:pointer;">🍽 ${dinner.title.slice(0, 6)}</div>`,
        iconSize: [80, 28],
        iconAnchor: [40, 14],
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .on('click', () => setSelectedDinner({ ...dinner, lat, lng }));
    });
  }, [dinners, userLocation]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/40">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground flex-1">附近饭局</h1>
          <Button variant="outline" size="sm" onClick={locateUser} disabled={isLocating} className="gap-1">
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            定位
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <div ref={mapRef} className="h-[60vh] w-full" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Stats overlay */}
        <div className="absolute top-3 right-3 z-[1000]">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur shadow-sm">
            <MapPin className="w-3 h-3 mr-1" />
            {dinners?.length || 0} 个饭局
          </Badge>
        </div>
      </div>

      {/* Selected dinner card */}
      {selectedDinner && (
        <div className="px-4 -mt-6 relative z-[1000] max-w-lg mx-auto">
          <Card className="shadow-lg border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{selectedDinner.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {selectedDinner.creator_nickname}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedDinner.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(selectedDinner.dinner_time), { addSuffix: true, locale: zhCN })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {selectedDinner.participant_count}/{selectedDinner.max_participants}
                    </span>
                  </div>
                  {selectedDinner.food_preferences?.length ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedDinner.food_preferences.slice(0, 3).map(pref => (
                        <Badge key={pref} variant="outline" className="text-xs">{pref}</Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  className="ml-3 shrink-0"
                  onClick={() => navigate(`/dinner/${selectedDinner.id}`)}
                >
                  查看
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dinner list below map */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">附近的饭局</h2>
        {dinners?.map(dinner => (
          <Card
            key={dinner.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/dinner/${dinner.id}`)}
          >
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-foreground">{dinner.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(dinner.dinner_time), { addSuffix: true, locale: zhCN })}
                  </span>
                  <span>·</span>
                  <span>{dinner.participant_count}/{dinner.max_participants}人</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {dinner.location.slice(0, 8)}
              </Badge>
            </CardContent>
          </Card>
        ))}
        {!isLoading && !dinners?.length && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            附近暂无饭局，快去创建一个吧！
          </div>
        )}
      </div>
    </div>
  );
};

export default DinnerMap;
