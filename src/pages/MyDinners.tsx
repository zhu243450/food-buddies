import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, MapPin, Users, Heart, Sparkles, Users2, X, Share2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import CancelDinnerDialog from "@/components/CancelDinnerDialog";
import ShareDinner from "@/components/ShareDinner";
import { OptimizedCampaignBanner } from "@/components/OptimizedCampaignBanner";
import { SkeletonCard } from "@/components/SkeletonCard";
import type { User } from '@supabase/supabase-js';

interface Dinner {
  id: string;
  created_by: string;
  title: string;
  description?: string;
  dinner_time: string;
  location: string;
  max_participants: number;
  food_preferences?: string[];
  friends_only?: boolean;
  dinner_mode?: string;
  urgency_level?: string;
  gender_preference?: string;
  personality_tags?: string[];
  dietary_restrictions?: string[];
  created_at: string;
  updated_at: string;
  status?: string;
}

const MyDinners = () => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [joinedDinners, setJoinedDinners] = useState<Dinner[]>([]);
  const [createdDinners, setCreatedDinners] = useState<Dinner[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedDinner, setSelectedDinner] = useState<Dinner | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isComponentMounted = true;
    
    const checkUserSession = async () => {
      try {
        console.log('MyDinners页面检查用户会话');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isComponentMounted) return;
        
        console.log('当前会话状态:', !!session);
        
        if (!session?.user) {
          console.log('用户未登录，重定向到auth页面');
          navigate("/auth", { replace: true });
          return;
        }
        
        setUser(session.user);
      } catch (error) {
        console.error('检查用户会话时出错:', error);
        if (isComponentMounted) {
          navigate("/auth", { replace: true });
        }
      }
    };

    // 监听认证状态变化 - 只关注登出事件
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isComponentMounted) return;
        
        console.log('MyDinners页面认证状态变化:', { event, session: !!session });
        
        if (event === 'SIGNED_OUT' || !session?.user) {
          console.log('用户已登出，重定向到auth页面');
          navigate("/auth", { replace: true });
        } else if (session?.user) {
          setUser(session.user);
        }
      }
    );

    checkUserSession();

    return () => {
      isComponentMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const fetchMyDinners = async () => {
      if (!user) return;

      try {
        // 优化查询 - 单次批量获取，减少请求数量
        const [joinedResponse, createdResponse, participantCountsResponse] = await Promise.all([
          // 获取参与的饭局
          supabase
            .from("dinner_participants")
            .select(`
              dinners!fk_dinner_participants_dinner_id (
                id, title, description, dinner_time, location, max_participants,
                food_preferences, friends_only, dinner_mode, urgency_level,
                gender_preference, personality_tags, dietary_restrictions,
                created_by, created_at, updated_at, status
              )
            `)
            .eq("user_id", user.id),
          
          // 获取创建的饭局  
          supabase
            .from("dinners")
            .select("*")
            .eq("created_by", user.id)
            .order("dinner_time", { ascending: true }),
            
          // 预获取所有参与者数量
          supabase
            .from("dinner_participants")
            .select("dinner_id")
        ]);

        // 处理参与的饭局
        let joinedDinnersData: Dinner[] = [];
        if (!joinedResponse.error && joinedResponse.data) {
          joinedDinnersData = joinedResponse.data
            ?.map(item => (item as any).dinners)
            .filter((dinner: any) => dinner && (dinner.status === 'active' || !dinner.status)) || [];
          setJoinedDinners(joinedDinnersData);
        }

        // 处理创建的饭局
        let createdDinnersData: Dinner[] = [];
        if (!createdResponse.error && createdResponse.data) {
          createdDinnersData = createdResponse.data
            .filter(dinner => (dinner as any).status === 'active' || !(dinner as any).status) || [];
          setCreatedDinners(createdDinnersData);
        }

        // 处理参与者数量
        if (!participantCountsResponse.error && participantCountsResponse.data) {
          const counts: Record<string, number> = {};
          participantCountsResponse.data.forEach(participant => {
            counts[participant.dinner_id] = (counts[participant.dinner_id] || 0) + 1;
          });
          setParticipantCounts(counts);
        }

      } catch (error) {
        console.error("Error fetching dinners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyDinners();

    // 优化实时监听 - 使用防抖避免频繁更新
    let updateTimeout: NodeJS.Timeout;
    const channel = supabase
      .channel('my-dinner-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dinner_participants'
        },
        (payload) => {
          // 防抖更新，避免频繁刷新
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(() => {
            console.log('Participant change detected, refreshing data');
            fetchMyDinners();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(updateTimeout);
      supabase.removeChannel(channel);
    };
  }, [user]);


  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getModeIcon = (mode: string | undefined) => {
    switch (mode) {
      case 'instant': return '🔥';
      case 'scheduled': return '📅';
      case 'group': return '👥';
      default: return '🔥';
    }
  };

  const getModeLabel = (mode: string | undefined) => {
    switch (mode) {
      case 'instant': return t('dinner.instant');
      case 'scheduled': return t('dinner.scheduled');
      case 'group': return t('dinner.group');
      default: return t('dinner.instant');
    }
  };

  const handleCancelDinner = async (reason?: string) => {
    if (!user || !selectedDinner) return;

    setCancelling(true);

    try {
      console.log('Calling cancel_dinner RPC with:', {
        dinner_id_param: selectedDinner.id,
        user_id_param: user.id,
        cancellation_reason_param: reason
      });

      const { data, error } = await supabase.rpc('cancel_dinner', {
        dinner_id_param: selectedDinner.id,
        user_id_param: user.id,
        cancellation_reason_param: reason || ''
      });

      console.log('RPC response:', { data, error });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('函数返回数据格式错误');
      }

      const result = data[0];
      console.log('Result:', result);

      if (result.success || result.f1) { // f1 可能是字段名
        const isCreator = selectedDinner.created_by === user.id;
        const message = result.message || result.f2 || (isCreator ? t('admin.dinnerCancelled') : t('admin.leftDinner'));
        const isLate = result.is_late_cancellation || result.f4 || false;

        toast({
          title: isCreator ? t('admin.dinnerCancelled') : t('admin.leftDinner'),
          description: message,
          variant: isLate ? "destructive" : "default",
        });

        // 重新获取数据，避免页面刷新
        setTimeout(() => {
          const fetchData = async () => {
            if (!user) return;
            try {
              const [joinedResponse, createdResponse] = await Promise.all([
                supabase
                  .from("dinner_participants")
                  .select(`
                    dinners!fk_dinner_participants_dinner_id (
                      id, title, description, dinner_time, location, max_participants,
                      food_preferences, friends_only, dinner_mode, urgency_level,
                      gender_preference, personality_tags, dietary_restrictions,
                      created_by, created_at, updated_at, status
                    )
                  `)
                  .eq("user_id", user.id),
                supabase
                  .from("dinners")
                  .select("*")
                  .eq("created_by", user.id)
                  .order("dinner_time", { ascending: true })
              ]);

              if (!joinedResponse.error) {
                const joinedData = joinedResponse.data?.map(item => (item as any).dinners).filter((dinner: any) => dinner.status === 'active' || !dinner.status) || [];
                setJoinedDinners(joinedData);
              }

              if (!createdResponse.error) {
                const activeDinners = createdResponse.data?.filter(dinner => (dinner as any).status === 'active' || !(dinner as any).status) || [];
                setCreatedDinners(activeDinners);
              }
            } catch (error) {
              console.error('重新获取数据失败:', error);
            }
          };
          fetchData();
        }, 500);
      } else {
        const message = result.message || result.f2 || "操作失败";
        toast({
          title: "操作失败",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Cancel dinner error:', error);
      toast({
        title: "操作失败",
        description: error.message || t('admin.cancelOperationError'),
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
      setShowCancelDialog(false);
      setSelectedDinner(null);
    }
  };

  const handleCancelClick = (dinner: Dinner, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedDinner(dinner);
    setShowCancelDialog(true);
  };

  const DinnerCard = ({ dinner }: { dinner: Dinner }) => {
    const participantCount = participantCounts[dinner.id] || 0;
    const isCreatedByMe = dinner.created_by === user?.id;
    // 总人数 = 参与者数量 + 创建者(1人)
    const totalParticipants = participantCount + 1;
    
    const canCancel = (dinner as any).status === 'active' || !(dinner as any).status;
    
    return (
      <div className="dinner-card-stable cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 shadow-lg bg-gradient-to-br from-card to-accent/5 relative group overflow-hidden rounded-lg"
           style={{ border: 'none' }}>
        <div onClick={() => navigate(`/dinner/${dinner.id}`)}>
          {canCancel && (
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive hover:text-white text-destructive"
                onClick={(e) => handleCancelClick(dinner, e)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        <CardHeader className="pb-3" style={{ minHeight: '120px' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                {getModeIcon(dinner.dinner_mode)} {getModeLabel(dinner.dinner_mode)}
              </Badge>
              {isCreatedByMe && canCancel && (
                <ShareDinner 
                  dinner={dinner} 
                  participantCount={totalParticipants}
                />
              )}
            </div>
            {isCreatedByMe && participantCount > 0 && (
              <Badge className="bg-primary text-black border-primary/30 text-xs font-bold animate-pulse">
                {t('myDinners.participantsJoined', { count: participantCount })}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground line-clamp-2" style={{ minHeight: '56px' }}>
              {dinner.title}
            </CardTitle>
          </div>
          {dinner.description && (
            <CardDescription className="text-muted-foreground line-clamp-2" style={{ minHeight: '40px' }}>
              {dinner.description.length > 50 
                ? dinner.description.substring(0, 50) + "..."
                : dinner.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4" style={{ minHeight: '160px' }}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/10 p-2 rounded-lg">
            <CalendarDays className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium truncate">{formatDateTime(dinner.dinner_time)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/10 p-2 rounded-lg">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium truncate">{dinner.location}</span>
          </div>
          
          <div className={`flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg ${
            participantCount > 0 ? 'bg-primary/20 border border-primary/30' : 'bg-primary/10'
          }`}>
            <Users className="w-4 h-4 text-primary shrink-0" />
            <span className={`font-bold ${participantCount > 0 ? 'text-primary' : 'text-primary'}`}>
              {totalParticipants} / {dinner.max_participants} {t('myDinners.people')}
            </span>
            {totalParticipants >= dinner.max_participants && (
              <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive ml-auto">
                {t('myDinners.fullBadge')}
              </Badge>
            )}
          </div>

          {dinner.food_preferences && dinner.food_preferences.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dinner.food_preferences.map((preference) => (
                <Badge 
                  key={preference} 
                  variant="secondary" 
                  className="text-xs bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30"
                >
                  {preference}
                </Badge>
              ))}
            </div>
          )}

          {dinner.personality_tags && dinner.personality_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {dinner.personality_tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="text-xs bg-accent/10 text-accent border-accent/30"
                >
                  #{tag}
                </Badge>
              ))}
              {dinner.personality_tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{dinner.personality_tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {dinner.gender_preference && dinner.gender_preference !== 'no_preference' && (
            <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
              <Users2 className="w-3 h-3 mr-1" />
              {dinner.gender_preference === 'same_gender' ? t('myDinners.sameGenderPref') : t('myDinners.oppositeGenderPref')}
            </Badge>
          )}

          {dinner.friends_only && (
            <Badge variant="outline" className="text-xs border-accent text-accent">
              {t('myDinners.friendsOnlyBadge')}
            </Badge>
          )}
        </CardContent>
        </div>
      </div>
    );
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <OptimizedCampaignBanner className="mb-6" />
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 bg-muted rounded animate-pulse" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Campaign Banner */}
        <OptimizedCampaignBanner className="mb-6" />
        
        {/* 简洁的欢迎区域 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center justify-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-primary" />
            {t('nav.myDinners')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {joinedDinners.length + createdDinners.length > 0 
              ? t('myDinners.summary', { joined: joinedDinners.length, created: createdDinners.length })
              : t('myDinners.welcomeMsg')
            }
          </p>
        </div>

        <Tabs defaultValue="joined" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent p-2 rounded-xl gap-2">
            <TabsTrigger value="joined" className="rounded-lg bg-background text-foreground data-[state=active]:bg-accent data-[state=active]:text-black font-bold mx-1 px-4 py-3">
              {t('myDinners.joinedTab')}
            </TabsTrigger>
            <TabsTrigger value="created" className="rounded-lg bg-background text-foreground data-[state=active]:bg-accent data-[state=active]:text-black font-bold mx-1 px-4 py-3">
              {t('myDinners.createdTab')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="joined" className="mt-6">
            {joinedDinners.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                  <Heart className="w-12 h-12 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg mb-2">{t('myDinners.noJoinedDinners')}</p>
                <p className="text-sm text-muted-foreground mb-4">{t('myDinners.noJoinedDesc')}</p>
                <Button 
                  onClick={() => navigate("/discover")}
                  className="bg-primary text-black hover:bg-primary/90 hover:text-black font-semibold px-8 py-3 text-base shadow-lg rounded-full"
                  size="default"
                >
                  {t('myDinners.discoverDinners')}
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {joinedDinners.map((dinner) => (
                  <DinnerCard key={dinner.id} dinner={dinner} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="created" className="mt-6">
            {createdDinners.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg mb-2">{t('myDinners.noCreatedDinners')}</p>
                <p className="text-sm text-muted-foreground mb-4">{t('myDinners.noCreatedDesc')}</p>
                <Button 
                  onClick={() => navigate("/create-dinner")}
                  className="bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold px-8 py-3 text-base shadow-lg rounded-full"
                  size="default"
                >
                  {t('myDinners.createFirstDinner')}
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {createdDinners.map((dinner) => (
                  <DinnerCard key={dinner.id} dinner={dinner} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {selectedDinner && (
        <CancelDinnerDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          onConfirm={handleCancelDinner}
          dinnerTitle={selectedDinner.title}
          dinnerTime={selectedDinner.dinner_time}
          isCreator={selectedDinner.created_by === user?.id}
          loading={cancelling}
        />
      )}
      
      <Navigation />
    </div>
  );
};
export default MyDinners;