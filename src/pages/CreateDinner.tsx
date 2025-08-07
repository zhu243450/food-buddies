import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Zap, Clock, Users2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import type { User } from '@supabase/supabase-js';

const FOOD_PREFERENCES = ["川菜", "火锅", "粤菜", "日料", "韩餐", "西餐", "素食"];
const DIETARY_RESTRICTIONS = ["不吃辣", "不吃肉", "不吃海鲜", "不吃牛肉", "不吃猪肉", "素食主义"];
const PERSONALITY_TAGS = ["健谈", "内向", "活跃", "安静", "幽默", "认真", "随和", "爱聊天"];
const DINNER_MODES = [
  { value: "instant", label: "🔥 闪约模式", desc: "今天就想吃，有空的来" },
  { value: "scheduled", label: "📅 预约模式", desc: "我这个周末有空，一起吃个饭？" },
  { value: "group", label: "👥 团饭模式", desc: "3~5人拼饭，缓解一对一尴尬" }
];
const URGENCY_LEVELS = [
  { value: "urgent", label: "🚨 紧急", desc: "马上就要吃" },
  { value: "normal", label: "⏰ 正常", desc: "按时间进行" },
  { value: "flexible", label: "🌊 灵活", desc: "时间可调整" }
];
const GENDER_PREFERENCES = [
  { value: "no_preference", label: "不限", desc: "无性别偏好" },
  { value: "same_gender", label: "同性优先", desc: "偏好同性饭友" },
  { value: "opposite_gender", label: "异性优先", desc: "偏好异性饭友" }
];

const CreateDinner = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
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

  const handlePersonalityTagChange = (tag: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      personality_tags: checked 
        ? [...prev.personality_tags, tag]
        : prev.personality_tags.filter(t => t !== tag)
    }));
  };

  const handleDietaryRestrictionChange = (restriction: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dietary_restrictions: checked 
        ? [...prev.dietary_restrictions, restriction]
        : prev.dietary_restrictions.filter(r => r !== restriction)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    const { error } = await supabase
      .from("dinners")
      .insert({
        created_by: user.id,
        ...formData,
      });

    if (error) {
      toast({
        title: "发布失败",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "发布成功",
        description: "您的饭局已成功发布",
      });
      navigate("/discover");
    }
    
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/10">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-black rounded-t-lg">
            <CardTitle className="text-xl flex items-center gap-2 text-black">
              <Plus className="w-5 h-5" />
              发布饭局
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 饭局模式选择 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  饭局模式 *
                </Label>
                <RadioGroup 
                  value={formData.dinner_mode} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dinner_mode: value }))}
                  className="grid gap-3"
                >
                  {DINNER_MODES.map((mode) => (
                    <div key={mode.value} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/10 transition-colors">
                      <RadioGroupItem value={mode.value} id={mode.value} />
                      <div className="flex-1">
                        <Label htmlFor={mode.value} className="font-medium cursor-pointer">{mode.label}</Label>
                        <p className="text-sm text-muted-foreground">{mode.desc}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* 紧急程度 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  紧急程度
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
                  性别偏好
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
                <Label htmlFor="title" className="text-sm font-semibold">饭局标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="给你的饭局起个名字"
                  className="border-2 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">饭局描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="描述一下这次饭局的详情..."
                  rows={4}
                  className="border-2 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dinner_time" className="text-sm font-semibold">饭局时间 *</Label>
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
                <Label htmlFor="location" className="text-sm font-semibold">饭局地点 *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                  placeholder="餐厅名称或具体地址"
                  className="border-2 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_participants" className="text-sm font-semibold">人数上限 *</Label>
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
                <Label className="text-sm font-semibold">饮食偏好要求</Label>
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

              {/* 个性标签 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">个性标签</Label>
                <div className="grid grid-cols-2 gap-3">
                  {PERSONALITY_TAGS.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/20 transition-colors">
                      <Checkbox
                        id={`personality-${tag}`}
                        checked={formData.personality_tags.includes(tag)}
                        onCheckedChange={(checked) => handlePersonalityTagChange(tag, !!checked)}
                      />
                      <Label htmlFor={`personality-${tag}`} className="text-sm cursor-pointer">{tag}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 饮食禁忌 */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">饮食禁忌</Label>
                <div className="grid grid-cols-2 gap-3">
                  {DIETARY_RESTRICTIONS.map((restriction) => (
                    <div key={restriction} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/20 transition-colors">
                      <Checkbox
                        id={`dietary-${restriction}`}
                        checked={formData.dietary_restrictions.includes(restriction)}
                        onCheckedChange={(checked) => handleDietaryRestrictionChange(restriction, !!checked)}
                      />
                      <Label htmlFor={`dietary-${restriction}`} className="text-sm cursor-pointer">{restriction}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/10">
                <Switch
                  id="friends_only"
                  checked={formData.friends_only}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, friends_only: checked }))}
                />
                <Label htmlFor="friends_only" className="text-sm font-medium cursor-pointer">只限熟人参与</Label>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-accent text-black hover:bg-accent/90 hover:text-black transition-all duration-300 shadow-lg hover:shadow-xl" 
                disabled={loading}
              >
                {loading ? "发布中..." : "🎉 发布饭局"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Navigation />
    </div>
  );
};

export default CreateDinner;