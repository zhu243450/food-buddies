import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { User as UserIcon, Upload, Camera } from "lucide-react";
import type { User } from '@supabase/supabase-js';

const FOOD_PREFERENCES = ["川菜", "火锅", "粤菜", "日料", "韩餐", "西餐", "素食"];
const MEAL_TIMES = ["早餐", "午饭", "晚饭", "夜宵"];

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nickname: "",
    gender: "",
    birth_year: new Date().getFullYear(),
    food_preferences: [] as string[],
    meal_times: [] as string[],
    accept_strangers: false,
    avatar_url: "",
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

  const handleMealTimeChange = (mealTime: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      meal_times: checked 
        ? [...prev.meal_times, mealTime]
        : prev.meal_times.filter(m => m !== mealTime)
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
        title: "上传成功",
        description: "头像已更新",
      });
    } catch (error: any) {
      toast({
        title: "上传失败",
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
        title: "保存失败",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "保存成功",
        description: "您的资料已更新",
      });
      navigate("/my-dinners");
    }
    
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-secondary/20 p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-card bg-gradient-to-br from-card/95 to-accent/5 backdrop-blur-sm">
          <CardHeader className="bg-gradient-primary text-white rounded-t-xl shadow-glow">
            <CardTitle className="text-xl flex items-center gap-3 font-bold">
              <UserIcon className="w-6 h-6" />
              ✨ 完善个人资料
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="nickname" className="text-base font-bold text-primary">昵称 *</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  required
                  className="h-12 border-2 border-primary/30 focus:border-primary bg-background/50 backdrop-blur-sm rounded-xl shadow-md transition-all"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-bold text-primary">性别</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger className="h-12 border-2 border-primary/30 focus:border-primary bg-background/50 backdrop-blur-sm rounded-xl shadow-md transition-all">
                    <SelectValue placeholder="请选择性别" />
                  </SelectTrigger>
                  <SelectContent className="bg-card/95 backdrop-blur-md border-primary/30 rounded-xl shadow-xl">
                    <SelectItem value="男" className="hover:bg-primary/10 rounded-lg">👨 男</SelectItem>
                    <SelectItem value="女" className="hover:bg-primary/10 rounded-lg">👩 女</SelectItem>
                    <SelectItem value="其他" className="hover:bg-primary/10 rounded-lg">🌈 其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="birth_year" className="text-base font-bold text-primary">出生年份</Label>
                <Input
                  id="birth_year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.birth_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, birth_year: parseInt(e.target.value) }))}
                  className="h-12 border-2 border-primary/30 focus:border-primary bg-background/50 backdrop-blur-sm rounded-xl shadow-md transition-all"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-base font-bold text-primary flex items-center gap-2">
                  🍱 饮食偏好
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {FOOD_PREFERENCES.map((preference) => (
                    <div key={preference} className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-secondary/20 to-accent/10 hover:from-secondary/30 hover:to-accent/20 transition-all duration-300 shadow-md hover:shadow-lg border border-primary/10">
                      <Checkbox
                        id={preference}
                        checked={formData.food_preferences.includes(preference)}
                        onCheckedChange={(checked) => handleFoodPreferenceChange(preference, !!checked)}
                        className="scale-125"
                      />
                      <Label htmlFor={preference} className="text-sm font-semibold cursor-pointer flex-1">{preference}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-bold text-primary flex items-center gap-2">
                  ⏰ 喜欢吃饭时间
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {MEAL_TIMES.map((mealTime) => (
                    <div key={mealTime} className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-secondary/20 to-accent/10 hover:from-secondary/30 hover:to-accent/20 transition-all duration-300 shadow-md hover:shadow-lg border border-primary/10">
                      <Checkbox
                        id={mealTime}
                        checked={formData.meal_times.includes(mealTime)}
                        onCheckedChange={(checked) => handleMealTimeChange(mealTime, !!checked)}
                        className="scale-125"
                      />
                      <Label htmlFor={mealTime} className="text-sm font-semibold cursor-pointer flex-1">{mealTime}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-r from-accent/20 to-primary/10 shadow-lg border border-accent/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤝</span>
                  <div>
                    <Label htmlFor="accept_strangers" className="text-base font-bold cursor-pointer text-primary">接受陌生人拼饭</Label>
                    <p className="text-sm text-muted-foreground">让更多人发现你的精彩</p>
                  </div>
                </div>
                <Switch
                  id="accept_strangers"
                  checked={formData.accept_strangers}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accept_strangers: checked }))}
                  className="scale-125"
                />
              </div>

              <div className="space-y-6">
                <Label className="text-base font-bold text-primary flex items-center gap-2">
                  📸 个人头像
                </Label>
                <div className="flex items-center gap-6 p-6 rounded-xl bg-gradient-to-r from-secondary/20 to-accent/10 shadow-lg border border-primary/10">
                  <Avatar className="w-24 h-24 ring-4 ring-primary/30 ring-offset-4 ring-offset-background shadow-lg">
                    <AvatarImage src={formData.avatar_url} alt="头像预览" />
                    <AvatarFallback className="text-xl font-bold bg-gradient-primary text-white">
                      {formData.nickname ? formData.nickname[0] : <UserIcon className="w-10 h-10" />}
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
                      className="cursor-pointer inline-flex items-center gap-3 px-6 py-3 bg-gradient-secondary text-secondary-foreground rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold shadow-md"
                    >
                      {uploading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          上传中...
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5" />
                          选择头像
                        </>
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                      支持 JPG、PNG 格式，建议尺寸 400x400px
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="accent"
                size="lg"
                className="w-full text-xl font-bold shadow-glow hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-md bg-accent text-black hover:bg-accent/90 hover:text-black" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    保存中...
                  </>
                ) : (
                  <>💾 保存资料</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Navigation />
    </div>
  );
};

export default Profile;