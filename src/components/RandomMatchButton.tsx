import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Shuffle, Sparkles, MapPin, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RandomDinner {
  id: string;
  title: string;
  location: string;
  dinner_time: string;
  max_participants: number;
  description: string | null;
  food_preferences: string[] | null;
}

export const RandomMatchButton = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMatching, setIsMatching] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [matchedDinner, setMatchedDinner] = useState<RandomDinner | null>(null);
  const [matchAnimation, setMatchAnimation] = useState(false);

  const handleRandomMatch = async () => {
    if (!user) {
      toast({
        title: t('common.pleaseLogin'),
        description: t('randomMatch.loginRequired', '登录后即可使用随机匹配'),
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    setIsMatching(true);
    setMatchAnimation(true);
    setShowResult(true);

    try {
      // 获取今天及以后的活跃饭局
      const now = new Date().toISOString();
      const { data: dinners, error } = await supabase
        .from('dinners')
        .select('id, title, location, dinner_time, max_participants, description, food_preferences')
        .gte('dinner_time', now)
        .or('status.is.null,status.eq.active')
        .neq('created_by', user.id)
        .order('dinner_time', { ascending: true })
        .limit(20);

      if (error) throw error;

      // 过滤掉已满的饭局
      if (dinners && dinners.length > 0) {
        // 获取参与人数
        const { data: participants } = await supabase
          .from('dinner_participants')
          .select('dinner_id')
          .in('dinner_id', dinners.map(d => d.id));

        const participantCounts: Record<string, number> = {};
        participants?.forEach(p => {
          participantCounts[p.dinner_id] = (participantCounts[p.dinner_id] || 0) + 1;
        });

        // 过滤未满的饭局
        const availableDinners = dinners.filter(d => 
          (participantCounts[d.id] || 0) + 1 < d.max_participants
        );

        if (availableDinners.length > 0) {
          // 随机选择一个
          await new Promise(resolve => setTimeout(resolve, 2000)); // 动画延迟
          const randomIndex = Math.floor(Math.random() * availableDinners.length);
          setMatchedDinner(availableDinners[randomIndex]);
        } else {
          setMatchedDinner(null);
        }
      } else {
        setMatchedDinner(null);
      }
    } catch (error) {
      console.error('Random match error:', error);
      toast({
        title: t('common.error'),
        description: t('randomMatch.error', '匹配失败，请稍后重试'),
        variant: "destructive"
      });
      setShowResult(false);
    } finally {
      setIsMatching(false);
      setMatchAnimation(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Button
        onClick={handleRandomMatch}
        disabled={isMatching}
        size="lg"
        className="relative overflow-hidden w-full bg-gradient-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
      >
        <div className={`flex items-center gap-2 ${isMatching ? 'animate-pulse' : ''}`}>
          <Shuffle className={`w-5 h-5 ${isMatching ? 'animate-spin' : ''}`} />
          <span className="font-bold">
            {isMatching 
              ? t('randomMatch.matching', '匹配中...') 
              : t('randomMatch.button', '随机匹配')
            }
          </span>
          <Sparkles className="w-4 h-4" />
        </div>
        
        {/* 背景动画 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
      </Button>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-primary" />
              {t('randomMatch.result', '匹配结果')}
            </DialogTitle>
            <DialogDescription>
              {matchAnimation 
                ? t('randomMatch.searching', '正在为你寻找最合适的饭局...') 
                : matchedDinner 
                  ? t('randomMatch.found', '为你找到了一个绝佳饭局！')
                  : t('randomMatch.notFound', '暂时没有找到合适的饭局')
              }
            </DialogDescription>
          </DialogHeader>

          {matchAnimation ? (
            <div className="flex flex-col items-center py-12">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accent animate-spin" />
                <div className="absolute inset-2 w-16 h-16 rounded-full bg-background flex items-center justify-center">
                  <span className="text-3xl animate-bounce">🍽️</span>
                </div>
              </div>
              <p className="mt-4 text-muted-foreground animate-pulse">
                {t('randomMatch.analyzing', '分析中...')}
              </p>
            </div>
          ) : matchedDinner ? (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">{matchedDinner.title}</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{formatDateTime(matchedDinner.dinner_time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{matchedDinner.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{t('randomMatch.maxPeople', '最多')} {matchedDinner.max_participants} {t('dinnerDetail.people', '人')}</span>
                  </div>
                </div>

                {matchedDinner.food_preferences && matchedDinner.food_preferences.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {matchedDinner.food_preferences.slice(0, 4).map((pref, idx) => pref && (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {pref}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={() => {
                    setShowResult(false);
                    navigate(`/dinner/${matchedDinner.id}`);
                  }}
                  className="w-full mt-6"
                >
                  {t('randomMatch.viewDetails', '查看详情')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">😅</div>
              <p className="text-muted-foreground mb-4">
                {t('randomMatch.noAvailable', '当前没有可参加的饭局')}
              </p>
              <Button 
                onClick={() => {
                  setShowResult(false);
                  navigate("/create-dinner");
                }}
              >
                {t('randomMatch.createOwn', '自己发起一个')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
};
