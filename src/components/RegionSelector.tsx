import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, X } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface Division {
  id: string;
  name: string;
  code: string;
  level: 'province' | 'city' | 'county' | 'town';
  parent_id: string | null;
}

interface RegionSelectorProps {
  selectedDivisionId?: string;
  onSelectionChange: (divisionId: string | null, divisionPath: Division[]) => void;
  placeholder?: string;
}

export function RegionSelector({ selectedDivisionId, onSelectionChange, placeholder = "选择区域" }: RegionSelectorProps) {
  const [provinces, setProvinces] = useState<Division[]>([]);
  const [cities, setCities] = useState<Division[]>([]);
  const [counties, setCounties] = useState<Division[]>([]);
  const [towns, setTowns] = useState<Division[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [selectedTown, setSelectedTown] = useState<string>('');
  
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Division[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 缓存已加载的数据
  const [dataCache, setDataCache] = useState<Record<string, Division[]>>({});

  // 加载省份
  useEffect(() => {
    loadProvinces();
  }, []);

  // 如果有预选值，加载完整路径
  useEffect(() => {
    if (selectedDivisionId && provinces.length > 0) {
      loadDivisionPath(selectedDivisionId);
    }
  }, [selectedDivisionId, provinces]);

  const loadProvinces = async () => {
    try {
      const { data, error } = await supabase
        .from('administrative_divisions')
        .select('*')
        .eq('level', 'province')
        .eq('is_active', true)
        .order('display_order')
        .order('name');

      if (error) throw error;
      setProvinces(data || []);
    } catch (error) {
      console.error('Failed to load provinces:', error);
      toast.error('加载省份数据失败');
    }
  };

  const loadCities = useCallback(async (provinceId: string) => {
    const cacheKey = `cities-${provinceId}`;
    if (dataCache[cacheKey]) {
      setCities(dataCache[cacheKey]);
      setCounties([]);
      setTowns([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('administrative_divisions')
        .select('*')
        .eq('parent_id', provinceId)
        .eq('level', 'city')
        .eq('is_active', true)
        .order('display_order')
        .order('name');

      if (error) throw error;
      const cities = data || [];
      setCities(cities);
      setCounties([]);
      setTowns([]);
      
      // 缓存数据
      setDataCache(prev => ({ ...prev, [cacheKey]: cities }));
    } catch (error) {
      console.error('Failed to load cities:', error);
      toast.error('加载城市数据失败');
    }
  }, [dataCache]);

  const loadCounties = useCallback(async (cityId: string) => {
    const cacheKey = `counties-${cityId}`;
    if (dataCache[cacheKey]) {
      setCounties(dataCache[cacheKey]);
      setTowns([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('administrative_divisions')
        .select('*')
        .eq('parent_id', cityId)
        .eq('level', 'county')
        .eq('is_active', true)
        .order('display_order')
        .order('name');

      if (error) throw error;
      const counties = data || [];
      setCounties(counties);
      setTowns([]);
      
      // 缓存数据
      setDataCache(prev => ({ ...prev, [cacheKey]: counties }));
    } catch (error) {
      console.error('Failed to load counties:', error);
      toast.error('加载区县数据失败');
    }
  }, [dataCache]);

  const loadTowns = useCallback(async (countyId: string) => {
    const cacheKey = `towns-${countyId}`;
    if (dataCache[cacheKey]) {
      setTowns(dataCache[cacheKey]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('administrative_divisions')
        .select('*')
        .eq('parent_id', countyId)
        .eq('level', 'town')
        .eq('is_active', true)
        .order('display_order')
        .order('name');

      if (error) throw error;
      const towns = data || [];
      setTowns(towns);
      
      // 缓存数据
      setDataCache(prev => ({ ...prev, [cacheKey]: towns }));
    } catch (error) {
      console.error('Failed to load towns:', error);
      toast.error('加载乡镇数据失败');
    }
  }, [dataCache]);

  const loadDivisionPath = async (divisionId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_division_path', { division_id_param: divisionId });

      if (error) throw error;

      const path = (data || []).reverse(); // 从省到镇的顺序
      
      for (const division of path) {
        switch (division.level) {
          case 'province':
            setSelectedProvince(division.id);
            await loadCities(division.id);
            break;
          case 'city':
            setSelectedCity(division.id);
            await loadCounties(division.id);
            break;
          case 'county':
            setSelectedCounty(division.id);
            await loadTowns(division.id);
            break;
          case 'town':
            setSelectedTown(division.id);
            break;
        }
      }
    } catch (error) {
      console.error('Failed to load division path:', error);
    }
  };

  const handleProvinceChange = (provinceId: string) => {
    setSelectedProvince(provinceId);
    setSelectedCity('');
    setSelectedCounty('');
    setSelectedTown('');
    setCities([]);
    setCounties([]);
    setTowns([]);
    
    loadCities(provinceId);
    
    const province = provinces.find(p => p.id === provinceId);
    if (province) {
      onSelectionChange(provinceId, [province]);
    }
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    setSelectedCounty('');
    setSelectedTown('');
    setCounties([]);
    setTowns([]);
    
    loadCounties(cityId);
    
    const province = provinces.find(p => p.id === selectedProvince);
    const city = cities.find(c => c.id === cityId);
    if (province && city) {
      onSelectionChange(cityId, [province, city]);
    }
  };

  const handleCountyChange = (countyId: string) => {
    setSelectedCounty(countyId);
    setSelectedTown('');
    setTowns([]);
    
    loadTowns(countyId);
    
    const province = provinces.find(p => p.id === selectedProvince);
    const city = cities.find(c => c.id === selectedCity);
    const county = counties.find(c => c.id === countyId);
    if (province && city && county) {
      onSelectionChange(countyId, [province, city, county]);
    }
  };

  const handleTownChange = (townId: string) => {
    setSelectedTown(townId);
    
    const province = provinces.find(p => p.id === selectedProvince);
    const city = cities.find(c => c.id === selectedCity);
    const county = counties.find(c => c.id === selectedCounty);
    const town = towns.find(t => t.id === townId);
    if (province && city && county && town) {
      onSelectionChange(townId, [province, city, county, town]);
    }
  };

  // 防抖搜索
  const debouncedSearch = useCallback(
    useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (!query.trim()) {
            setSearchResults([]);
            return;
          }

          setLoading(true);
          try {
            const { data, error } = await supabase
              .from('administrative_divisions')
              .select('*')
              .ilike('name', `%${query}%`)
              .eq('is_active', true)
              .order('level')
              .order('name')
              .limit(20);

            if (error) throw error;
            setSearchResults(data || []);
          } catch (error) {
            console.error('Search failed:', error);
            toast.error('搜索失败');
          } finally {
            setLoading(false);
          }
        }, 300);
      };
    }, []),
    []
  );

  const handleSearchResultSelect = async (division: Division) => {
    setSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
    
    // 加载完整路径并设置选择状态
    await loadDivisionPath(division.id);
    
    // 获取完整路径用于回调
    try {
      const { data, error } = await supabase
        .rpc('get_division_path', { division_id_param: division.id });

      if (error) throw error;

      const path = (data || []).reverse().map(d => ({
        id: d.id,
        name: d.name,
        code: '',
        level: d.level as Division['level'],
        parent_id: null
      }));
      
      onSelectionChange(division.id, path);
    } catch (error) {
      console.error('Failed to get division path:', error);
    }
  };

  const clearSelection = () => {
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedCounty('');
    setSelectedTown('');
    setCities([]);
    setCounties([]);
    setTowns([]);
    onSelectionChange(null, []);
  };

  const getLevelLabel = (level: string) => {
    const labels = {
      province: '省',
      city: '市',
      county: '县/区',
      town: '镇/街道'
    };
    return labels[level as keyof typeof labels] || level;
  };

  if (searchMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索省市县镇..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                debouncedSearch(e.target.value);
              }}
              className="pl-10"
              autoFocus
            />
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              setSearchMode(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {loading && (
          <div className="text-center text-muted-foreground py-4">搜索中...</div>
        )}
        
        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-accent"
                onClick={() => handleSearchResultSelect(result)}
              >
                <div className="flex items-center justify-between">
                  <span>{result.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {getLevelLabel(result.level)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" />
        <span className="font-medium">选择区域</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSearchMode(true)}
          className="ml-auto"
        >
          <Search className="h-4 w-4 mr-1" />
          搜索
        </Button>
        {(selectedProvince || selectedCity || selectedCounty || selectedTown) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 省份选择 */}
        <div>
          <label className="text-sm font-medium mb-2 block">省份</label>
          <Select value={selectedProvince} onValueChange={handleProvinceChange}>
            <SelectTrigger>
              <SelectValue placeholder="选择省份" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.id} value={province.id}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 城市选择 */}
        {cities.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-2 block">城市</label>
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择城市" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 区县选择 */}
        {counties.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-2 block">区县</label>
            <Select value={selectedCounty} onValueChange={handleCountyChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择区县" />
              </SelectTrigger>
              <SelectContent>
                {counties.map((county) => (
                  <SelectItem key={county.id} value={county.id}>
                    {county.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 乡镇选择 */}
        {towns.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-2 block">乡镇</label>
            <Select value={selectedTown} onValueChange={handleTownChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择乡镇" />
              </SelectTrigger>
              <SelectContent>
                {towns.map((town) => (
                  <SelectItem key={town.id} value={town.id}>
                    {town.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}