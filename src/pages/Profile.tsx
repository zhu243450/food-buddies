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
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="bg-primary text-black rounded-t-xl p-4">
            <CardTitle className="text-lg flex items-center gap-2 font-bold">
              <UserIcon className="w-5 h-5" />
              个人资料
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
                        上传中...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        更换头像
                      </>
                    )}
                  </Label>
                </div>
              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="nickname" className="text-sm font-medium text-foreground mb-1 block">昵称 *</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                    required
                    className="h-10 border border-border/50 focus:border-primary rounded-lg"
                    placeholder="请输入昵称"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-1 block">性别</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger className="h-10 border border-border/50 focus:border-primary rounded-lg">
                        <SelectValue placeholder="选择性别" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border/50 rounded-lg">
                        <SelectItem value="男">男</SelectItem>
                        <SelectItem value="女">女</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="birth_year" className="text-sm font-medium text-foreground mb-1 block">出生年份</Label>
                    <Input
                      id="birth_year"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.birth_year}
                      onChange={(e) => setFormData(prev => ({ ...prev, birth_year: parseInt(e.target.value) }))}
                      className="h-10 border border-border/50 focus:border-primary rounded-lg"
                      placeholder="1990"
                    />
                  </div>
                </div>
              </div>

              {/* 饮食偏好 */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">饮食偏好</Label>
                <div className="grid grid-cols-3 gap-2">
                  {FOOD_PREFERENCES.map((preference) => (
                    <div key={preference} className="flex items-center space-x-2 p-2 rounded-lg bg-background border border-border/30 hover:border-primary/50 transition-colors">
                      <Checkbox
                        id={preference}
                        checked={formData.food_preferences.includes(preference)}
                        onCheckedChange={(checked) => handleFoodPreferenceChange(preference, !!checked)}
                        className="scale-90"
                      />
                      <Label htmlFor={preference} className="text-xs font-medium cursor-pointer flex-1">{preference}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 喜欢的用餐时间 */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">喜欢的用餐时间</Label>
                <div className="grid grid-cols-2 gap-2">
                  {MEAL_TIMES.map((mealTime) => (
                    <div key={mealTime} className="flex items-center space-x-2 p-2 rounded-lg bg-background border border-border/30 hover:border-primary/50 transition-colors">
                      <Checkbox
                        id={mealTime}
                        checked={formData.meal_times.includes(mealTime)}
                        onCheckedChange={(checked) => handleMealTimeChange(mealTime, !!checked)}
                        className="scale-90"
                      />
                      <Label htmlFor={mealTime} className="text-sm font-medium cursor-pointer flex-1">{mealTime}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 接受陌生人拼饭 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
                <div>
                  <Label htmlFor="accept_strangers" className="text-sm font-medium cursor-pointer text-foreground">接受陌生人拼饭</Label>
                  <p className="text-xs text-muted-foreground">让更多人发现你</p>
                </div>
                <Switch
                  id="accept_strangers"
                  checked={formData.accept_strangers}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accept_strangers: checked }))}
                />
              </div>

              {/* 提交按钮 */}
              <Button 
                type="submit" 
                className="w-full h-11 bg-primary text-black hover:bg-primary/90 hover:text-black font-semibold rounded-lg shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    保存中...
                  </>
                ) : (
                  "保存资料"
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