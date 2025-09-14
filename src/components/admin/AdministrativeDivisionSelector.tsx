import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Division {
  id: string;
  name: string;
  level: 'province' | 'city' | 'district' | 'town' | 'subdistrict';
  parent_id: string | null;
}

interface AdministrativeDivisionSelectorProps {
  selectedDivisionId?: string;
  onDivisionSelect: (divisionId: string, divisionHierarchy: string) => void;
  onCityCreated?: (cityId: string) => void;
}

export function AdministrativeDivisionSelector({
  selectedDivisionId,
  onDivisionSelect,
  onCityCreated
}: AdministrativeDivisionSelectorProps) {
  const [provinces, setProvinces] = useState<Division[]>([]);
  const [cities, setCities] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<Division[]>([]);
  const [towns, setTowns] = useState<Division[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedTown, setSelectedTown] = useState<string>('');
  
  const [isAddingProvince, setIsAddingProvince] = useState(false);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [isAddingDistrict, setIsAddingDistrict] = useState(false);
  const [isAddingTown, setIsAddingTown] = useState(false);
  
  const [newDivisionName, setNewDivisionName] = useState('');
  const [newDivisionCode, setNewDivisionCode] = useState('');

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load selected division hierarchy on mount
  useEffect(() => {
    if (selectedDivisionId) {
      loadSelectedDivisionHierarchy(selectedDivisionId);
    }
  }, [selectedDivisionId]);

  const loadProvinces = async () => {
    const { data } = await supabase
      .from('administrative_divisions')
      .select('*')
      .eq('level', 'province')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    setProvinces(data || []);
  };

  const loadCities = async (provinceId: string) => {
    const { data } = await supabase
      .from('administrative_divisions')
      .select('*')
      .eq('level', 'city')
      .eq('parent_id', provinceId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    setCities(data || []);
  };

  const loadDistricts = async (cityId: string) => {
    const { data } = await supabase
      .from('administrative_divisions')
      .select('*')
      .eq('level', 'district')
      .eq('parent_id', cityId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    setDistricts(data || []);
  };

  const loadTowns = async (districtId: string) => {
    const { data } = await supabase
      .from('administrative_divisions')
      .select('*')
      .eq('level', 'town')
      .eq('parent_id', districtId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    setTowns(data || []);
  };

  const loadSelectedDivisionHierarchy = async (divisionId: string) => {
    // Load the hierarchy up from the selected division
    let currentId = divisionId;
    const hierarchy: Division[] = [];
    
    while (currentId) {
      const { data } = await supabase
        .from('administrative_divisions')
        .select('*')
        .eq('id', currentId)
        .single();
      
      if (data) {
        hierarchy.unshift(data);
        currentId = data.parent_id;
      } else {
        break;
      }
    }

    // Set selections based on hierarchy
    hierarchy.forEach(division => {
      switch (division.level) {
        case 'province':
          setSelectedProvince(division.id);
          loadCities(division.id);
          break;
        case 'city':
          setSelectedCity(division.id);
          loadDistricts(division.id);
          break;
        case 'district':
          setSelectedDistrict(division.id);
          loadTowns(division.id);
          break;
        case 'town':
          setSelectedTown(division.id);
          break;
      }
    });
  };

  const addDivision = async (name: string, code: string, level: string, parentId: string | null) => {
    const { data, error } = await supabase
      .from('administrative_divisions')
      .insert({
        name,
        code: code || null,
        level,
        parent_id: parentId,
        display_order: 0
      })
      .select()
      .single();

    if (error) {
      toast.error('添加失败: ' + error.message);
      return null;
    }

    toast.success(`已添加${name}`);
    return data;
  };

  const handleProvinceChange = (provinceId: string) => {
    setSelectedProvince(provinceId);
    setSelectedCity('');
    setSelectedDistrict('');
    setSelectedTown('');
    setCities([]);
    setDistricts([]);
    setTowns([]);
    
    if (provinceId) {
      loadCities(provinceId);
      updateSelection(provinceId);
    }
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    setSelectedDistrict('');
    setSelectedTown('');
    setDistricts([]);
    setTowns([]);
    
    if (cityId) {
      loadDistricts(cityId);
      updateSelection(cityId);
      
      // Ensure we have a city record and update the parent with the correct city_id
      ensureCityRecord(cityId);
    }
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedTown('');
    setTowns([]);
    
    if (districtId) {
      loadTowns(districtId);
      updateSelection(districtId);
    }
  };

  const handleTownChange = (townId: string) => {
    setSelectedTown(townId);
    updateSelection(townId);
  };

  const updateSelection = (divisionId: string) => {
    // Build hierarchy string for display
    const buildHierarchy = () => {
      const parts = [];
      if (selectedProvince) {
        const province = provinces.find(p => p.id === selectedProvince);
        if (province) parts.push(province.name);
      }
      
      const cityId = divisionId === selectedProvince ? '' : selectedCity;
      if (cityId) {
        const city = cities.find(c => c.id === cityId);
        if (city) parts.push(city.name);
      }
      
      const districtId = divisionId === selectedCity ? '' : selectedDistrict;
      if (districtId) {
        const district = districts.find(d => d.id === districtId);
        if (district) parts.push(district.name);
      }
      
      const townId = divisionId === selectedDistrict ? '' : selectedTown;
      if (townId && divisionId === townId) {
        const town = towns.find(t => t.id === townId);
        if (town) parts.push(town.name);
      }
      
      return parts.join(' > ');
    };
    
    onDivisionSelect(divisionId, buildHierarchy());
  };

  const ensureCityRecord = async (divisionId: string) => {
    // Get the city ancestor for this division
    const { data: cityAncestorId } = await supabase
      .rpc('get_city_ancestor', { _division_id: divisionId });

    if (cityAncestorId) {
      // Get division details for the city ancestor
      const { data: cityDivision } = await supabase
        .from('administrative_divisions')
        .select('name, code')
        .eq('id', cityAncestorId)
        .single();

      if (cityDivision) {
        // Generate city key from division code or name
        const cityKey = cityDivision.code ? 
          (cityDivision.code === '440300' ? 'shenzhen' : 
           cityDivision.code === '110100' ? 'beijing' :
           cityDivision.code === '310100' ? 'shanghai' :
           cityDivision.code.substring(0, 4)) :
          cityDivision.name.toLowerCase().replace(/[市省]/g, '');

        // Check if city record exists
        const { data: existingCity } = await supabase
          .from('cities')
          .select('id')
          .eq('key', cityKey)
          .single();

        if (existingCity && onCityCreated) {
          onCityCreated(existingCity.id);
        } else if (!existingCity) {
          // Create city record
          const { data: newCity } = await supabase
            .from('cities')
            .insert({
              key: cityKey,
              name: cityDivision.name,
              description: `${cityDivision.name}美食指南`,
              is_active: true,
              display_order: 0,
              popular_cuisines: [],
              popular_areas: [],
              dining_tips: []
            })
            .select()
            .single();

          if (newCity && onCityCreated) {
            onCityCreated(newCity.id);
          }
        }
      }
    }
  };

  const handleAddProvince = async () => {
    if (!newDivisionName) return;
    
    const newProvince = await addDivision(newDivisionName, newDivisionCode, 'province', null);
    if (newProvince) {
      await loadProvinces();
      setNewDivisionName('');
      setNewDivisionCode('');
      setIsAddingProvince(false);
    }
  };

  const handleAddCity = async () => {
    if (!newDivisionName || !selectedProvince) return;
    
    const newCity = await addDivision(newDivisionName, newDivisionCode, 'city', selectedProvince);
    if (newCity) {
      await loadCities(selectedProvince);
      setNewDivisionName('');
      setNewDivisionCode('');
      setIsAddingCity(false);
    }
  };

  const handleAddDistrict = async () => {
    if (!newDivisionName || !selectedCity) return;
    
    const newDistrict = await addDivision(newDivisionName, newDivisionCode, 'district', selectedCity);
    if (newDistrict) {
      await loadDistricts(selectedCity);
      setNewDivisionName('');
      setNewDivisionCode('');
      setIsAddingDistrict(false);
    }
  };

  const handleAddTown = async () => {
    if (!newDivisionName || !selectedDistrict) return;
    
    const newTown = await addDivision(newDivisionName, newDivisionCode, 'town', selectedDistrict);
    if (newTown) {
      await loadTowns(selectedDistrict);
      setNewDivisionName('');
      setNewDivisionCode('');
      setIsAddingTown(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5" />
        <h3 className="text-lg font-medium">选择行政区划</h3>
      </div>

      {/* Province Selector */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Label htmlFor="province">省/直辖市</Label>
          <Select value={selectedProvince} onValueChange={handleProvinceChange}>
            <SelectTrigger>
              <SelectValue placeholder="选择省/直辖市" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map(province => (
                <SelectItem key={province.id} value={province.id}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isAddingProvince} onOpenChange={setIsAddingProvince}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加省/直辖市</DialogTitle>
              <DialogDescription>
                创建新的省级行政区划
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="province-name">名称</Label>
                <Input
                  id="province-name"
                  value={newDivisionName}
                  onChange={(e) => setNewDivisionName(e.target.value)}
                  placeholder="如：广东省"
                />
              </div>
              <div>
                <Label htmlFor="province-code">代码（可选）</Label>
                <Input
                  id="province-code"
                  value={newDivisionCode}
                  onChange={(e) => setNewDivisionCode(e.target.value)}
                  placeholder="如：440000"
                />
              </div>
              <Button onClick={handleAddProvince} className="w-full">
                添加
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* City Selector */}
      {selectedProvince && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="city">市</Label>
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择市" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(city => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isAddingCity} onOpenChange={setIsAddingCity}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加市</DialogTitle>
                <DialogDescription>
                  为所选省份添加新的地级市
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="city-name">名称</Label>
                  <Input
                    id="city-name"
                    value={newDivisionName}
                    onChange={(e) => setNewDivisionName(e.target.value)}
                    placeholder="如：深圳市"
                  />
                </div>
                <div>
                  <Label htmlFor="city-code">代码（可选）</Label>
                  <Input
                    id="city-code"
                    value={newDivisionCode}
                    onChange={(e) => setNewDivisionCode(e.target.value)}
                    placeholder="如：440300"
                  />
                </div>
                <Button onClick={handleAddCity} className="w-full">
                  添加
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* District Selector */}
      {selectedCity && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="district">区/县</Label>
            <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择区/县" />
              </SelectTrigger>
              <SelectContent>
                {districts.map(district => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isAddingDistrict} onOpenChange={setIsAddingDistrict}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加区/县</DialogTitle>
                <DialogDescription>
                  为所选城市添加新的区县
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="district-name">名称</Label>
                  <Input
                    id="district-name"
                    value={newDivisionName}
                    onChange={(e) => setNewDivisionName(e.target.value)}
                    placeholder="如：南山区"
                  />
                </div>
                <div>
                  <Label htmlFor="district-code">代码（可选）</Label>
                  <Input
                    id="district-code"
                    value={newDivisionCode}
                    onChange={(e) => setNewDivisionCode(e.target.value)}
                    placeholder="如：440305"
                  />
                </div>
                <Button onClick={handleAddDistrict} className="w-full">
                  添加
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Town Selector */}
      {selectedDistrict && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="town">街道/镇</Label>
            <Select value={selectedTown} onValueChange={handleTownChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择街道/镇" />
              </SelectTrigger>
              <SelectContent>
                {towns.map(town => (
                  <SelectItem key={town.id} value={town.id}>
                    {town.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isAddingTown} onOpenChange={setIsAddingTown}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加街道/镇</DialogTitle>
                <DialogDescription>
                  为所选区县添加新的街道或镇
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="town-name">名称</Label>
                  <Input
                    id="town-name"
                    value={newDivisionName}
                    onChange={(e) => setNewDivisionName(e.target.value)}
                    placeholder="如：粤海街道"
                  />
                </div>
                <div>
                  <Label htmlFor="town-code">代码（可选）</Label>
                  <Input
                    id="town-code"
                    value={newDivisionCode}
                    onChange={(e) => setNewDivisionCode(e.target.value)}
                    placeholder="如：440305005"
                  />
                </div>
                <Button onClick={handleAddTown} className="w-full">
                  添加
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}