import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, Gift, Calendar, Star, Camera, Trophy, Heart, ImageIcon, MessageCircle, Send, X, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CampaignSharePoster } from "@/components/CampaignSharePoster";

interface Campaign {
  id: string;
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  campaign_type: string;
  rules?: any;
  view_count: number;
  click_count: number;
  participant_count: number;
  created_at: string;
}

interface CampaignPhoto {
  id: string;
  photo_url: string;
  description: string | null;
  created_at: string;
  user_id: string;
  profiles?: { nickname: string; avatar_url: string | null };
  like_count: number;
  user_liked: boolean;
  comment_count: number;
}

interface PhotoComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
}

interface LeaderboardEntry {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  checkin_count: number;
  total_likes: number;
}

export const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Photo wall state
  const [photos, setPhotos] = useState<CampaignPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Upload state
  const [uploading, setUploading] = useState(false);

  // Achievement state
  const [userCheckinCount, setUserCheckinCount] = useState(0);
  const [achievementUnlocked, setAchievementUnlocked] = useState(false);

  // Photo detail dialog state
  const [selectedPhoto, setSelectedPhoto] = useState<CampaignPhoto | null>(null);
  const [comments, setComments] = useState<PhotoComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showSharePoster, setShowSharePoster] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      if (id) loadCampaign(id, user?.id || null);
    };
    init();
  }, [id]);

  const loadCampaign = async (campaignId: string, userId: string | null) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error('活动不存在');
        navigate('/');
        return;
      }

      setCampaign(data);
      setParticipantCount(data.participant_count);

      if (userId) {
        const { data: participation } = await supabase
          .from('campaign_participations')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('user_id', userId)
          .single();
        setHasParticipated(!!participation);
      }

      // Load photos, leaderboard, and user checkin count in parallel
      await Promise.all([
        loadPhotos(campaignId, userId),
        loadLeaderboard(campaignId),
        userId ? loadUserCheckinCount(campaignId, userId) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Failed to load campaign:', error);
      toast.error('加载活动详情失败');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async (campaignId: string, userId: string | null) => {
    setPhotosLoading(true);
    try {
      const { data: photosData, error } = await supabase
        .from('dinner_photos')
        .select('id, photo_url, description, created_at, user_id')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!photosData?.length) { setPhotos([]); return; }

      // Fetch profiles and like counts
      const userIds = [...new Set(photosData.map(p => p.user_id))];
      const photoIds = photosData.map(p => p.id);

      const [profilesRes, likesRes, userLikesRes, commentsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, nickname, avatar_url').in('user_id', userIds),
        supabase.from('photo_likes').select('photo_id').in('photo_id', photoIds),
        userId ? supabase.from('photo_likes').select('photo_id').in('photo_id', photoIds).eq('user_id', userId) : Promise.resolve({ data: [] }),
        supabase.from('photo_comments').select('photo_id').in('photo_id', photoIds),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
      const likeCountMap = new Map<string, number>();
      (likesRes.data || []).forEach(l => likeCountMap.set(l.photo_id, (likeCountMap.get(l.photo_id) || 0) + 1));
      const userLikedSet = new Set((userLikesRes.data || []).map(l => l.photo_id));
      const commentCountMap = new Map<string, number>();
      (commentsRes.data || []).forEach(c => commentCountMap.set(c.photo_id, (commentCountMap.get(c.photo_id) || 0) + 1));

      setPhotos(photosData.map(p => ({
        ...p,
        profiles: profileMap.get(p.user_id) || { nickname: '用户', avatar_url: null },
        like_count: likeCountMap.get(p.id) || 0,
        user_liked: userLikedSet.has(p.id),
        comment_count: commentCountMap.get(p.id) || 0,
      })));
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setPhotosLoading(false);
    }
  };

  const loadLeaderboard = async (campaignId: string) => {
    try {
      // Get checkin counts per user
      const { data: photosData } = await supabase
        .from('dinner_photos')
        .select('user_id')
        .eq('campaign_id', campaignId);

      if (!photosData?.length) { setLeaderboard([]); return; }

      const checkinMap = new Map<string, number>();
      photosData.forEach(p => checkinMap.set(p.user_id, (checkinMap.get(p.user_id) || 0) + 1));

      const userIds = [...checkinMap.keys()];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', userIds);

      // Get total likes per user for this campaign's photos
      const { data: allPhotos } = await supabase
        .from('dinner_photos')
        .select('id, user_id')
        .eq('campaign_id', campaignId);

      const photoIds = (allPhotos || []).map(p => p.id);
      const { data: allLikes } = photoIds.length > 0
        ? await supabase.from('photo_likes').select('photo_id').in('photo_id', photoIds)
        : { data: [] };

      const photoOwnerMap = new Map((allPhotos || []).map(p => [p.id, p.user_id]));
      const userLikesMap = new Map<string, number>();
      (allLikes || []).forEach(l => {
        const owner = photoOwnerMap.get(l.photo_id);
        if (owner) userLikesMap.set(owner, (userLikesMap.get(owner) || 0) + 1);
      });

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const entries: LeaderboardEntry[] = userIds.map(uid => ({
        user_id: uid,
        nickname: profileMap.get(uid)?.nickname || '用户',
        avatar_url: profileMap.get(uid)?.avatar_url || null,
        checkin_count: checkinMap.get(uid) || 0,
        total_likes: userLikesMap.get(uid) || 0,
      }));

      entries.sort((a, b) => b.checkin_count - a.checkin_count || b.total_likes - a.total_likes);
      setLeaderboard(entries.slice(0, 20));
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const loadUserCheckinCount = async (campaignId: string, userId: string) => {
    const { count } = await supabase
      .from('dinner_photos')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('user_id', userId);
    
    const cnt = count || 0;
    setUserCheckinCount(cnt);

    // Check if achievement unlocked
    if (cnt >= 3) {
      const { data: achievement } = await supabase
        .from('achievements')
        .select('id')
        .eq('requirement_type', 'campaign_checkin')
        .single();

      if (achievement) {
        const { data: ua } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_id', achievement.id)
          .single();
        
        if (ua) {
          setAchievementUnlocked(true);
        } else {
          // Unlock achievement
          await supabase.from('user_achievements').insert({
            user_id: userId,
            achievement_id: achievement.id,
          });
          setAchievementUnlocked(true);
          toast.success('🎆 恭喜解锁「跨年饭友」限定成就徽章！');
        }
      }
    }
  };

  const handleParticipate = async () => {
    if (!currentUserId) {
      toast.error('请先登录');
      navigate('/auth');
      return;
    }
    if (!campaign) return;

    const { error } = await supabase
      .from('campaign_participations')
      .insert({
        campaign_id: campaign.id,
        user_id: currentUserId,
        participation_data: { joined_at: new Date().toISOString() }
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('您已经参与过此活动');
      } else {
        toast.error('参与活动失败');
      }
    } else {
      setHasParticipated(true);
      setParticipantCount(c => c + 1);
      toast.success('成功参与活动！');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !campaign || !currentUserId) return;

    if (!hasParticipated) {
      toast.error('请先参与活动再打卡');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('dinner-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dinner-photos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('dinner_photos')
        .insert({
          user_id: currentUserId,
          photo_url: publicUrl,
          campaign_id: campaign.id,
          media_type: 'image',
          description: '活动打卡',
        });

      if (insertError) throw insertError;

      toast.success('打卡成功！获得20积分奖励 🎉');
      
      // Reload data
      await Promise.all([
        loadPhotos(campaign.id, currentUserId),
        loadLeaderboard(campaign.id),
        loadUserCheckinCount(campaign.id, currentUserId),
      ]);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('上传失败，请重试');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const openPhotoDetail = async (photo: CampaignPhoto) => {
    setSelectedPhoto(photo);
    setCommentsLoading(true);
    setComments([]);
    try {
      const { data } = await supabase
        .from('photo_comments')
        .select('id, content, created_at, user_id')
        .eq('photo_id', photo.id)
        .order('created_at', { ascending: true });

      if (data?.length) {
        const uids = [...new Set(data.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nickname, avatar_url')
          .in('user_id', uids);
        const pMap = new Map((profiles || []).map(p => [p.user_id, p]));
        setComments(data.map(c => ({
          ...c,
          nickname: pMap.get(c.user_id)?.nickname || '用户',
          avatar_url: pMap.get(c.user_id)?.avatar_url || null,
        })));
      }
    } catch (e) {
      console.error('Failed to load comments:', e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedPhoto || !currentUserId) {
      if (!currentUserId) toast.error('请先登录');
      return;
    }
    setSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('photo_comments')
        .insert({
          photo_id: selectedPhoto.id,
          user_id: currentUserId,
          content: newComment.trim(),
        })
        .select('id, content, created_at, user_id')
        .single();

      if (error) throw error;

      // Get current user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('user_id', currentUserId)
        .single();

      setComments(prev => [...prev, {
        ...data,
        nickname: profile?.nickname || '用户',
        avatar_url: profile?.avatar_url || null,
      }]);
      setNewComment('');

      // Update comment count in photo list
      setPhotos(prev => prev.map(p => p.id === selectedPhoto.id
        ? { ...p, comment_count: p.comment_count + 1 } : p));
    } catch (e) {
      console.error('Failed to submit comment:', e);
      toast.error('评论失败');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikePhoto = async (photoId: string, liked: boolean) => {
    if (!currentUserId) {
      toast.error('请先登录');
      return;
    }

    if (liked) {
      await supabase.from('photo_likes').delete().eq('photo_id', photoId).eq('user_id', currentUserId);
    } else {
      await supabase.from('photo_likes').insert({ photo_id: photoId, user_id: currentUserId });
    }

    const updater = (p: CampaignPhoto) => p.id === photoId ? {
      ...p,
      user_liked: !liked,
      like_count: liked ? p.like_count - 1 : p.like_count + 1,
    } : p;

    setPhotos(prev => prev.map(updater));
    // Sync selected photo state
    setSelectedPhoto(prev => prev && prev.id === photoId ? updater(prev) : prev);
  };

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'en' ? 'en-US' : 'zh-CN';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getDisplayTitle = () => {
    if (!campaign) return '';
    return i18n.language === 'en' && campaign.title_en ? campaign.title_en : campaign.title;
  };

  const getDisplayDescription = () => {
    if (!campaign) return '';
    return i18n.language === 'en' && campaign.description_en ? campaign.description_en : campaign.description;
  };

  const now = new Date();
  const isNotStarted = campaign ? now < new Date(campaign.start_date) : false;
  const isActive = campaign ?
    now >= new Date(campaign.start_date) && now <= new Date(campaign.end_date) : false;
  const isEnded = campaign ? now > new Date(campaign.end_date) : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4">活动不存在</div>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  const getRankMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <>
      <SEO title={getDisplayTitle()} description={getDisplayDescription()} />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <Button variant="outline" onClick={() => setShowSharePoster(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            {i18n.language === 'zh' ? '分享海报' : 'Share Poster'}
          </Button>
        </div>

        {/* Campaign Header */}
        <Card className="overflow-hidden mb-6">
          <div className="relative h-48 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 flex items-center justify-center">
            <div className="text-6xl">🎆</div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl font-bold">{getDisplayTitle()}</h1>
            </div>
          </div>

          <CardContent className="pt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isActive ? "default" : isNotStarted ? "outline" : "secondary"}>
                {isActive ? '🔥 进行中' : isNotStarted ? '⏳ 即将开始' : '已结束'}
              </Badge>
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />{participantCount} 人参与
              </Badge>
              {achievementUnlocked && (
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                  🎆 跨年饭友
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {formatDate(campaign.start_date)}
              </span>
              <span>至</span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {formatDate(campaign.end_date)}
              </span>
            </div>

            {/* Participation & Checkin */}
            {(isActive || isNotStarted) && (
              <div className="flex gap-3">
                <Button
                  onClick={handleParticipate}
                  disabled={hasParticipated}
                  variant={hasParticipated ? "outline" : "default"}
                  className="flex-1"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  {hasParticipated ? '✅ 已参与' : '参与活动'}
                </Button>
                {hasParticipated && (
                  <div className="relative flex-1">
                    <Button className="w-full" disabled={uploading} asChild>
                      <label htmlFor="campaign-photo-upload" className="cursor-pointer flex items-center justify-center gap-2">
                        <Camera className="h-4 w-4" />
                        {uploading ? '上传中...' : `📸 拍照打卡 (${userCheckinCount}/3)`}
                      </label>
                    </Button>
                    <input
                      id="campaign-photo-upload"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Progress toward achievement */}
            {hasParticipated && userCheckinCount < 3 && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎆</span>
                  <span className="font-medium">距离解锁「跨年饭友」徽章还需打卡 {3 - userCheckinCount} 次</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${(userCheckinCount / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs: Details / Photo Wall / Leaderboard */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">活动详情</TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-1">
              <ImageIcon className="h-4 w-4" />照片墙 ({photos.length})
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />排行榜
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">活动详情</h3>
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                    {getDisplayDescription()}
                  </div>
                </div>

                {campaign.rules && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">活动规则</h3>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 space-y-2">
                        {typeof campaign.rules === 'object' ? (
                          Object.entries(campaign.rules).map(([key, value]) => (
                            <div key={key} className="flex gap-2 text-sm">
                              <span className="font-medium text-primary">{key}:</span>
                              <span className="text-muted-foreground">{String(value)}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">{String(campaign.rules)}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* 积分价值说明 */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">💰 积分说明</h3>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between p-2 rounded-lg bg-background/60">
                          <span>🎯 参与活动</span>
                          <span className="font-bold text-primary">+10</span>
                        </div>
                        <div className="flex justify-between p-2 rounded-lg bg-background/60">
                          <span>📸 打卡上传</span>
                          <span className="font-bold text-primary">+20</span>
                        </div>
                        <div className="flex justify-between p-2 rounded-lg bg-background/60">
                          <span>🏆 排行前三</span>
                          <span className="font-bold text-primary">+500</span>
                        </div>
                        <div className="flex justify-between p-2 rounded-lg bg-background/60">
                          <span>🎖️ 解锁成就</span>
                          <span className="font-bold text-primary">+10~100</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-background/60 rounded-lg p-2.5 space-y-1">
                        <p>💱 兑换比例：50积分 = 1元，可提现或兑换优惠券</p>
                        <p>📍 前往 <span className="text-primary font-medium">增长中心</span> 查看完整积分明细</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photo Wall Tab */}
          <TabsContent value="photos">
            <Card>
              <CardContent className="pt-6">
                {photosLoading ? (
                  <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">还没有人打卡哦，快来做第一个！</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group rounded-lg overflow-hidden border cursor-pointer"
                        onClick={() => openPhotoDetail(photo)}
                      >
                        <img
                          src={photo.photo_url}
                          alt="打卡照片"
                          className="w-full aspect-square object-cover"
                          loading="lazy"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={photo.profiles?.avatar_url || undefined} />
                                <AvatarFallback className="text-[10px]">{photo.profiles?.nickname?.[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-white text-xs truncate max-w-[80px]">{photo.profiles?.nickname}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white text-xs">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleLikePhoto(photo.id, photo.user_liked); }}
                                className="flex items-center gap-0.5"
                              >
                                <Heart className={`h-3.5 w-3.5 ${photo.user_liked ? 'fill-red-500 text-red-500' : ''}`} />
                                {photo.like_count > 0 && photo.like_count}
                              </button>
                              <span className="flex items-center gap-0.5">
                                <MessageCircle className="h-3.5 w-3.5" />
                                {photo.comment_count > 0 && photo.comment_count}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card>
              <CardContent className="pt-6">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">暂无排行数据，快来打卡冲榜！</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          index < 3 ? 'bg-primary/5 border border-primary/10' : 'bg-muted/30'
                        } ${entry.user_id === currentUserId ? 'ring-2 ring-primary/30' : ''}`}
                      >
                        <span className="text-xl w-8 text-center">{getRankMedal(index)}</span>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={entry.avatar_url || undefined} />
                          <AvatarFallback>{entry.nickname[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {entry.nickname}
                            {entry.user_id === currentUserId && <span className="text-primary ml-1">(我)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            打卡 {entry.checkin_count} 次 · 获赞 {entry.total_likes}
                          </p>
                        </div>
                        {index < 3 && (
                          <Badge variant="outline" className="text-xs">
                            +500积分
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Photo Detail Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          {selectedPhoto && (
            <div className="flex flex-col max-h-[85vh]">
              {/* Photo */}
              <div className="relative">
                <img
                  src={selectedPhoto.photo_url}
                  alt="打卡照片"
                  className="w-full max-h-[40vh] object-contain bg-muted"
                />
              </div>

              {/* Author & Actions */}
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={selectedPhoto.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{selectedPhoto.profiles?.nickname?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{selectedPhoto.profiles?.nickname}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedPhoto.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLikePhoto(selectedPhoto.id, selectedPhoto.user_liked)}
                    className="flex items-center gap-1 text-sm"
                  >
                    <Heart className={`h-4 w-4 ${selectedPhoto.user_liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                    <span>{selectedPhoto.like_count}</span>
                  </button>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    {selectedPhoto.comment_count}
                  </span>
                </div>
              </div>

              {/* Comments */}
              <ScrollArea className="flex-1 min-h-0 max-h-[30vh]">
                <div className="p-3 space-y-3">
                  {commentsLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">加载评论中...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">暂无评论，快来说点什么吧</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={comment.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">{comment.nickname[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium">{comment.nickname}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                          <p className="text-sm text-foreground break-words">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Comment Input */}
              <div className="flex items-center gap-2 p-3 border-t">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="写一条评论..."
                  className="flex-1 h-9 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitComment()}
                  disabled={submittingComment || !currentUserId}
                />
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submittingComment || !currentUserId}
                  className="h-9 px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Campaign Share Poster */}
      {campaign && (
        <CampaignSharePoster
          campaign={campaign}
          open={showSharePoster}
          onOpenChange={setShowSharePoster}
        />
      )}
    </>
  );
};
