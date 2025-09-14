import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, MapPin, Clock, Users2, Utensils, X, RotateCcw, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface DinnerFilters {
  genderPreference: string;
  timeRange: string;
  timeOfDay: string[];
  location: string;
  radius: number;
  foodPreferences: string[];
  dietaryRestrictions: string[];
  dinnerMode: string[];
  urgencyLevel: string[];
  maxParticipants: number[];
  showExpired: boolean;
}

interface DinnerFiltersProps {
  filters: DinnerFilters;
  onFiltersChange: (filters: DinnerFilters) => void;
  activeFilterCount: number;
}

// 这些常量将通过翻译函数处理
const getFoodPreferences = (t: any) => [
  t('foodPrefs.sichuan'), t('foodPrefs.hotpot'), t('foodPrefs.cantonese'), 
  t('foodPrefs.japanese'), t('foodPrefs.korean'), t('foodPrefs.western'), t('foodPrefs.vegetarian')
];

const getDietaryRestrictions = (t: any) => [
  t('dietary.noSpicy'), t('dietary.noMeat'), t('dietary.noSeafood'), 
  t('dietary.noBeef'), t('dietary.noPork'), t('dietary.vegetarian')
];

const getDinnerModes = (t: any) => [
  { value: "instant", label: `🔥 ${t('dinner.instant')}` },
  { value: "scheduled", label: `📅 ${t('dinner.scheduled')}` },
  { value: "group", label: `👥 ${t('dinner.group')}` }
];

const getUrgencyLevels = (t: any) => [
  { value: "urgent", label: `🚨 ${t('dinner.urgent')}` },
  { value: "normal", label: `⏰ ${t('dinner.normal')}` },
  { value: "flexible", label: `🌊 ${t('dinner.flexible')}` }
];

export const DinnerFiltersComponent = ({ filters, onFiltersChange, activeFilterCount }: DinnerFiltersProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  const handleFilterChange = (key: keyof DinnerFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleArrayToggle = (key: keyof DinnerFilters, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    onFiltersChange({
      ...filters,
      [key]: newArray
    });
  };

  // 获取动态数据
  const FOOD_PREFERENCES = getFoodPreferences(t);
  const DIETARY_RESTRICTIONS = getDietaryRestrictions(t);
  const DINNER_MODES = getDinnerModes(t);
  const URGENCY_LEVELS = getUrgencyLevels(t);

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
          // 使用 Nominatim API 进行反向地理编码
          const locale = localStorage.getItem('i18nextLng') === 'en' ? 'en-US,en' : 'zh-CN,zh';
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${locale}`
          );
          const data = await response.json();
          
          if (data.display_name) {
            // 提取更简洁的地址信息
            const addressParts = data.display_name.split(',');
            const location = addressParts.slice(0, 3).join(',').trim();
            
            handleFilterChange("location", location);
            toast({
              title: t('location.success'),
              description: t('location.currentLocation', { location }),
            });
          } else {
            throw new Error(t('location.cannotGetLocation'));
          }
        } catch (error) {
          console.error('反向地理编码失败:', error);
          handleFilterChange("location", `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          toast({
            title: t('location.success'),
            description: t('location.coordinatesObtained'),
          });
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error('定位失败:', error);
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
        timeout: 10000,
        maximumAge: 300000 // 5分钟缓存
      }
    );
  };

  const resetFilters = () => {
    onFiltersChange({
      genderPreference: "all",
      timeRange: "all",
      timeOfDay: [],
      location: "",
      radius: 10,
      foodPreferences: [],
      dietaryRestrictions: [],
      dinnerMode: [],
      urgencyLevel: [],
      maxParticipants: [2, 20],
      showExpired: false
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.genderPreference !== "all") count++;
    if (filters.timeRange !== "all") count++;
    if (filters.timeOfDay.length > 0) count++;
    if (filters.location) count++;
    if (filters.foodPreferences.length > 0) count++;
    if (filters.dietaryRestrictions.length > 0) count++;
    if (filters.dinnerMode.length > 0) count++;
    if (filters.urgencyLevel.length > 0) count++;
    if (filters.maxParticipants[0] !== 2 || filters.maxParticipants[1] !== 20) count++;
    if (filters.showExpired) count++;
    return count;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="default" 
          size="lg"
          className="relative bg-gradient-to-r from-primary to-primary-foreground text-primary-foreground hover:from-primary/90 hover:to-primary-foreground/90 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
        >
          <Filter className="w-5 h-5 mr-2" />
          {t('common.filter')}筛选饭局
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs font-bold animate-pulse">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t('common.filter')}
          </SheetTitle>
          <SheetDescription>
            {t('filter.description')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* 性别偏好 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users2 className="w-4 h-4 text-primary" />
                {t('dinner.genderPreference')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={filters.genderPreference} 
                onValueChange={(value) => handleFilterChange("genderPreference", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.genderAll')}</SelectItem>
                  <SelectItem value="same_gender">{t('filter.sameGender')}</SelectItem>
                  <SelectItem value="opposite_gender">{t('filter.oppositeGender')}</SelectItem>
                  <SelectItem value="no_preference">{t('filter.noGenderPref')}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 时间筛选 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {t('filter.timeFilter')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">{t('filter.timeRange')}</Label>
                <Select 
                  value={filters.timeRange} 
                  onValueChange={(value) => handleFilterChange("timeRange", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('filter.timeAll')}</SelectItem>
                    <SelectItem value="today">{t('filter.today')}</SelectItem>
                    <SelectItem value="tomorrow">{t('filter.tomorrow')}</SelectItem>
                    <SelectItem value="this_week">{t('filter.thisWeek')}</SelectItem>
                    <SelectItem value="weekend">{t('filter.weekend')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">{t('filter.timeSlots')}</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "lunch", label: t('filter.lunch') },
                    { value: "dinner", label: t('filter.dinnerTime') },
                    { value: "supper", label: t('filter.supper') }
                  ].map((time) => (
                    <Button
                      key={time.value}
                      variant={filters.timeOfDay.includes(time.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleArrayToggle("timeOfDay", time.value)}
                      className="text-xs"
                    >
                      {time.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 地点筛选 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {t('filter.locationFilter')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location" className="text-sm font-medium">{t('filter.locationKeyword')}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="location"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    placeholder={t('filter.locationPlaceholder')}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={getCurrentLocation}
                    disabled={isLocating}
                    className="shrink-0"
                    title={t('filter.getCurrentLocation')}
                  >
                    <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  {t('filter.searchRadius', { radius: filters.radius })}
                </Label>
                <Slider
                  value={[filters.radius]}
                  onValueChange={([value]) => handleFilterChange("radius", value)}
                  max={50}
                  min={1}
                  step={1}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* 饭局模式 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Utensils className="w-4 h-4 text-primary" />
                {t('dinner.mode')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {DINNER_MODES.map((mode) => (
                  <Button
                    key={mode.value}
                    variant={filters.dinnerMode.includes(mode.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleArrayToggle("dinnerMode", mode.value)}
                    className="text-xs"
                  >
                    {mode.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 紧急程度 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('dinner.urgencyLevel')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {URGENCY_LEVELS.map((level) => (
                  <Button
                    key={level.value}
                    variant={filters.urgencyLevel.includes(level.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleArrayToggle("urgencyLevel", level.value)}
                    className="text-xs"
                  >
                    {level.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 饮食偏好 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('dinner.foodPreferences')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {FOOD_PREFERENCES.map((preference) => (
                  <div key={preference} className="flex items-center space-x-2">
                    <Checkbox
                      id={`filter-food-${preference}`}
                      checked={filters.foodPreferences.includes(preference)}
                      onCheckedChange={() => handleArrayToggle("foodPreferences", preference)}
                    />
                    <Label htmlFor={`filter-food-${preference}`} className="text-sm cursor-pointer">
                      {preference}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 饮食禁忌 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('dinner.dietaryRestrictions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {DIETARY_RESTRICTIONS.map((restriction) => (
                  <div key={restriction} className="flex items-center space-x-2">
                    <Checkbox
                      id={`filter-dietary-${restriction}`}
                      checked={filters.dietaryRestrictions.includes(restriction)}
                      onCheckedChange={() => handleArrayToggle("dietaryRestrictions", restriction)}
                    />
                    <Label htmlFor={`filter-dietary-${restriction}`} className="text-sm cursor-pointer">
                      {restriction}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 人数范围 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('dinner.maxParticipants')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  {t('filter.participantsRange', { min: filters.maxParticipants[0], max: filters.maxParticipants[1] })}
                </Label>
                <Slider
                  value={filters.maxParticipants}
                  onValueChange={(value) => handleFilterChange("maxParticipants", value)}
                  max={20}
                  min={2}
                  step={1}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* 显示过期饭局选项 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-expired"
                  checked={filters.showExpired}
                  onCheckedChange={(checked) => handleFilterChange("showExpired", checked)}
                />
                <Label htmlFor="show-expired" className="text-sm cursor-pointer">
                  {t('filter.showExpired')}
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('common.clear')}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-primary text-black hover:bg-primary/90"
            >
              {t('filter.applyFilters', { count: getActiveFilterCount() })}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DinnerFiltersComponent;