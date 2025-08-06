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
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { User as UserIcon, Heart, Sparkles } from "lucide-react";
import type { User } from '@supabase/supabase-js';

const FOOD_PREFERENCES = ["川菜", "火锅", "粤菜", "日料", "韩餐", "西餐", "素食"];
const MEAL_TIMES = ["早餐", "午饭", "晚饭", "夜宵"];

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        ...formData,
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
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/10">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-t-lg">
            <CardTitle className="text-xl flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              完善个人资料
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-sm font-semibold">昵称 *</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  required
                  className="border-2 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">性别</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger className="border-2 focus:border-primary transition-colors">
                    <SelectValue placeholder="请选择性别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="男">男</SelectItem>
                    <SelectItem value="女">女</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_year" className="text-sm font-semibold">出生年份</Label>
                <Input
                  id="birth_year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.birth_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, birth_year: parseInt(e.target.value) }))}
                  className="border-2 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">饮食偏好</Label>
                <div className="grid grid-cols-2 gap-3">
                  {FOOD_PREFERENCES.map((preference) => (
                    <div key={preference} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/20 transition-colors">
                      <Checkbox
                        id={preference}
                        checked={formData.food_preferences.includes(preference)}
                        onCheckedChange={(checked) => handleFoodPreferenceChange(preference, !!checked)}
                      />
                      <Label htmlFor={preference} className="text-sm cursor-pointer">{preference}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">喜欢吃饭时间</Label>
                <div className="grid grid-cols-2 gap-3">
                  {MEAL_TIMES.map((mealTime) => (
                    <div key={mealTime} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/20 transition-colors">
                      <Checkbox
                        id={mealTime}
                        checked={formData.meal_times.includes(mealTime)}
                        onCheckedChange={(checked) => handleMealTimeChange(mealTime, !!checked)}
                      />
                      <Label htmlFor={mealTime} className="text-sm cursor-pointer">{mealTime}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/10">
                <Switch
                  id="accept_strangers"
                  checked={formData.accept_strangers}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accept_strangers: checked }))}
                />
                <Label htmlFor="accept_strangers" className="text-sm font-medium cursor-pointer">接受陌生人拼饭</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url" className="text-sm font-semibold">头像链接</Label>
                <Input
                  id="avatar_url"
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://example.com/avatar.jpg"
                  className="border-2 focus:border-primary transition-colors"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 shadow-lg hover:shadow-xl" 
                disabled={loading}
              >
                {loading ? "保存中..." : "💾 保存资料"}
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