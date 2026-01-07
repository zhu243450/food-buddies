import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Zap, Clock, Users2, MapPin, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import MapLocationPicker from "@/components/MapLocationPicker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import { SEO } from "@/components/SEO";
import { useSEO } from "@/hooks/useSEO";
import type { User } from '@supabase/supabase-js';

const CreateDinner = () => {
  const { t, i18n } = useTranslation();
  const { getPageSEO } = useSEO();
  
  const seoData = getPageSEO('create-dinner');
  
  const FOOD_PREFERENCES = [
    { label: t('foodPrefs.sichuan'), value: t('foodPrefs.sichuan') },
    { label: t('foodPrefs.hotpot'), value: t('foodPrefs.hotpot') },
    { label: t('foodPrefs.cantonese'), value: t('foodPrefs.cantonese') },
    { label: t('foodPrefs.japanese'), value: t('foodPrefs.japanese') },
    { label: t('foodPrefs.korean'), value: t('foodPrefs.korean') },
    { label: t('foodPrefs.western'), value: t('foodPrefs.western') },
    { label: t('foodPrefs.vegetarian'), value: t('foodPrefs.vegetarian') }
  ];

  const DIETARY_RESTRICTIONS = [
    { label: t('dietary.noSpicy'), value: t('dietary.noSpicy') },
    { label: t('dietary.noMeat'), value: t('dietary.noMeat') },
    { label: t('dietary.noSeafood'), value: t('dietary.noSeafood') },
    { label: t('dietary.noBeef'), value: t('dietary.noBeef') },
    { label: t('dietary.noPork'), value: t('dietary.noPork') },
    { label: t('dietary.vegetarian'), value: t('dietary.vegetarian') }
  ];

  const PERSONALITY_TAGS = [
    { label: "健谈", value: "健谈" },
    { label: "内向", value: "内向" },
    { label: "活跃", value: "活跃" },
    { label: "安静", value: "安静" },
    { label: "幽默", value: "幽默" },
    { label: "认真", value: "认真" },
    { label: "随和", value: "随和" },
    { label: "爱聊天", value: "爱聊天" }
  ];

  const DINNER_MODES = [
    { value: "instant", label: t('createDinner.modes.instant.label'), desc: t('createDinner.modes.instant.desc') },
    { value: "scheduled", label: t('createDinner.modes.scheduled.label'), desc: t('createDinner.modes.scheduled.desc') },
    { value: "group", label: t('createDinner.modes.group.label'), desc: t('createDinner.modes.group.desc') }
  ];
  
  const URGENCY_LEVELS = [
    { value: "urgent", label: t('createDinner.urgencyLevels.urgent.label'), desc: t('createDinner.urgencyLevels.urgent.desc') },
    { value: "normal", label: t('createDinner.urgencyLevels.normal.label'), desc: t('createDinner.urgencyLevels.normal.desc') },
    { value: "flexible", label: t('createDinner.urgencyLevels.flexible.label'), desc: t('createDinner.urgencyLevels.flexible.desc') }
  ];
  
  const GENDER_PREFERENCES = [
    { value: "no_preference", label: t('createDinner.genderPrefs.no_preference.label'), desc: t('createDinner.genderPrefs.no_preference.desc') },
    { value: "same_gender", label: t('createDinner.genderPrefs.same_gender.label'), desc: t('createDinner.genderPrefs.same_gender.desc') },
    { value: "opposite_gender", label: t('createDinner.genderPrefs.opposite_gender.label'), desc: t('createDinner.genderPrefs.opposite_gender.desc') }
  ];

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [restriction, setRestriction] = useState<{
    can_create_dinner: boolean;
    restriction_reason: string;
    restriction_end_date?: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dinner_time: "",
    location: "",
    max_participants: 2,
    food_preferences: [] as string[],
    friends_only: false,
    dinner_mode: "instant",
    urgency_level: "normal", 
    gender_preference: "no_preference",
    personality_tags: [] as string[],
    dietary_restrictions: [] as string[],
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      
      // 检查用户创建饭局的限制
      try {
        const { data, error } = await supabase.rpc('check_user_cancellation_restrictions', {
          user_id_param: user.id
        });

        if (!error && data && data.length > 0) {
          setRestriction(data[0]);
        }
      } catch (error) {
        console.error("Error checking restrictions:", error);
      }
    };

    getUser();
  }, [navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // 检查是否有创建限制
    if (restriction && !restriction.can_create_dinner) {
      toast({
        title: t('dinner.cannotCreate'),
        description: restriction.restriction_reason,
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    const { error } = await supabase
      .from("dinners")
      .insert({
        created_by: user.id,
        status: 'active', // 设置默认状态
        ...formData,
      });

    if (error) {
      toast({
        title: t('dinner.publishFailed'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('dinner.publishSuccess'),
        description: t('dinner.publishSuccessDesc'),
      });
      navigate("/discover");
    }
    
    setLoading(false);
  };

  const handleLocationSelect = (location: string, coordinates?: { lat: number; lng: number }) => {
    setFormData(prev => ({ ...prev, location }));
    setShowMapPicker(false);
  };

  // 点击位置输入框时，自动定位并回填当前位置（仅在为空时触发）
  const autoFillCurrentLocation = async () => {
    if (formData.location) return;

    if (!navigator.geolocation) {
      toast({
        title: t('location.notSupported'),
        description: t('location.notSupportedDesc'),
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${i18n.language === 'zh' ? 'zh-CN,zh' : 'en'}`
          );
          const data = await response.json();

          let location = '';
          if (data.display_name) {
            const parts = String(data.display_name).split(',');
            location = parts.slice(0, 3).join(',').trim();
          } else {
            location = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }

          setFormData(prev => ({ ...prev, location }));
          toast({
            title: t('location.success'),
            description: t('location.currentLocation', { location }),
          });
        } catch (e) {
          const location = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setFormData(prev => ({ ...prev, location }));
          toast({
            title: t('location.success'),
            description: t('location.coordinatesObtained'),
          });
        }
      },
      (error) => {
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
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };
  if (!user) return null;

  return (
    <>
      <SEO {...seoData} />
      <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/10">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-black rounded-t-lg">
            <CardTitle className="text-xl flex items-center gap-2 text-black">
              <Plus className="w-5 h-5" />
              {t('dinner.create')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {restriction && !restriction.can_create_dinner && (
              <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-center gap-2 text-destructive font-semibold mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  {t('dinner.cannotCreate')}
                </div>
                <p className="text-destructive text-sm">{restriction.restriction_reason}</p>
                {restriction.restriction_end_date && (
                  <p className="text-destructive text-sm mt-1">
                    {t('dinner.restrictionEndTime', { time: new Date(restriction.restriction_end_date).toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'en-US') })}
                  </p>
                )}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 饭局模式选择 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  {t('dinner.mode')} *
                </Label>
                <Select value={formData.dinner_mode} onValueChange={(value) => setFormData(prev => ({ ...prev, dinner_mode: value }))}>
                  <SelectTrigger className="border-2 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DINNER_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        <div>
                          <div className="font-medium">{mode.label}</div>
                          <div className="text-sm text-muted-foreground">{mode.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 紧急程度 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  {t('dinner.urgencyLevel')}
                </Label>
                <Select value={formData.urgency_level} onValueChange={(value) => setFormData(prev => ({ ...prev, urgency_level: value }))}>
                  <SelectTrigger className="border-2 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-sm text-muted-foreground">{level.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 性别偏好 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-primary" />
                  {t('dinner.genderPreference')}
                </Label>
                <Select value={formData.gender_preference} onValueChange={(value) => setFormData(prev => ({ ...prev, gender_preference: value }))}>
                  <SelectTrigger className="border-2 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_PREFERENCES.map((pref) => (
                      <SelectItem key={pref.value} value={pref.value}>
                        <div>
                          <div className="font-medium">{pref.label}</div>
                          <div className="text-sm text-muted-foreground">{pref.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">{t('dinner.title')} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder={t('dinner.titlePlaceholder')}
                  className="border-2 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">{t('dinner.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('dinner.descriptionPlaceholder')}
                  rows={4}
                  className="border-2 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dinner_time" className="text-sm font-semibold">{t('dinner.time')} *</Label>
                <Input
                  id="dinner_time"
                  type="datetime-local"
                  value={formData.dinner_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, dinner_time: e.target.value }))}
                  required
                  className="border-2 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-semibold">{t('dinner.location')} *</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    onClick={autoFillCurrentLocation}
                    required
                    placeholder={t('dinner.locationPlaceholder')}
                    className="border-2 focus:border-primary transition-colors flex-1"
                  />
                  <Dialog open={showMapPicker} onOpenChange={setShowMapPicker}>
                    <DialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        className="shrink-0"
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{t('dinner.selectLocation')}</DialogTitle>
                        <DialogDescription>
                          {t('dinner.selectLocationDesc', '在地图上选择用餐地点')}
                        </DialogDescription>
                      </DialogHeader>
                      <MapLocationPicker 
                        onLocationSelect={handleLocationSelect}
                        initialLocation={formData.location}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_participants" className="text-sm font-semibold">{t('dinner.maxParticipants')} *</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="2"
                  max="20"
                  value={formData.max_participants}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                  required
                  className="border-2 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">{t('dinner.foodPreferences')}</Label>
                <MultiSelect
                  options={FOOD_PREFERENCES}
                  value={formData.food_preferences}
                  onChange={(value) => setFormData(prev => ({ ...prev, food_preferences: value }))}
                  placeholder={t('dinner.selectFoodPreferences')}
                  className="w-full border-2 focus:border-primary"
                />
              </div>

              {/* 个性标签 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">{t('dinner.personalityTags')}</Label>
                <MultiSelect
                  options={PERSONALITY_TAGS}
                  value={formData.personality_tags}
                  onChange={(value) => setFormData(prev => ({ ...prev, personality_tags: value }))}
                  placeholder={t('dinner.selectPersonalityTags')}
                  className="w-full border-2 focus:border-primary"
                />
              </div>

              {/* 饮食禁忌 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">{t('dinner.dietaryRestrictions')}</Label>
                <MultiSelect
                  options={DIETARY_RESTRICTIONS}
                  value={formData.dietary_restrictions}
                  onChange={(value) => setFormData(prev => ({ ...prev, dietary_restrictions: value }))}
                  placeholder={t('dinner.selectDietaryRestrictions')}
                  className="w-full border-2 focus:border-primary"
                />
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/10">
                <Switch
                  id="friends_only"
                  checked={formData.friends_only}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, friends_only: checked }))}
                />
                <Label htmlFor="friends_only" className="text-sm font-medium cursor-pointer">{t('dinner.friendsOnly')}</Label>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading || (restriction && !restriction.can_create_dinner)}
              >
                {loading ? t('dinner.publishing') : 
                 (restriction && !restriction.can_create_dinner) ? t('dinner.cannotCreateNow') : 
                 `🎉 ${t('dinner.create')}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Navigation />
    </div>
    </>
  );
};

export default CreateDinner;