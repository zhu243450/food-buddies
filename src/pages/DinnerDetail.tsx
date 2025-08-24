import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, ArrowLeft, Heart, UserCheck, MessageSquare, X, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import CancelDinnerDialog from "@/components/CancelDinnerDialog";
import ShareDinner from "@/components/ShareDinner";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useSEO } from "@/hooks/useSEO";
import type { User } from '@supabase/supabase-js';
import type { Dinner } from '@/types/database';

interface Participant {
  id: string;
  user_id: string;
  joined_at: string;
  profiles: {
    nickname: string;
    avatar_url: string;
  };
}

const DinnerDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  const [user, setUser] = useState<User | null>(null);
  const [dinner, setDinner] = useState<Dinner | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
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

  useEffect(() => {
    const fetchDinnerDetails = async () => {
      if (!id || !user) return;

      // 获取饭局详情
      const { data: dinnerData, error: dinnerError } = await supabase
        .from("dinners")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (dinnerError) {
        console.error("Error fetching dinner:", dinnerError);
        setLoading(false);
        return;
      }

      if (!dinnerData) {
        console.log("Dinner not found");
        setLoading(false);
        return;
      }

      setDinner(dinnerData);

      // 获取参与者列表
      const { data: participantData, error: participantError } = await supabase
        .from("dinner_participants")
        .select("*")
        .eq("dinner_id", id);

      if (participantError) {
        console.error("Error fetching participants:", participantError);
        setParticipants([]);
        setIsParticipant(false);
      } else {
        // 获取所有参与者的用户ID（包括发起人）
        const allUserIds = new Set([dinnerData.created_by]);
        participantData?.forEach(p => allUserIds.add(p.user_id));

        // 批量获取所有用户的资料
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, nickname, avatar_url")
          .in("user_id", Array.from(allUserIds));

        // 创建用户资料映射
        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });

        // 构建参与者列表
        const participantsWithProfiles = [];
        
        // 添加发起人
        const creatorProfile = profilesMap.get(dinnerData.created_by);
        const creatorParticipant = {
          id: `creator-${dinnerData.created_by}`,
          user_id: dinnerData.created_by,
          joined_at: dinnerData.created_at,
          profiles: creatorProfile || { nickname: t('dinnerDetail.creator'), avatar_url: null }
        };
        participantsWithProfiles.push(creatorParticipant);

        // 添加其他参与者（排除发起人重复）
        participantData?.forEach(participant => {
          if (participant.user_id !== dinnerData.created_by) {
            const profile = profilesMap.get(participant.user_id);
            participantsWithProfiles.push({
              ...participant,
              profiles: profile || { nickname: t('dinnerDetail.anonymous'), avatar_url: null }
            });
          }
        });

        setParticipants(participantsWithProfiles);
        setIsParticipant(participantData?.some(p => p.user_id === user.id) || false);
      }

      setLoading(false);
    };

    fetchDinnerDetails();
  }, [id, user, navigate]);

  const handleJoinDinner = async () => {
    if (!user || !dinner) return;

    setJoining(true);

    const { error } = await supabase
      .from("dinner_participants")
      .insert({
        dinner_id: dinner.id,
        user_id: user.id,
      });

    if (error) {
      if (error.code === "23505") { // Unique constraint violation
        toast({
          title: t('dinnerDetail.alreadyJoined'),
          description: t('dinnerDetail.alreadyJoinedDesc'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('dinnerDetail.joinFailed'),
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: t('dinnerDetail.joinSuccess'),
        description: t('dinnerDetail.joinSuccessDesc'),
      });
      setIsParticipant(true);
      // 重新获取参与者列表
      const { data } = await supabase
        .from("dinner_participants")
        .select("*")
        .eq("dinner_id", dinner.id);
      
      // 获取所有参与者的用户ID（包括发起人）
      const allUserIds = new Set([dinner.created_by]);
      data?.forEach(p => allUserIds.add(p.user_id));

      // 批量获取所有用户的资料
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, nickname, avatar_url")
        .in("user_id", Array.from(allUserIds));

      // 创建用户资料映射
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      // 构建参与者列表
      const participantsWithProfiles = [];
      
      // 添加发起人
      const creatorProfile = profilesMap.get(dinner.created_by);
      const creatorParticipant = {
        id: `creator-${dinner.created_by}`,
        user_id: dinner.created_by,
        joined_at: dinner.created_at,
        profiles: creatorProfile || { nickname: t('dinnerDetail.creator'), avatar_url: null }
      };
      participantsWithProfiles.push(creatorParticipant);

      // 添加其他参与者（排除发起人重复）
      data?.forEach(participant => {
        if (participant.user_id !== dinner.created_by) {
          const profile = profilesMap.get(participant.user_id);
          participantsWithProfiles.push({
            ...participant,
            profiles: profile || { nickname: t('dinnerDetail.anonymous'), avatar_url: null }
          });
        }
      });

      setParticipants(participantsWithProfiles);
    }

    setJoining(false);
  };

  const handleCancelDinner = async (reason?: string) => {
    if (!user || !dinner) return;

    setCancelling(true);

    try {
      const { data, error } = await supabase.rpc('cancel_dinner', {
        dinner_id_param: dinner.id,
        user_id_param: user.id,
        cancellation_reason_param: reason
      });

      if (error) throw error;

      const result = data[0];
      if (result.success) {
        toast({
          title: dinner.created_by === user.id ? t('dinnerDetail.cancelled') : t('dinnerDetail.left'),
          description: result.message,
          variant: result.is_late_cancellation ? "destructive" : "default",
        });

        // 如果是创建者取消，或者是参与者退出，都跳转到我的饭局页面
        navigate("/my-dinners");
      } else {
        toast({
          title: t('dinnerDetail.operationFailed'),
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t('dinnerDetail.operationFailed'),
        description: error.message || t('dinnerDetail.cancelError'),
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(t('common.locale'), {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "long",
    });
  };

  if (!user || loading) {
    return (
      <>
        <SEO {...getPageSEO('dinner-detail')} />
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-24">
          <div className="max-w-2xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/discover")}
              className="mb-4 hover:bg-accent/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
            
            {loading ? (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/10">
                <CardContent className="p-8 text-center">
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                    <div className="h-32 bg-muted rounded"></div>
                  </div>
                  <p className="text-muted-foreground mt-4">{t('common.loading')}</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/10">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">{t('common.pleaseLogin')}</p>
                  <Button onClick={() => navigate("/auth")} className="mt-4">
                    {t('common.login')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          <Navigation />
        </div>
      </>
    );
  }

  if (!dinner) {
    return (
      <>
        <SEO {...getPageSEO('dinner-detail')} />
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-2xl mx-auto text-center">
            <p>{t('dinnerDetail.notFound')}</p>
            <Button onClick={() => navigate("/discover")} className="mt-4">
              {t('dinnerDetail.backToDiscover')}
            </Button>
          </div>
        </div>
      </>
    );
  }

  const isFull = participants.length >= dinner.max_participants;
  const canJoin = !isParticipant && !isFull && dinner.created_by !== user.id;
  const seoData = getPageSEO('dinner-detail', dinner);

  return (
    <>
      <SEO {...seoData} />
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/discover")}
          className="mb-4 hover:bg-accent/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/10 relative">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-black rounded-t-lg">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-2xl text-black font-bold flex-1 pr-2">{dinner.title}</CardTitle>
              <ShareDinner 
                dinner={dinner} 
                participantCount={participants.length}
              />
            </div>
            {dinner.description && (
              <CardDescription className="text-black/90 text-base">
                {dinner.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-lg p-3 rounded-lg bg-accent/10">
                <CalendarDays className="w-5 h-5 text-primary" />
                <span className="font-medium">{formatDateTime(dinner.dinner_time)}</span>
              </div>
              
              <div className="flex items-center gap-3 text-lg p-3 rounded-lg bg-accent/10">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">{dinner.location}</span>
              </div>
              
              <div className="flex items-center gap-3 text-lg p-3 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-bold text-primary">{participants.length} / {dinner.max_participants} {t('dinnerDetail.people')}</span>
                {isFull && <Badge variant="secondary" className="bg-destructive/20 text-destructive border-destructive">{t('dinnerDetail.full')}</Badge>}
              </div>
            </div>

            {dinner.food_preferences && dinner.food_preferences.length > 0 && (
              <div className="p-4 rounded-lg bg-accent/10">
                <h3 className="font-semibold mb-3 text-foreground">🍽️ {t('dinnerDetail.foodPreferences')}</h3>
                <div className="flex flex-wrap gap-2">
                  {dinner.food_preferences.map((preference) => (
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

            {dinner.friends_only && (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                <Badge variant="outline" className="border-accent text-accent">
                  🔒 {t('dinnerDetail.friendsOnly')}
                </Badge>
              </div>
            )}

            {/* 总是显示参与者区域，包括发起人 */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
              <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                {t('dinnerDetail.participants')}
              </h3>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div 
                    key={participant.id} 
                    className="flex items-center gap-3 p-3 rounded-lg bg-card shadow-sm border border-accent/20 hover:bg-accent/10 transition-colors cursor-pointer"
                    onClick={() => navigate(`/user/${participant.user_id}`)}
                  >
                    {participant.profiles?.avatar_url ? (
                      <img 
                        src={participant.profiles.avatar_url} 
                        alt={participant.profiles?.nickname}
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold">
                        {participant.profiles?.nickname?.charAt(0) || "?"}
                      </div>
                    )}
                    <span className="font-medium hover:text-primary transition-colors">
                      {participant.profiles?.nickname || t('dinnerDetail.anonymous')}
                    </span>
                    {participant.user_id === dinner.created_by && (
                      <Badge variant="default" className="text-xs bg-gradient-to-r from-primary to-accent">
                        👑 {t('dinnerDetail.creator')}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 动态按钮区域 */}

            {canJoin && (
              <Button 
                onClick={handleJoinDinner} 
                disabled={joining}
                className="w-full h-12 text-lg font-semibold bg-accent text-black hover:bg-accent/90 hover:text-black transition-all duration-300 shadow-lg hover:shadow-xl"
                size="lg"
              >
                {joining ? t('dinnerDetail.joining') : `🎉 ${t('dinnerDetail.joinDinner')}`}
              </Button>
            )}

            {isParticipant && (
              <div className="space-y-3">
                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <div className="flex items-center justify-center gap-2 text-green-700 font-semibold text-lg">
                    <Heart className="w-5 h-5" />
                    {t('dinnerDetail.alreadyParticipating')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => navigate("/chat-list")}
                    className="bg-secondary text-black hover:bg-secondary/90 font-semibold"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t('dinnerDetail.enterChat')}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowCancelDialog(true)}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('dinnerDetail.leaveDinner')}
                  </Button>
                </div>
              </div>
            )}

            {dinner.created_by === user.id && (
              <div className="space-y-3">
                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200">
                  <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-lg">
                    <UserCheck className="w-5 h-5" />
                    {t('dinnerDetail.yourDinner')}
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('dinnerDetail.cancelDinner')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <CancelDinnerDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelDinner}
        dinnerTitle={dinner.title}
        dinnerTime={dinner.dinner_time}
        isCreator={dinner.created_by === user.id}
        loading={cancelling}
      />
      
      <Navigation />
    </div>
    </>
  );
};

export default DinnerDetail;