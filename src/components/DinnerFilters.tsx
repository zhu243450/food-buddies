import { useState, useEffect } from "react";
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
}

interface DinnerFiltersProps {
  filters: DinnerFilters;
  onFiltersChange: (filters: DinnerFilters) => void;
  activeFilterCount: number;
}

const FOOD_PREFERENCES = ["川菜", "火锅", "粤菜", "日料", "韩餐", "西餐", "素食"];
const DIETARY_RESTRICTIONS = ["不吃辣", "不吃肉", "不吃海鲜", "不吃牛肉", "不吃猪肉", "素食主义"];
const DINNER_MODES = [
  { value: "instant", label: "🔥 闪约" },
  { value: "scheduled", label: "📅 预约" },
  { value: "group", label: "👥 团饭" }
];
const URGENCY_LEVELS = [
  { value: "urgent", label: "🚨 紧急" },
  { value: "normal", label: "⏰ 正常" },
  { value: "flexible", label: "🌊 灵活" }
];

export const DinnerFiltersComponent = ({ filters, onFiltersChange, activeFilterCount }: DinnerFiltersProps) => {
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
          // 使用 Nominatim API 进行反向地理编码
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-CN,zh`
          );
          const data = await response.json();
          
          if (data.display_name) {
            // 提取更简洁的地址信息
            const addressParts = data.display_name.split(',');
            const location = addressParts.slice(0, 3).join(',').trim();
            
            handleFilterChange("location", location);
            toast({
              title: "定位成功",
              description: `当前位置：${location}`,
            });
          } else {
            throw new Error("无法获取位置信息");
          }
        } catch (error) {
          console.error('反向地理编码失败:', error);
          handleFilterChange("location", `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          toast({
            title: "定位成功",
            description: "已获取坐标位置",
          });
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error('定位失败:', error);
        let errorMessage = "定位失败";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "用户拒绝了位置访问请求";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "位置信息不可用";
            break;
          case error.TIMEOUT:
            errorMessage = "定位请求超时";
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
      maxParticipants: [2, 20]
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
    return count;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative border-2 border-primary/30 hover:bg-primary/10">
          <Filter className="w-4 h-4 mr-2" />
          筛选饭局
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-black text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            筛选条件
          </SheetTitle>
          <SheetDescription>
            设置筛选条件找到最适合的饭局
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* 性别偏好 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users2 className="w-4 h-4 text-primary" />
                性别偏好
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
                  <SelectItem value="all">不限</SelectItem>
                  <SelectItem value="same_gender">同性优先</SelectItem>
                  <SelectItem value="opposite_gender">异性优先</SelectItem>
                  <SelectItem value="no_preference">无性别偏好者</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 时间筛选 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                时间筛选
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">时间范围</Label>
                <Select 
                  value={filters.timeRange} 
                  onValueChange={(value) => handleFilterChange("timeRange", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">不限</SelectItem>
                    <SelectItem value="today">今天</SelectItem>
                    <SelectItem value="tomorrow">明天</SelectItem>
                    <SelectItem value="this_week">本周</SelectItem>
                    <SelectItem value="weekend">周末</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">时间段</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "lunch", label: "中午 (11:00-14:00)" },
                    { value: "dinner", label: "晚餐 (17:00-21:00)" },
                    { value: "supper", label: "夜宵 (21:00-24:00)" }
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
                地点筛选
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location" className="text-sm font-medium">位置关键词</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="location"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    placeholder="输入地区、商圈或地标"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={getCurrentLocation}
                    disabled={isLocating}
                    className="shrink-0"
                    title="获取当前位置"
                  >
                    <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  搜索半径: {filters.radius}km
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
                饭局模式
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
              <CardTitle className="text-base">紧急程度</CardTitle>
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
              <CardTitle className="text-base">饮食偏好</CardTitle>
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
              <CardTitle className="text-base">饮食禁忌</CardTitle>
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
              <CardTitle className="text-base">人数上限</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  {filters.maxParticipants[0]} - {filters.maxParticipants[1]} 人
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

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-primary text-black hover:bg-primary/90"
            >
              应用筛选 ({getActiveFilterCount()})
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DinnerFiltersComponent;