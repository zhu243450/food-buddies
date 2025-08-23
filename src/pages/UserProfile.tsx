import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Calendar, Heart, Utensils, Clock, Camera, MessageCircle, Send, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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

interface PhotoLike {
  id: string;
  user_id: string;
  photo_id: string;
}

interface PhotoComment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles: {
    nickname: string;
    avatar_url?: string;
  };
}

const UserProfile = () => {
  const { userId } = useParams();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [userPhotos, setUserPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [likes, setLikes] = useState<{ [photoId: string]: PhotoLike[] }>({});
  const [comments, setComments] = useState<{ [photoId: string]: PhotoComment[] }>({});
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
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
      
      // 获取用户的所有照片（包括个人分享和饭局照片）
      const { data: photos, error: photosError } = await supabase
        .from("dinner_photos")
        .select(`
          id,
          photo_url,
          description,
          created_at,
          dinner_id,
          dinners:dinner_id (
            title,
            dinner_time,
            location
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!photosError && photos) {
        setUserPhotos(photos);
        
        // 获取照片的点赞和评论数据
        if (photos.length > 0) {
          await Promise.all([
            fetchLikes(photos.map(p => p.id)),
            fetchComments(photos.map(p => p.id))
          ]);
        }
      }
      
      setLoading(false);
    };

    fetchUserProfile();
  }, [userId, currentUser, navigate]);

  // 获取点赞数据
  const fetchLikes = async (photoIds: string[]) => {
    if (photoIds.length === 0) return;
    
    const { data, error } = await supabase
      .from('photo_likes')
      .select('*')
      .in('photo_id', photoIds);

    if (!error && data) {
      const likesGrouped = data.reduce((acc, like) => {
        if (!acc[like.photo_id]) acc[like.photo_id] = [];
        acc[like.photo_id].push(like);
        return acc;
      }, {} as { [photoId: string]: PhotoLike[] });
      
      setLikes(likesGrouped);
    }
  };

  // 获取评论数据
  const fetchComments = async (photoIds: string[]) => {
    if (photoIds.length === 0) return;
    
    const { data, error } = await supabase
      .from('photo_comments')
      .select(`
        *,
        profiles!fk_photo_comments_user_id(nickname, avatar_url)
      `)
      .in('photo_id', photoIds)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const commentsGrouped = data.reduce((acc, comment) => {
        if (!acc[comment.photo_id]) acc[comment.photo_id] = [];
        acc[comment.photo_id].push(comment);
        return acc;
      }, {} as { [photoId: string]: PhotoComment[] });
      
      setComments(commentsGrouped);
    }
  };

  // 处理点赞/取消点赞
  const handleLike = async (photoId: string) => {
    if (!currentUser) return;

    const userLike = likes[photoId]?.find(like => like.user_id === currentUser.id);
    
    try {
      if (userLike) {
        // 取消点赞
        const { error } = await supabase
          .from('photo_likes')
          .delete()
          .eq('id', userLike.id);
          
        if (error) throw error;
        
        setLikes(prev => ({
          ...prev,
          [photoId]: prev[photoId]?.filter(like => like.id !== userLike.id) || []
        }));
      } else {
        // 点赞
        const { data, error } = await supabase
          .from('photo_likes')
          .insert({
            photo_id: photoId,
            user_id: currentUser.id
          })
          .select()
          .single();
          
        if (error) throw error;
        
        setLikes(prev => ({
          ...prev,
          [photoId]: [...(prev[photoId] || []), data]
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: t('photoGallery.operationFailed'),
        description: t('photoGallery.likeOperationFailed'),
        variant: "destructive",
      });
    }
  };

  // 提交评论
  const handleSubmitComment = async (photoId: string) => {
    if (!currentUser || !newComment.trim()) return;

    setSubmittingComment(true);
    
    try {
      const { data, error } = await supabase
        .from('photo_comments')
        .insert({
          photo_id: photoId,
          user_id: currentUser.id,
          content: newComment.trim()
        })
        .select(`
          *,
          profiles!fk_photo_comments_user_id(nickname, avatar_url)
        `)
        .single();
        
      if (error) throw error;
      
      setComments(prev => ({
        ...prev,
        [photoId]: [...(prev[photoId] || []), data]
      }));
      
      setNewComment("");
      
      toast({
        title: t('photoGallery.commentSuccess'),
        description: t('photoGallery.commentPublished'),
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: t('photoGallery.commentFailed'),
        description: t('photoGallery.commentFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

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
                    {userPhotos.map((photo) => {
                      const photoLikes = likes[photo.id] || [];
                      const photoComments = comments[photo.id] || [];
                      const isLiked = photoLikes.some(like => like.user_id === currentUser?.id);
                      
                      return (
                        <div key={photo.id} className="space-y-2">
                          <div 
                            className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            <img 
                              src={photo.photo_url} 
                              alt={photo.description || "照片"} 
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-sm">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                                  <span>{photoLikes.length}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4" />
                                  <span>{photoComments.length}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {photo.description && (
                              <p className="text-xs text-foreground">{photo.description}</p>
                            )}
                            {photo.dinners ? (
                              <div className="text-xs text-muted-foreground">
                                <p className="font-medium">{photo.dinners.title}</p>
                                <p>{new Date(photo.dinners.dinner_time).toLocaleDateString()}</p>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                <p>{t('profile.personalPhoto', '个人分享')}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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

      {/* 照片详情弹窗 */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <div className="grid md:grid-cols-2 gap-0">
              {/* 照片区域 */}
              <div className="relative bg-black">
                <img
                  src={selectedPhoto.photo_url}
                  alt={selectedPhoto.description || t('photoGallery.dinnerPhoto')}
                  className="w-full h-full object-contain"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-4 right-4 text-white bg-black/20 hover:bg-black/40"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* 互动区域 */}
              <div className="flex flex-col h-[600px]">
                <DialogHeader className="p-4 border-b flex-shrink-0">
                  <DialogTitle className="text-lg">{t('photoGallery.photoDetails')}</DialogTitle>
                </DialogHeader>

                {/* 照片信息和操作 */}
                <div className="p-4 border-b flex-shrink-0">
                  {selectedPhoto.description && (
                    <p className="text-sm text-muted-foreground mb-3">{selectedPhoto.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`gap-2 ${likes[selectedPhoto.id]?.some(like => like.user_id === currentUser?.id) ? 'text-red-500' : ''}`}
                      onClick={() => handleLike(selectedPhoto.id)}
                    >
                      <Heart className={`w-4 h-4 ${likes[selectedPhoto.id]?.some(like => like.user_id === currentUser?.id) ? 'fill-current' : ''}`} />
                      {likes[selectedPhoto.id]?.length || 0}
                    </Button>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageCircle className="w-4 h-4" />
                      {comments[selectedPhoto.id]?.length || 0} {t('photoGallery.comments')}
                    </div>
                  </div>
                </div>

                {/* 评论区域 */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {comments[selectedPhoto.id]?.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={comment.profiles?.avatar_url} />
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {comment.profiles?.nickname || t('photoGallery.anonymousUser')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleString(t('common.locale'))}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 评论输入 */}
                {currentUser && (
                  <div className="p-4 border-t flex-shrink-0">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder={t('photoGallery.addComment')}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="resize-none text-sm"
                        rows={2}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSubmitComment(selectedPhoto.id)}
                        disabled={!newComment.trim() || submittingComment}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Navigation />
    </div>
  );
};

export default UserProfile;