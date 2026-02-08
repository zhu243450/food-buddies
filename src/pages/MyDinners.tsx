import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import CancelDinnerDialog from "@/components/CancelDinnerDialog";
import { OptimizedCampaignBanner } from "@/components/OptimizedCampaignBanner";
import { FastSkeletonCard } from "@/components/FastSkeletonCard";
import { OptimizedMyDinnersCard } from "@/components/OptimizedMyDinnersCard";
import { useOptimizedDinners } from "@/hooks/useOptimizedDinners";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";

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
  const { user } = useAuth();
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

  // 检查用户认证状态
  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate]);

  // 移除不必要的重复useEffect
  useEffect(() => {
    return () => {
      forceReset();
    };
  }, [forceReset]);

  const handleCancelDinner = async (reason?: string) => {
    if (!user || !selectedDinner) return;

    setCancelling(true);

    try {
      const { data, error } = await supabase.rpc('cancel_dinner', {
        dinner_id_param: selectedDinner.id,
        user_id_param: user.id,
        cancellation_reason_param: reason || ''
      });

      if (error) {
        throw error;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('函数返回数据格式错误');
      }

      const result = data[0];

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

  // 优化渲染函数 - 使用稳定的 key 和减少重渲染
  const renderDinnerCard = useCallback((dinner: Dinner, index: number) => (
    <OptimizedMyDinnersCard
      key={`${dinner.id}-${dinner.updated_at}`} // 更稳定的 key
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
                {Array.from({ length: 4 }, (_, i) => (
                  <FastSkeletonCard key={i} />
                ))}
              </div>
            ) : joinedDinners.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {joinedDinners.map((dinner, index) => renderDinnerCard(dinner, index))}
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
                {Array.from({ length: 4 }, (_, i) => (
                  <FastSkeletonCard key={i} />
                ))}
              </div>
            ) : createdDinners.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {createdDinners.map((dinner, index) => renderDinnerCard(dinner, index))}
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