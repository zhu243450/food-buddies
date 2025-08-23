import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Calendar, Heart, Utensils, Clock, Camera } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useTranslation } from "react-i18next";
import DinnerPhotoGallery from "@/components/DinnerPhotoGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [userPhotos, setUserPhotos] = useState<any[]>([]);
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
      
      // 获取用户的饭局照片
      const { data: photos, error: photosError } = await supabase
        .from("dinner_photos")
        .select(`
          id,
          photo_url,
          description,
          created_at,
          dinners!dinner_photos_dinner_id_fkey (
            title,
            dinner_time,
            location
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!photosError && photos) {
        setUserPhotos(photos);
      }
      
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
          <p>{t('profile.profileNotFound', '用户资料不存在')}</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            {t('common.back')}
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
          {t('common.back')}
        </Button>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile">{t('profile.profile')}</TabsTrigger>
            <TabsTrigger value="photos">{t('profile.photos')} ({userPhotos.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
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
                    {calculateAge(userProfile.birth_year)} {t('profile.yearsOld', '岁')} ({userProfile.birth_year}{t('profile.bornIn', '年生')})
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
                <Heart className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {userProfile.accept_strangers ? t('profile.acceptStrangers') : t('profile.friendsOnly', '仅与熟人拼饭')}
                </span>
              </div>
            </div>

            {/* 饮食偏好 */}
            {userProfile.food_preferences && userProfile.food_preferences.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-black">{t('profile.foodPreferences')}</h3>
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
                  <h3 className="font-semibold text-black">{t('profile.mealTimes')}</h3>
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
                    {t('profile.joinedOn', '加入时间')}: {new Date(userProfile.created_at).toLocaleDateString(t('common.locale'))}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="photos">
            <Card className="border-0 shadow-xl bg-card">
              <CardHeader className="bg-primary text-black rounded-t-xl p-4">
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <Camera className="w-5 h-5" />
                  {userProfile.nickname} {t('profile.sharedPhotos')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {userPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {userPhotos.map((photo) => (
                      <div key={photo.id} className="space-y-2">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={photo.photo_url} 
                            alt={photo.description || "饭局照片"} 
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          {photo.description && (
                            <p className="text-xs text-foreground">{photo.description}</p>
                          )}
                          {photo.dinners && (
                            <div className="text-xs text-muted-foreground">
                              <p className="font-medium">{photo.dinners.title}</p>
                              <p>{new Date(photo.dinners.dinner_time).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('profile.noPhotosShared')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Navigation />
    </div>
  );
};

export default UserProfile;