import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Calendar, Heart, Utensils, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfileData {
  id: string;
  user_id: string;
  nickname: string;
  gender: string;
  birth_year: number;
  food_preferences: string[];
  meal_times: string[];
  accept_strangers: boolean;
  avatar_url: string;
  created_at: string;
}

const UserProfile = () => {
  const { userId } = useParams();
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUser(user);
    };

    getCurrentUser();
  }, [navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId || !currentUser) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        navigate("/my-dinners");
        return;
      }

      setUserProfile(data);
      setLoading(false);
    };

    fetchUserProfile();
  }, [userId, currentUser, navigate]);

  const calculateAge = (birthYear: number) => {
    return new Date().getFullYear() - birthYear;
  };

  if (!currentUser || loading) return null;

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto text-center">
          <p>用户资料不存在</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            返回
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4 hover:bg-accent/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="bg-primary text-black rounded-t-xl p-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-20 h-20 ring-4 ring-white/20">
                <AvatarImage src={userProfile.avatar_url} alt="头像" />
                <AvatarFallback className="text-2xl font-bold bg-white/20 text-black">
                  {userProfile.nickname ? userProfile.nickname[0] : <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl font-bold text-black">{userProfile.nickname}</CardTitle>
              {userProfile.gender && (
                <Badge variant="secondary" className="bg-white/20 text-black border-none">
                  {userProfile.gender}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              {userProfile.birth_year && (
                <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-medium">
                    {calculateAge(userProfile.birth_year)} 岁 ({userProfile.birth_year}年生)
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
                <Heart className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {userProfile.accept_strangers ? "接受陌生人拼饭" : "仅与熟人拼饭"}
                </span>
              </div>
            </div>

            {/* 饮食偏好 */}
            {userProfile.food_preferences && userProfile.food_preferences.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-black">饮食偏好</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userProfile.food_preferences.map((preference) => (
                    <Badge 
                      key={preference} 
                      variant="secondary" 
                      className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30"
                    >
                      {preference}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 用餐时间偏好 */}
            {userProfile.meal_times && userProfile.meal_times.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-black">喜欢的用餐时间</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userProfile.meal_times.map((mealTime) => (
                    <Badge 
                      key={mealTime} 
                      variant="outline" 
                      className="border-accent text-accent"
                    >
                      {mealTime}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 加入时间 */}
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-black">
                加入时间: {new Date(userProfile.created_at).toLocaleDateString("zh-CN")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Navigation />
    </div>
  );
};

export default UserProfile;