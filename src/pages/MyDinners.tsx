import { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import CancelDinnerDialog from "@/components/CancelDinnerDialog";
import { OptimizedCampaignBanner } from "@/components/OptimizedCampaignBanner";
import { SkeletonCard } from "@/components/SkeletonCard";
import { OptimizedMyDinnersCard } from "@/components/OptimizedMyDinnersCard";
import { useOptimizedDinners } from "@/hooks/useOptimizedDinners";
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

const MyDinners = memo(() => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedDinner, setSelectedDinner] = useState<Dinner | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 使用优化的hook
  const { joinedDinners, createdDinners, participantCounts, loading, refetch } = useOptimizedDinners(user);
  
  // 强制重置函数
  const forceReset = useCallback(() => {
    setShowCancelDialog(false);
    setSelectedDinner(null);
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
  }, []);

  useEffect(() => {
    // 组件加载时强制重置
    forceReset();
    
    // 清理函数
    return () => {
      forceReset();
    };
  }, [forceReset]);

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
          refetch();
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

  const handleCancelClick = useCallback((dinner: Dinner, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setSelectedDinner(dinner);
    setShowCancelDialog(true);
  }, []);

  const handleCardClick = useCallback((dinnerId: string) => {
    navigate(`/dinner/${dinnerId}`);
  }, [navigate]);

  // 优化渲染函数
  const renderDinnerCard = useCallback((dinner: Dinner) => (
    <OptimizedMyDinnersCard
      key={dinner.id}
      dinner={dinner}
      participantCount={participantCounts[dinner.id] || 0}
      userId={user?.id}
      onCancel={handleCancelClick}
      onClick={() => handleCardClick(dinner.id)}
    />
  ), [participantCounts, user?.id, handleCancelClick, handleCardClick]);

  if (!user) {
    return null; // 重定向处理
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <OptimizedCampaignBanner className="mb-6" />
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              {t('myDinners.title')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('myDinners.subtitle')}
            </p>
          </div>
        </div>

        <Tabs defaultValue="joined" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger 
              value="joined" 
              className="flex items-center gap-2 text-lg font-semibold"
            >
              ❤️ {t('myDinners.joinedDinners')}
              {joinedDinners.length > 0 && (
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center">
                  {joinedDinners.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="created" 
              className="flex items-center gap-2 text-lg font-semibold"
            >
              ✨ {t('myDinners.createdDinners')}
              {createdDinners.length > 0 && (
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center">
                  {createdDinners.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="joined" className="space-y-6">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : joinedDinners.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {joinedDinners.map(renderDinnerCard)}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-2xl font-bold mb-2">{t('myDinners.noJoinedDinners')}</h3>
                <p className="text-muted-foreground mb-6">{t('myDinners.noJoinedDinnersDesc')}</p>
                <button 
                  onClick={() => navigate('/discover')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  {t('myDinners.exploreDinners')}
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="created" className="space-y-6">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : createdDinners.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {createdDinners.map(renderDinnerCard)}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">{t('myDinners.noCreatedDinners')}</h3>
                <p className="text-muted-foreground mb-6">{t('myDinners.noCreatedDinnersDesc')}</p>
                <button 
                  onClick={() => navigate('/create')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  {t('myDinners.createFirstDinner')}
                </button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CancelDinnerDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelDinner}
        loading={cancelling}
        dinnerTitle={selectedDinner?.title || ''}
        dinnerTime={selectedDinner?.dinner_time || ''}
        isCreator={selectedDinner?.created_by === user?.id}
      />
    </div>
  );
});

MyDinners.displayName = 'MyDinners';

export default MyDinners;