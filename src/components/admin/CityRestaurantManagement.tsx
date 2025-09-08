import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Plus, Store, Utensils, Trash2, Star, Loader2, Check, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface City {
  id: string;
  key: string;
  name: string;
  description: string;
  popular_cuisines: string[];
  popular_areas: string[];
  dining_tips: string[];
  is_active: boolean;
  display_order: number;
}

interface Restaurant {
  id: string;
  city_id: string;
  name: string;
  cuisine: string;
  area: string;
  rating: number;
  price_range: string;
  special_dishes: string[];
  best_time: string;
  group_size: string;
  description: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
}

interface CuisineGuide {
  id: string;
  city_id: string;
  name: string;
  description: string;
  characteristics: string[];
  must_try_dishes: string[];
  is_active: boolean;
  display_order: number;
}

const commaSplit = (v: string) => v.split(',').map(s => s.trim()).filter(Boolean);
const lineSplit = (v: string) => v.split(/\n|,|；|;|、/).map(s => s.trim()).filter(Boolean);

export const CityRestaurantManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>('');

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [cuisines, setCuisines] = useState<CuisineGuide[]>([]);

  // Forms
  const [cityForm, setCityForm] = useState({
    key: '', name: '', description: '', popular_cuisines: '', popular_areas: '', dining_tips: '', is_active: true,
  });

  const [restaurantForm, setRestaurantForm] = useState({
    name: '', cuisine: '', area: '', rating: 4.5, price_range: '', special_dishes: '', best_time: '', group_size: '', description: '', is_featured: true, is_active: true,
  });

  const [cuisineForm, setCuisineForm] = useState({
    name: '', description: '', characteristics: '', must_try_dishes: '', is_active: true,
  });

  const selectedCity = useMemo(() => cities.find(c => c.id === selectedCityId) || null, [cities, selectedCityId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('cities').select('*').order('display_order').order('name');
        if (error) throw error;
        setCities(data || []);
        if ((data || []).length && !selectedCityId) setSelectedCityId((data as City[])[0].id);
      } catch (e: any) {
        console.error(e);
        toast.error('加载城市失败: ' + e.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const loadCityData = async () => {
      if (!selectedCityId) return;
      try {
        const [{ data: rs, error: re }, { data: cs, error: ce }] = await Promise.all([
          supabase.from('restaurants').select('*').eq('city_id', selectedCityId).order('is_featured', { ascending: false }).order('display_order').order('name'),
          supabase.from('cuisine_guides').select('*').eq('city_id', selectedCityId).order('display_order').order('name'),
        ]);
        if (re) throw re; if (ce) throw ce;
        setRestaurants(rs || []);
        setCuisines(cs || []);
      } catch (e: any) {
        console.error(e);
        toast.error('加载餐厅/菜系失败: ' + e.message);
      }
    };
    loadCityData();
  }, [selectedCityId]);

  const addCity = async () => {
    if (!cityForm.key || !cityForm.name) {
      toast.error('城市标识和名称必填');
      return;
    }
    try {
      const { error } = await supabase.from('cities').insert({
        key: cityForm.key.trim(),
        name: cityForm.name.trim(),
        description: cityForm.description.trim(),
        popular_cuisines: commaSplit(cityForm.popular_cuisines),
        popular_areas: commaSplit(cityForm.popular_areas),
        dining_tips: lineSplit(cityForm.dining_tips),
        is_active: cityForm.is_active,
      });
      if (error) throw error;
      toast.success('已添加城市');
      setCityForm({ key: '', name: '', description: '', popular_cuisines: '', popular_areas: '', dining_tips: '', is_active: true });
      const { data } = await supabase.from('cities').select('*').order('display_order').order('name');
      setCities(data || []);
    } catch (e: any) {
      toast.error('添加失败: ' + e.message);
    }
  };

  const toggleCityActive = async (city: City, next: boolean) => {
    try {
      const { error } = await supabase.from('cities').update({ is_active: next }).eq('id', city.id);
      if (error) throw error;
      setCities(prev => prev.map(c => c.id === city.id ? { ...c, is_active: next } : c));
    } catch (e: any) { toast.error('更新失败: ' + e.message); }
  };

  const deleteCity = async (city: City) => {
    if (!confirm(`确认删除城市「${city.name}」及其下的餐厅/菜系？`)) return;
    try {
      const { error } = await supabase.from('cities').delete().eq('id', city.id);
      if (error) throw error;
      setCities(prev => prev.filter(c => c.id !== city.id));
      if (selectedCityId === city.id) setSelectedCityId('');
      toast.success('已删除');
    } catch (e: any) { toast.error('删除失败: ' + e.message); }
  };

  const addRestaurant = async () => {
    if (!selectedCityId) { toast.error('请选择城市'); return; }
    if (!restaurantForm.name) { toast.error('餐厅名称必填'); return; }
    try {
      const { error } = await supabase.from('restaurants').insert({
        city_id: selectedCityId,
        name: restaurantForm.name.trim(),
        cuisine: restaurantForm.cuisine.trim(),
        area: restaurantForm.area.trim(),
        rating: restaurantForm.rating,
        price_range: restaurantForm.price_range.trim(),
        special_dishes: commaSplit(restaurantForm.special_dishes),
        best_time: restaurantForm.best_time.trim(),
        group_size: restaurantForm.group_size.trim(),
        description: restaurantForm.description.trim(),
        is_featured: restaurantForm.is_featured,
        is_active: restaurantForm.is_active,
      });
      if (error) throw error;
      toast.success('已添加餐厅');
      setRestaurantForm({ name: '', cuisine: '', area: '', rating: 4.5, price_range: '', special_dishes: '', best_time: '', group_size: '', description: '', is_featured: true, is_active: true });
      const { data } = await supabase.from('restaurants').select('*').eq('city_id', selectedCityId).order('is_featured', { ascending: false }).order('display_order').order('name');
      setRestaurants(data || []);
    } catch (e: any) { toast.error('添加失败: ' + e.message); }
  };

  const updateRestaurant = async (r: Restaurant, patch: Partial<Restaurant>) => {
    try {
      const { error } = await supabase.from('restaurants').update(patch).eq('id', r.id);
      if (error) throw error;
      setRestaurants(prev => prev.map(it => it.id === r.id ? { ...it, ...patch } : it));
    } catch (e: any) { toast.error('更新失败: ' + e.message); }
  };

  const deleteRestaurant = async (r: Restaurant) => {
    if (!confirm(`确认删除餐厅「${r.name}」？`)) return;
    try {
      const { error } = await supabase.from('restaurants').delete().eq('id', r.id);
      if (error) throw error;
      setRestaurants(prev => prev.filter(it => it.id !== r.id));
      toast.success('已删除');
    } catch (e: any) { toast.error('删除失败: ' + e.message); }
  };

  const addCuisine = async () => {
    if (!selectedCityId) { toast.error('请选择城市'); return; }
    if (!cuisineForm.name) { toast.error('菜系名称必填'); return; }
    try {
      const { error } = await supabase.from('cuisine_guides').insert({
        city_id: selectedCityId,
        name: cuisineForm.name.trim(),
        description: cuisineForm.description.trim(),
        characteristics: lineSplit(cuisineForm.characteristics),
        must_try_dishes: lineSplit(cuisineForm.must_try_dishes),
        is_active: cuisineForm.is_active,
      });
      if (error) throw error;
      toast.success('已添加菜系指南');
      setCuisineForm({ name: '', description: '', characteristics: '', must_try_dishes: '', is_active: true });
      const { data } = await supabase.from('cuisine_guides').select('*').eq('city_id', selectedCityId).order('display_order').order('name');
      setCuisines(data || []);
    } catch (e: any) { toast.error('添加失败: ' + e.message); }
  };

  const updateCuisine = async (c: CuisineGuide, patch: Partial<CuisineGuide>) => {
    try {
      const { error } = await supabase.from('cuisine_guides').update(patch).eq('id', c.id);
      if (error) throw error;
      setCuisines(prev => prev.map(it => it.id === c.id ? { ...it, ...patch } : it));
    } catch (e: any) { toast.error('更新失败: ' + e.message); }
  };

  const deleteCuisine = async (c: CuisineGuide) => {
    if (!confirm(`确认删除菜系「${c.name}」？`)) return;
    try {
      const { error } = await supabase.from('cuisine_guides').delete().eq('id', c.id);
      if (error) throw error;
      setCuisines(prev => prev.filter(it => it.id !== c.id));
      toast.success('已删除');
    } catch (e: any) { toast.error('删除失败: ' + e.message); }
  };

  // Drag and drop handlers
  const reorderCities = async (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(cities);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setCities(items);
    
    // Update display_order in database
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        display_order: index
      }));
      
      for (const update of updates) {
        await supabase.from('cities').update({ display_order: update.display_order }).eq('id', update.id);
      }
      toast.success('城市排序已更新 ');
    } catch (e: any) {
      toast.error('排序更新失败: ' + e.message);
    }
  };

  const reorderRestaurants = async (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(restaurants);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setRestaurants(items);
    
    // Update display_order in database
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        display_order: index
      }));
      
      for (const update of updates) {
        await supabase.from('restaurants').update({ display_order: update.display_order }).eq('id', update.id);
      }
      toast.success('餐厅排序已更新');
    } catch (e: any) {
      toast.error('排序更新失败: ' + e.message);
    }
  };

  const reorderCuisines = async (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(cuisines);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setCuisines(items);
    
    // Update display_order in database
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        display_order: index
      }));
      
      for (const update of updates) {
        await supabase.from('cuisine_guides').update({ display_order: update.display_order }).eq('id', update.id);
      }
      toast.success('菜系排序已更新');
    } catch (e: any) {
      toast.error('排序更新失败: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* City selector */}
      <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary"/>城市与餐厅管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-center flex-wrap">
            <Select value={selectedCityId} onValueChange={setSelectedCityId}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="选择城市"/></SelectTrigger>
              <SelectContent>
                {cities.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} {c.is_active ? '' : '(停用)'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCity && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>热门区域：</span>
                <div className="flex gap-2 flex-wrap">
                  {selectedCity.popular_areas.map(a => (<Badge key={a} variant="secondary">{a}</Badge>))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="restaurants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="restaurants">餐厅</TabsTrigger>
          <TabsTrigger value="cuisines">菜系指南</TabsTrigger>
          <TabsTrigger value="cities">城市</TabsTrigger>
        </TabsList>

        {/* Restaurants */}
        <TabsContent value="restaurants" className="space-y-4">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5 text-primary"/>添加餐厅</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <Input placeholder="餐厅名称*" value={restaurantForm.name} onChange={e => setRestaurantForm(s => ({...s, name: e.target.value}))} />
              <Input placeholder="菜系* (如: 川菜)" value={restaurantForm.cuisine} onChange={e => setRestaurantForm(s => ({...s, cuisine: e.target.value}))} />
              <Input placeholder="区域* (如: 三里屯)" value={restaurantForm.area} onChange={e => setRestaurantForm(s => ({...s, area: e.target.value}))} />
              <Input placeholder="价格区间* (如: ￥80-120/人)" value={restaurantForm.price_range} onChange={e => setRestaurantForm(s => ({...s, price_range: e.target.value}))} />
              <Input type="number" step="0.1" min="1" max="5" placeholder="评分(1-5)" value={restaurantForm.rating} onChange={e => setRestaurantForm(s => ({...s, rating: parseFloat(e.target.value)}))} />
              <Input placeholder="最佳时间 (如: 晚餐)" value={restaurantForm.best_time} onChange={e => setRestaurantForm(s => ({...s, best_time: e.target.value}))} />
              <Input placeholder="适合人数 (如: 2-6人)" value={restaurantForm.group_size} onChange={e => setRestaurantForm(s => ({...s, group_size: e.target.value}))} />
              <Input placeholder="招牌菜(逗号分隔)" value={restaurantForm.special_dishes} onChange={e => setRestaurantForm(s => ({...s, special_dishes: e.target.value}))} />
              <Textarea className="md:col-span-2" placeholder="餐厅描述" value={restaurantForm.description} onChange={e => setRestaurantForm(s => ({...s, description: e.target.value}))} />
              <div className="flex items-center gap-4 md:col-span-2">
                <div className="flex items-center gap-2"><Switch checked={restaurantForm.is_featured} onCheckedChange={v => setRestaurantForm(s => ({...s, is_featured: v}))}/><span>设为推荐</span></div>
                <div className="flex items-center gap-2"><Switch checked={restaurantForm.is_active} onCheckedChange={v => setRestaurantForm(s => ({...s, is_active: v}))}/><span>启用</span></div>
                <Button className="ml-auto" onClick={addRestaurant} disabled={!selectedCityId}><Plus className="w-4 h-4 mr-1"/>添加</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>餐厅列表 {selectedCity ? `· ${selectedCity.name}` : ''}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DragDropContext onDragEnd={reorderRestaurants}>
                <Droppable droppableId="restaurants">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {restaurants.map((r, index) => (
                        <Draggable key={r.id} draggableId={r.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`grid md:grid-cols-6 gap-2 items-center border rounded-lg p-3 ${
                                snapshot.isDragging ? 'shadow-lg bg-card/90' : ''
                              }`}
                            >
                              <div className="md:col-span-2 font-medium flex items-center gap-2">
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>
                                {r.name}
                                {r.is_featured && <Badge className="ml-2" variant="secondary"><Star className="w-3 h-3 mr-1"/>推荐</Badge>}
                              </div>
                              <div>{r.cuisine}</div>
                              <div>{r.area}</div>
                              <div className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400"/>{r.rating}</div>
                              <div className="flex items-center gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={() => updateRestaurant(r, { is_featured: !r.is_featured })}>{r.is_featured ? '取消推荐' : '设为推荐'}</Button>
                                <Button variant="outline" size="sm" onClick={() => updateRestaurant(r, { is_active: !r.is_active })}>{r.is_active ? '停用' : '启用'}</Button>
                                <Button variant="destructive" size="sm" onClick={() => deleteRestaurant(r)}><Trash2 className="w-4 h-4"/></Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {restaurants.length === 0 && <div className="text-sm text-muted-foreground">暂无餐厅</div>}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cuisine Guides */}
        <TabsContent value="cuisines" className="space-y-4">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Utensils className="w-5 h-5 text-primary"/>添加菜系指南</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <Input placeholder="菜系名称*" value={cuisineForm.name} onChange={e => setCuisineForm(s => ({...s, name: e.target.value}))} />
              <Input placeholder="特点(逗号/换行分隔)" value={cuisineForm.characteristics} onChange={e => setCuisineForm(s => ({...s, characteristics: e.target.value}))} />
              <Input placeholder="必尝菜(逗号/换行分隔)" value={cuisineForm.must_try_dishes} onChange={e => setCuisineForm(s => ({...s, must_try_dishes: e.target.value}))} />
              <Textarea className="md:col-span-2" placeholder="菜系描述" value={cuisineForm.description} onChange={e => setCuisineForm(s => ({...s, description: e.target.value}))} />
              <div className="flex items-center gap-4 md:col-span-2">
                <div className="flex items-center gap-2"><Switch checked={cuisineForm.is_active} onCheckedChange={v => setCuisineForm(s => ({...s, is_active: v}))}/><span>启用</span></div>
                <Button className="ml-auto" onClick={addCuisine} disabled={!selectedCityId}><Plus className="w-4 h-4 mr-1"/>添加</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>菜系列表 {selectedCity ? `· ${selectedCity.name}` : ''}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DragDropContext onDragEnd={reorderCuisines}>
                <Droppable droppableId="cuisines">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {cuisines.map((c, index) => (
                        <Draggable key={c.id} draggableId={c.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`grid md:grid-cols-5 gap-2 items-center border rounded-lg p-3 ${
                                snapshot.isDragging ? 'shadow-lg bg-card/90' : ''
                              }`}
                            >
                              <div className="font-medium flex items-center gap-2">
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>
                                {c.name}
                              </div>
                              <div className="text-sm text-muted-foreground truncate md:col-span-2">{c.description}</div>
                              <div className="flex items-center gap-2 justify-end md:col-span-2">
                                <Button variant="outline" size="sm" onClick={() => updateCuisine(c, { is_active: !c.is_active })}>{c.is_active ? '停用' : '启用'}</Button>
                                <Button variant="destructive" size="sm" onClick={() => deleteCuisine(c)}><Trash2 className="w-4 h-4"/></Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {cuisines.length === 0 && <div className="text-sm text-muted-foreground">暂无菜系指南</div>}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cities */}
        <TabsContent value="cities" className="space-y-4">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary"/>添加城市</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <Input placeholder="标识* (如: beijing)" value={cityForm.key} onChange={e => setCityForm(s => ({...s, key: e.target.value}))} />
              <Input placeholder="名称* (如: 北京)" value={cityForm.name} onChange={e => setCityForm(s => ({...s, name: e.target.value}))} />
              <Textarea className="md:col-span-2" placeholder="城市描述" value={cityForm.description} onChange={e => setCityForm(s => ({...s, description: e.target.value}))} />
              <Input placeholder="热门菜系(逗号分隔)" value={cityForm.popular_cuisines} onChange={e => setCityForm(s => ({...s, popular_cuisines: e.target.value}))} />
              <Input placeholder="热门区域(逗号分隔)" value={cityForm.popular_areas} onChange={e => setCityForm(s => ({...s, popular_areas: e.target.value}))} />
              <Textarea className="md:col-span-2" placeholder="用餐贴士(逗号/换行分隔)" value={cityForm.dining_tips} onChange={e => setCityForm(s => ({...s, dining_tips: e.target.value}))} />
              <div className="flex items-center gap-4 md:col-span-2">
                <div className="flex items-center gap-2"><Switch checked={cityForm.is_active} onCheckedChange={v => setCityForm(s => ({...s, is_active: v}))}/><span>启用</span></div>
                <Button className="ml-auto" onClick={addCity}><Plus className="w-4 h-4 mr-1"/>添加</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>城市列表</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DragDropContext onDragEnd={reorderCities}>
                <Droppable droppableId="cities">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {cities.map((c, index) => (
                        <Draggable key={c.id} draggableId={c.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`grid md:grid-cols-4 gap-2 items-center border rounded-lg p-3 ${
                                snapshot.isDragging ? 'shadow-lg bg-card/90' : ''
                              }`}
                            >
                              <div className="font-medium flex items-center gap-2">
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>
                                {c.name} <span className="text-xs text-muted-foreground">/{c.key}</span>
                              </div>
                              <div className="text-sm text-muted-foreground truncate md:col-span-2">{c.description}</div>
                              <div className="flex items-center gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={() => toggleCityActive(c, !c.is_active)}>{c.is_active ? '停用' : '启用'}</Button>
                                <Button variant="destructive" size="sm" onClick={() => deleteCity(c)}><Trash2 className="w-4 h-4"/></Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {cities.length === 0 && <div className="text-sm text-muted-foreground">暂无城市</div>}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CityRestaurantManagement;