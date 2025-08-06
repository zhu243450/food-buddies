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
import { useToast } from "@/hooks/use-toast";
import type { User } from '@supabase/supabase-js';

const FOOD_PREFERENCES = ["川菜", "火锅", "粤菜", "日料", "韩餐", "西餐", "素食"];

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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>发布饭局</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">饭局标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="给你的饭局起个名字"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">饭局描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="描述一下这次饭局的详情..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dinner_time">饭局时间 *</Label>
                <Input
                  id="dinner_time"
                  type="datetime-local"
                  value={formData.dinner_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, dinner_time: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">饭局地点 *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                  placeholder="餐厅名称或具体地址"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_participants">人数上限 *</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="2"
                  max="20"
                  value={formData.max_participants}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>饮食偏好要求</Label>
                <div className="grid grid-cols-2 gap-2">
                  {FOOD_PREFERENCES.map((preference) => (
                    <div key={preference} className="flex items-center space-x-2">
                      <Checkbox
                        id={preference}
                        checked={formData.food_preferences.includes(preference)}
                        onCheckedChange={(checked) => handleFoodPreferenceChange(preference, !!checked)}
                      />
                      <Label htmlFor={preference}>{preference}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="friends_only"
                  checked={formData.friends_only}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, friends_only: checked }))}
                />
                <Label htmlFor="friends_only">只限熟人参与</Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "发布中..." : "发布饭局"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateDinner;