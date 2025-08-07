import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, MapPin, Users, Heart, Sparkles, Users2, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import CancelDinnerDialog from "@/components/CancelDinnerDialog";
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
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('MyDinners页面认证状态变化:', { event, session });
        
        if (!session?.user) {
          console.log('用户未登录，重定向到auth页面');
          navigate("/auth", { replace: true });
          return;
        }
        
        setUser(session.user);
      }
    );

    const getUser = async () => {
      console.log('MyDinners页面检查用户会话');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('当前会话:', session);
      
      if (!session?.user) {
        console.log('用户未登录，重定向到auth页面');
        navigate("/auth", { replace: true });
        return;
      }
      
      setUser(session.user);
    };

    getUser();

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchMyDinners = async () => {
      if (!user) return;

      // 获取我参与的饭局
      const { data: joinedData, error: joinedError } = await supabase
        .from("dinner_participants")
        .select(`
          dinners!fk_dinner_participants_dinner_id (
            id,
            title,
            description,
            dinner_time,
            location,
            max_participants,
            food_preferences,
            friends_only,
            dinner_mode,
            urgency_level,
            gender_preference,
            personality_tags,
            dietary_restrictions,
            created_by,
            created_at,
            updated_at,
            status
          )
        `)
        .eq("user_id", user.id);

      if (joinedError) {
        console.error("Error fetching joined dinners:", joinedError);
      } else {
        const joinedDinnersData = joinedData?.map(item => (item as any).dinners).filter((dinner: any) => dinner.status === 'active' || !dinner.status) || [];
        setJoinedDinners(joinedDinnersData);
      }

      // 获取我创建的饭局
      const { data: createdData, error: createdError } = await supabase
        .from("dinners")
        .select("*")
        .eq("created_by", user.id)
        .order("dinner_time", { ascending: true });

      if (createdError) {
        console.error("Error fetching created dinners:", createdError);
      } else {
        // 过滤只显示活跃的饭局
        const activeDinners = createdData?.filter(dinner => (dinner as any).status === 'active' || !(dinner as any).status) || [];
        setCreatedDinners(activeDinners);
      }

      // 获取所有饭局的参与者数量
      const allDinnerIds = [
        ...(joinedData?.map(item => (item as any).dinners.id) || []),
        ...(createdData?.map(dinner => dinner.id) || [])
      ];

      if (allDinnerIds.length > 0) {
        const { data: participantData, error: participantError } = await supabase
          .from("dinner_participants")
          .select("dinner_id")
          .in("dinner_id", allDinnerIds);

        if (participantError) {
          console.error("Error fetching participant counts:", participantError);
        } else {
          const counts: Record<string, number> = {};
          participantData?.forEach(participant => {
            counts[participant.dinner_id] = (counts[participant.dinner_id] || 0) + 1;
          });
          setParticipantCounts(counts);
        }
      }

      setLoading(false);
    };

    fetchMyDinners();

    // 设置实时监听参与者变化
    const channel = supabase
      .channel('dinner-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dinner_participants'
        },
        () => {
          // 当有人加入或离开饭局时重新获取数据
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);


  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
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
      case 'instant': return '闪约';
      case 'scheduled': return '预约';
      case 'group': return '团饭';
      default: return '闪约';
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
        const message = result.message || result.f2 || (isCreator ? "饭局已取消" : "已退出饭局");
        const isLate = result.is_late_cancellation || result.f4 || false;

        toast({
          title: isCreator ? "饭局已取消" : "已退出饭局",
          description: message,
          variant: isLate ? "destructive" : "default",
        });

        // 重新获取数据
        window.location.reload();
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
        description: error.message || "取消操作时发生错误",
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
    
    const canCancel = (dinner as any).status === 'active' || !(dinner as any).status;
    
    return (
      <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-card to-accent/5 relative group">
        <div onClick={() => navigate(`/dinner/${dinner.id}`)}>
          {canCancel && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive hover:text-white text-destructive"
              onClick={(e) => handleCancelClick(dinner, e)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                {getModeIcon(dinner.dinner_mode)} {getModeLabel(dinner.dinner_mode)}
              </Badge>
            </div>
            {isCreatedByMe && participantCount > 0 && (
              <Badge className="bg-primary text-black border-primary/30 text-xs font-bold animate-pulse">
                🔥 {participantCount}人已参与
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground">{dinner.title}</CardTitle>
          </div>
          {dinner.description && (
            <CardDescription className="text-muted-foreground">
              {dinner.description.length > 50 
                ? dinner.description.substring(0, 50) + "..."
                : dinner.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/10 p-2 rounded-lg">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span className="font-medium">{formatDateTime(dinner.dinner_time)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/10 p-2 rounded-lg">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium">{dinner.location}</span>
          </div>
          
          <div className={`flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg ${
            participantCount > 0 ? 'bg-primary/20 border border-primary/30' : 'bg-primary/10'
          }`}>
            <Users className="w-4 h-4 text-primary" />
            <span className={`font-bold ${participantCount > 0 ? 'text-primary' : 'text-primary'}`}>
              {participantCount} / {dinner.max_participants} 人
            </span>
            {participantCount >= dinner.max_participants && (
              <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive ml-auto">
                已满员
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
              {dinner.gender_preference === 'same_gender' ? '同性优先' : '异性优先'}
            </Badge>
          )}

          {dinner.friends_only && (
            <Badge variant="outline" className="text-xs border-accent text-accent">
              🔒 仅限熟人
            </Badge>
          )}
        </CardContent>
        </div>
      </Card>
    );
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">我的饭搭子</h1>
          <div className="text-center">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* 简洁的欢迎区域 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center justify-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-primary" />
            我的饭搭子
          </h1>
          <p className="text-muted-foreground text-sm">
            {joinedDinners.length + createdDinners.length > 0 
              ? `你参与了 ${joinedDinners.length} 个饭局，发布了 ${createdDinners.length} 个饭局`
              : "开始你的美食社交之旅吧！"
            }
          </p>
        </div>

        <Tabs defaultValue="joined" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent p-2 rounded-xl gap-2">
            <TabsTrigger value="joined" className="rounded-lg bg-background text-foreground data-[state=active]:bg-accent data-[state=active]:text-black font-bold mx-1 px-4 py-3">
              我参与的饭局
            </TabsTrigger>
            <TabsTrigger value="created" className="rounded-lg bg-background text-foreground data-[state=active]:bg-accent data-[state=active]:text-black font-bold mx-1 px-4 py-3">
              我发布的饭局
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="joined" className="mt-6">
            {joinedDinners.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                  <Heart className="w-12 h-12 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg mb-2">您还没有参与任何饭局</p>
                <p className="text-sm text-muted-foreground mb-4">快去发现志趣相投的饭友吧！</p>
                <Button 
                  onClick={() => navigate("/discover")}
                  className="bg-primary text-black hover:bg-primary/90 hover:text-black font-semibold px-8 py-3 text-base shadow-lg rounded-full"
                  size="default"
                >
                  🔍 发现饭局
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
                <p className="text-muted-foreground text-lg mb-2">您还没有发布任何饭局</p>
                <p className="text-sm text-muted-foreground mb-4">创建饭局，邀请大家一起享受美食时光！</p>
                <Button 
                  onClick={() => navigate("/create-dinner")}
                  className="bg-accent text-black hover:bg-accent/90 hover:text-black font-semibold px-8 py-3 text-base shadow-lg rounded-full"
                  size="default"
                >
                  🍽️ 发布饭局
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