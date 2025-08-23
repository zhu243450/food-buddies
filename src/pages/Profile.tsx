import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import { User as UserIcon, Camera, Shield, LogOut } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useSEO } from "@/hooks/useSEO";
import DinnerPhotoUploader from "@/components/DinnerPhotoUploader";
import DinnerPhotoGallery from "@/components/DinnerPhotoGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User } from '@supabase/supabase-js';

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myDinners, setMyDinners] = useState<any[]>([]);
  
  const seoData = getPageSEO('profile');
  
  const FOOD_PREFERENCES = [
    t('foodPrefs.sichuan'), t('foodPrefs.hotpot'), t('foodPrefs.cantonese'), 
    t('foodPrefs.japanese'), t('foodPrefs.korean'), t('foodPrefs.western'), t('foodPrefs.vegetarian')
  ];
  const MEAL_TIMES = [
    { key: 'breakfast', label: t('mealTimes.breakfast') },
    { key: 'lunch', label: t('mealTimes.lunch') },
    { key: 'dinner', label: t('mealTimes.dinner') },
    { key: 'lateNight', label: t('mealTimes.lateNight') }
  ];
  
  const GENDER_OPTIONS = [
    { value: t('genderValues.male'), label: t('common.male') },
    { value: t('genderValues.female'), label: t('common.female') },
    { value: t('genderValues.other'), label: t('common.other') }
  ];
  
  const [formData, setFormData] = useState({
    nickname: "",
    gender: "",
    birth_year: new Date().getFullYear(),
    food_preferences: [] as string[],
    meal_times: [] as string[],
    accept_strangers: false,
    avatar_url: "",
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      
      // 获取现有资料
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (profile) {
        setFormData({
          nickname: profile.nickname || "",
          gender: profile.gender || "",
          birth_year: profile.birth_year || new Date().getFullYear(),
          food_preferences: profile.food_preferences || [],
          meal_times: profile.meal_times || [],
          accept_strangers: profile.accept_strangers || false,
          avatar_url: profile.avatar_url || "",
        });
      }

      // 检查是否是管理员
      try {
        const { data: roles } = await supabase.rpc('get_user_roles', { 
          _user_id: user.id 
        });
        setIsAdmin(roles?.some((role: any) => role.role === 'admin') || false);
      } catch (error) {
        console.error('Failed to check admin role:', error);
      }

      // 获取我参与和创建的饭局（用于照片分享）
      const [joinedResult, createdResult] = await Promise.all([
        supabase
          .from("dinner_participants")
          .select(`
            dinners!fk_dinner_participants_dinner_id (
              id, title, dinner_time, location
            )
          `)
          .eq("user_id", user.id),
        supabase
          .from("dinners")
          .select("id, title, dinner_time, location")
          .eq("created_by", user.id)
      ]);

      const allDinners = [
        ...(joinedResult.data?.map((item: any) => item.dinners).filter(Boolean) || []),
        ...(createdResult.data || [])
      ];
      
      setMyDinners(allDinners);
    };

    getUser();
  }, [navigate]);

  const handleFoodPreferenceChange = (preference: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      food_preferences: checked 
        ? [...prev.food_preferences, preference]
        : prev.food_preferences.filter(p => p !== preference)
    }));
  };

  const handleMealTimeChange = (mealTimeKey: string, checked: boolean) => {
    const mealTimeLabel = MEAL_TIMES.find(mt => mt.key === mealTimeKey)?.label || mealTimeKey;
    setFormData(prev => ({
      ...prev,
      meal_times: checked 
        ? [...prev.meal_times, mealTimeLabel]
        : prev.meal_times.filter(m => m !== mealTimeLabel)
    }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      
      toast({
        title: t('profile.uploadSuccess'),
        description: t('profile.avatarUpdated'),
      });
    } catch (error: any) {
      toast({
        title: t('profile.uploadFailed'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        ...formData,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      toast({
        title: t('profile.saveFailed'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('profile.saveSuccess'),
        description: t('profile.profileUpdated'),
      });
      navigate("/my-dinners");
    }
    
    setLoading(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: t('profile.logoutFailed'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  if (!user) return null;

  return (
    <>
      <SEO {...seoData} />
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 p-4 pb-24">
        <div className="max-w-md mx-auto">
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="profile">{t('profile.profile')}</TabsTrigger>
              <TabsTrigger value="photos">{t('profile.myPhotos')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card className="border-0 shadow-xl bg-card">
                <CardHeader className="bg-primary text-black rounded-t-xl p-4">
                  <CardTitle className="text-lg flex items-center gap-2 font-bold">
                    <UserIcon className="w-5 h-5" />
                    {t('profile.profile')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* 头像区域 */}
                <div className="flex items-center gap-4 p-3 bg-accent/5 rounded-lg">
                  <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                    <AvatarImage src={formData.avatar_url} alt="头像" />
                    <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                      {formData.nickname ? formData.nickname[0] : <UserIcon className="w-6 h-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <Label 
                      htmlFor="avatar-upload" 
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-all font-medium text-sm"
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          {t('common.uploading', '上传中...')}
                         </>
                       ) : (
                         <>
                           <Camera className="w-4 h-4" />
                           {t('profile.changeAvatar')}
                         </>
                       )}
                    </Label>
                  </div>
                </div>

                {/* 基本信息 */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="nickname" className="text-sm font-medium text-foreground mb-1 block">{t('profile.nickname')} *</Label>
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                      required
                      className="h-10 border border-border/50 focus:border-primary rounded-lg"
                      placeholder={t('profile.enterNickname')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-1 block">{t('profile.gender')}</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                        <SelectTrigger className="h-10 border border-border/50 focus:border-primary rounded-lg">
                          <SelectValue placeholder={t('profile.selectGender')} />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border/50 rounded-lg">
                          {GENDER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                     <div>
                      <Label htmlFor="birth_year" className="text-sm font-medium text-foreground mb-1 block">{t('profile.birthYear')}</Label>
                      <Input
                        id="birth_year"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={formData.birth_year || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, birth_year: parseInt(e.target.value) || new Date().getFullYear() }))}
                        className="h-10 border border-border/50 focus:border-primary rounded-lg"
                        placeholder="1990"
                      />
                    </div>
                  </div>
                </div>

                {/* 饮食偏好 */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">{t('profile.foodPreferences')}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {FOOD_PREFERENCES.map((preference) => (
                      <div 
                        key={preference} 
                        className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                          formData.food_preferences.includes(preference)
                            ? 'bg-primary text-black border-primary shadow-md'
                            : 'bg-background border-border/30 hover:border-primary/50'
                        }`}
                      >
                        <Checkbox
                          id={preference}
                          checked={formData.food_preferences.includes(preference)}
                          onCheckedChange={(checked) => handleFoodPreferenceChange(preference, !!checked)}
                          className="scale-110"
                        />
                        <Label htmlFor={preference} className="text-xs font-medium cursor-pointer flex-1">{preference}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 喜欢的用餐时间 */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">{t('profile.mealTimes')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {MEAL_TIMES.map((mealTime) => {
                      const isSelected = formData.meal_times.includes(mealTime.label);
                      return (
                        <div 
                          key={mealTime.key} 
                          className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'bg-accent text-black border-accent shadow-md'
                              : 'bg-background border-border/30 hover:border-accent/50'
                          }`}
                        >
                          <Checkbox
                            id={mealTime.key}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleMealTimeChange(mealTime.key, !!checked)}
                            className="scale-110"
                          />
                          <Label htmlFor={mealTime.key} className="text-sm font-medium cursor-pointer flex-1">{mealTime.label}</Label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 接受陌生人拼饭 */}
                <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                  formData.accept_strangers
                    ? 'bg-accent text-black border-accent shadow-md'
                    : 'bg-background border-border/30 hover:border-accent/50'
                }`}>
                  <div>
                    <Label htmlFor="accept_strangers" className="text-sm font-medium cursor-pointer">{t('profile.acceptStrangers')}</Label>
                    <p className="text-xs opacity-80">{t('profile.acceptStrangersDesc')}</p>
                  </div>
                  <Switch
                    id="accept_strangers"
                    checked={formData.accept_strangers}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accept_strangers: checked }))}
                  />
                </div>

                {/* 管理员入口 */}
                {isAdmin && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin')}
                    className="w-full h-11 border-primary/30 text-primary hover:bg-primary/10 font-semibold rounded-lg"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {t('profile.adminPanel')}
                  </Button>
                )}

                {/* 提交按钮 */}
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-primary text-black hover:bg-primary/90 hover:text-black font-semibold rounded-lg shadow-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      {t('profile.saving')}
                    </>
                  ) : (
                    t('profile.saveProfile')
                  )}
                </Button>

                {/* 登出按钮 */}
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full h-11 border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold rounded-lg"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('profile.logout')}
                </Button>

                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="photos">
              <Card className="border-0 shadow-xl bg-card">
                <CardHeader className="bg-primary text-black rounded-t-xl p-4">
                  <CardTitle className="text-lg flex items-center gap-2 font-bold">
                    <Camera className="w-5 h-5" />
                    {t('profile.myPhotos')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-6">
                  {myDinners.length > 0 ? (
                    myDinners.map((dinner) => (
                      <div key={dinner.id} className="space-y-4">
                        <div className="p-3 bg-accent/10 rounded-lg border-l-4 border-primary">
                          <h3 className="font-semibold text-sm">{dinner.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(dinner.dinner_time).toLocaleDateString()} · {dinner.location}
                          </p>
                        </div>
                        
                        {/* 照片画廊 */}
                        <DinnerPhotoGallery dinnerId={dinner.id} />
                        
                        {/* 照片上传 */}
                        <DinnerPhotoUploader 
                          dinnerId={dinner.id}
                          onUploadSuccess={() => {
                            // 可以添加刷新逻辑
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">{t('profile.noPhotosYet')}</p>
                      <p className="text-sm text-muted-foreground mt-2">{t('profile.joinDinnersToShare')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <Navigation />
      </div>
    </>
  );
};

export default Profile;