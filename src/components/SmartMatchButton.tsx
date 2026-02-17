import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Dice5, Clock, MapPin, Loader2, X, ChefHat, Shuffle, Users, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";

const CUISINE_OPTIONS = [
  { label: '火锅', emoji: '🍲', color: 'from-red-500 to-orange-400' },
  { label: '川菜', emoji: '🌶️', color: 'from-red-600 to-red-400' },
  { label: '日料', emoji: '🍣', color: 'from-pink-400 to-rose-300' },
  { label: '韩餐', emoji: '🍜', color: 'from-orange-500 to-yellow-400' },
  { label: '西餐', emoji: '🥩', color: 'from-amber-600 to-amber-400' },
  { label: '粤菜', emoji: '🦐', color: 'from-yellow-500 to-lime-400' },
  { label: '烧烤', emoji: '🍢', color: 'from-orange-600 to-red-400' },
  { label: '奶茶甜品', emoji: '🧋', color: 'from-purple-400 to-pink-300' },
  { label: '面食', emoji: '🍝', color: 'from-yellow-600 to-orange-400' },
  { label: '随便吃啥', emoji: '🎲', color: 'from-blue-500 to-cyan-400' },
];

interface RandomDinner {
  id: string;
  title: string;
  location: string;
  dinner_time: string;
  max_participants: number;
  description: string | null;
  food_preferences: string[] | null;
  created_by: string;
}

export const SmartMatchButton = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('instant');

  // Instant match states
  const [isMatching, setIsMatching] = useState(false);
  const [matchAnimation, setMatchAnimation] = useState(false);
  const [matchedDinner, setMatchedDinner] = useState<RandomDinner | null>(null);
  const [instantDone, setInstantDone] = useState(false);

  // Cuisine queue states
  const [step, setStep] = useState<'select' | 'spinning' | 'waiting' | 'matched'>('select');
  const [selectedCuisine, setSelectedCuisine] = useState<typeof CUISINE_OPTIONS[0] | null>(null);
  const [location, setLocation] = useState('');
  const [matchResult, setMatchResult] = useState<any>(null);
  const [waitingQueueId, setWaitingQueueId] = useState<string | null>(null);
  const [spinIndex, setSpinIndex] = useState(0);
  const [countdown, setCountdown] = useState(30 * 60);

  // Spin animation for cuisine
  useEffect(() => {
    if (step !== 'spinning') return;
    const interval = setInterval(() => {
      setSpinIndex(prev => (prev + 1) % CUISINE_OPTIONS.length);
    }, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!selectedCuisine) {
        const random = CUISINE_OPTIONS[Math.floor(Math.random() * CUISINE_OPTIONS.length)];
        setSelectedCuisine(random);
      }
    }, 2000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [step, selectedCuisine]);

  // Countdown for waiting
  useEffect(() => {
    if (step !== 'waiting') return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) { clearInterval(interval); handleCancelWaiting(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Poll for match while waiting
  useEffect(() => {
    if (step !== 'waiting' || !waitingQueueId || !user) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('random_match_queue')
        .select('status, matched_dinner_id, cuisine_type')
        .eq('id', waitingQueueId)
        .single();
      if (data?.status === 'matched' && data.matched_dinner_id) {
        setMatchResult({ dinner_id: data.matched_dinner_id, cuisine: data.cuisine_type });
        setStep('matched');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, waitingQueueId, user]);

  const handleOpen = () => {
    if (!user) {
      toast({ title: t('common.pleaseLogin'), variant: 'destructive' });
      navigate('/auth');
      return;
    }
    setShowDialog(true);
    setInstantDone(false);
    setMatchedDinner(null);
    setMatchAnimation(false);
    setIsMatching(false);
    setStep('select');
    setSelectedCuisine(null);
    setMatchResult(null);
    setCountdown(30 * 60);
    setActiveTab('instant');
  };

  // Instant match logic
  const handleInstantMatch = async () => {
    if (!user) return;
    setIsMatching(true);
    setMatchAnimation(true);
    try {
      const now = new Date().toISOString();
      const { data: dinners, error } = await supabase
        .from('dinners')
        .select('id, title, location, dinner_time, max_participants, description, food_preferences, created_by')
        .gte('dinner_time', now)
        .or('status.is.null,status.eq.active')
        .order('dinner_time', { ascending: true })
        .limit(20);
      if (error) throw error;

      if (dinners && dinners.length > 0) {
        const [{ data: participants }, { data: myParticipations }] = await Promise.all([
          supabase
            .from('dinner_participants')
            .select('dinner_id')
            .in('dinner_id', dinners.map(d => d.id)),
          supabase
            .from('dinner_participants')
            .select('dinner_id')
            .eq('user_id', user.id)
            .in('dinner_id', dinners.map(d => d.id))
        ]);
        const counts: Record<string, number> = {};
        participants?.forEach(p => { counts[p.dinner_id] = (counts[p.dinner_id] || 0) + 1; });
        const joinedIds = new Set(myParticipations?.map(p => p.dinner_id) || []);
        const available = dinners.filter(d => 
          (counts[d.id] || 0) + 1 < d.max_participants && 
          !joinedIds.has(d.id) &&
          d.created_by !== user.id
        );

        await new Promise(resolve => setTimeout(resolve, 2000));
        if (available.length > 0) {
          setMatchedDinner(available[Math.floor(Math.random() * available.length)]);
        }
      }
    } catch (error) {
      console.error('Match error:', error);
      toast({ title: t('common.error'), description: '匹配失败，请稍后重试', variant: 'destructive' });
    } finally {
      setIsMatching(false);
      setMatchAnimation(false);
      setInstantDone(true);
    }
  };

  // Cuisine queue logic
  const handleRandomSpin = () => {
    setStep('spinning');
    setTimeout(() => {
      const random = CUISINE_OPTIONS[Math.floor(Math.random() * CUISINE_OPTIONS.length)];
      setSelectedCuisine(random);
      setStep('select');
    }, 2000);
  };

  const handleConfirmMatch = async () => {
    if (!selectedCuisine || !user) return;
    setStep('spinning');
    try {
      const { data, error } = await supabase.rpc('try_random_match', {
        user_id_param: user.id,
        cuisine_type_param: selectedCuisine.label,
        location_param: location || '待定',
      });
      if (error) throw error;
      const result = data as any;
      if (result.status === 'matched') {
        setMatchResult(result);
        setStep('matched');
        toast({ title: '🎉 匹配成功！' });
      } else if (result.status === 'waiting') {
        setWaitingQueueId(result.queue_id);
        setStep('waiting');
      } else if (result.status === 'already_waiting') {
        toast({ title: result.message, variant: 'destructive' });
        setStep('select');
      }
    } catch (err: any) {
      toast({ title: '匹配失败', description: err.message, variant: 'destructive' });
      setStep('select');
    }
  };

  const handleCancelWaiting = async () => {
    if (!user) return;
    try { await supabase.rpc('cancel_random_match', { user_id_param: user.id }); } catch {}
    setStep('select');
    setWaitingQueueId(null);
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {user && (
        <Button
          onClick={handleOpen}
          size="lg"
          className="relative overflow-hidden w-full bg-gradient-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold">智能匹配饭局</span>
            <Dice5 className="w-4 h-4" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
        </Button>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => {
        if (!open && step === 'waiting') handleCancelWaiting();
        setShowDialog(open);
      }} modal={true}>
        <DialogContent 
          className="sm:max-w-md" 
          onPointerDownOutside={(e) => e.preventDefault()} 
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { if (step === 'waiting') e.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              智能匹配饭局
            </DialogTitle>
            <DialogDescription>
              即时推荐现有饭局，或按菜系排队等待有缘人
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="instant" className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                即时推荐
              </TabsTrigger>
              <TabsTrigger value="cuisine" className="flex items-center gap-1.5" disabled={step === 'waiting'}>
                <ChefHat className="w-3.5 h-3.5" />
                菜系匹配
              </TabsTrigger>
            </TabsList>

            {/* Instant Match Tab */}
            <TabsContent value="instant" className="mt-4">
              {!instantDone ? (
                matchAnimation ? (
                  <div className="flex flex-col items-center py-12">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accent animate-spin" />
                      <div className="absolute inset-2 w-16 h-16 rounded-full bg-background flex items-center justify-center">
                        <span className="text-3xl animate-bounce">🍽️</span>
                      </div>
                    </div>
                    <p className="mt-4 text-muted-foreground animate-pulse">正在为你寻找最合适的饭局...</p>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <div className="text-5xl">🎲</div>
                    <p className="text-muted-foreground text-sm">从现有饭局中随机推荐一个适合你的</p>
                    <Button onClick={handleInstantMatch} disabled={isMatching} className="w-full bg-gradient-primary text-primary-foreground">
                      <Shuffle className="w-4 h-4 mr-2" />
                      立即匹配
                    </Button>
                  </div>
                )
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
                        <span>最多 {matchedDinner.max_participants} 人</span>
                      </div>
                    </div>
                    {matchedDinner.food_preferences && matchedDinner.food_preferences.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-4">
                        {matchedDinner.food_preferences.slice(0, 4).map((pref, idx) => pref && (
                          <Badge key={idx} variant="secondary" className="text-xs">{pref}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-6">
                      <Button variant="outline" onClick={() => { setInstantDone(false); setMatchedDinner(null); }} className="flex-1">
                        换一个
                      </Button>
                      <Button onClick={() => { setShowDialog(false); navigate(`/dinner/${matchedDinner.id}`); }} className="flex-1">
                        查看详情
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="text-5xl">😅</div>
                  <p className="text-muted-foreground">当前没有可参加的饭局</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveTab('cuisine')} className="flex-1">
                      <ChefHat className="w-4 h-4 mr-1" />
                      按菜系排队
                    </Button>
                    <Button onClick={() => { setShowDialog(false); navigate("/create-dinner"); }} className="flex-1">
                      自己发起一个
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Cuisine Queue Tab */}
            <TabsContent value="cuisine" className="mt-4">
              {step === 'spinning' && (
                <div className="flex flex-col items-center py-12">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full bg-gradient-primary animate-spin" />
                    <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                      <span className="text-4xl animate-bounce">{CUISINE_OPTIONS[spinIndex].emoji}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-muted-foreground animate-pulse">正在匹配中...</p>
                </div>
              )}

              {step === 'select' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {CUISINE_OPTIONS.map(cuisine => (
                      <button
                        key={cuisine.label}
                        onClick={() => setSelectedCuisine(cuisine)}
                        className={`p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                          selectedCuisine?.label === cuisine.label
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-border/60 hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl">{cuisine.emoji}</span>
                        <p className="text-sm font-medium mt-1">{cuisine.label}</p>
                      </button>
                    ))}
                  </div>

                  <Button variant="outline" onClick={handleRandomSpin} className="w-full">
                    <Dice5 className="w-4 h-4 mr-1" />
                    随机转一个
                  </Button>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> 你在哪里？（选填）
                    </label>
                    <Input placeholder="如：望京、西二旗、天河..." value={location} onChange={e => setLocation(e.target.value)} />
                  </div>

                  <Button onClick={handleConfirmMatch} disabled={!selectedCuisine} className="w-full bg-gradient-primary text-primary-foreground">
                    <ChefHat className="w-4 h-4 mr-2" />
                    {selectedCuisine ? `开始匹配：${selectedCuisine.emoji} ${selectedCuisine.label}` : '先选一个菜系'}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    进入30分钟排队，匹配同菜系的人，成功+10积分 🎯
                  </p>
                </div>
              )}

              {step === 'waiting' && (
                <div className="flex flex-col items-center py-8 space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-primary/30 flex items-center justify-center">
                      <span className="text-3xl">{selectedCuisine?.emoji}</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 animate-pulse flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-medium">正在寻找想吃 <span className="text-primary">{selectedCuisine?.label}</span> 的人</p>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Clock className="w-4 h-4" />
                      <span>剩余等待时间：{formatCountdown(countdown)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">匹配成功后会自动创建饭局并通知你</p>
                  </div>
                  <Button variant="outline" onClick={handleCancelWaiting} className="text-destructive border-destructive/50">
                    <X className="w-4 h-4 mr-1" />
                    取消等待
                  </Button>
                </div>
              )}

              {step === 'matched' && matchResult && (
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
                  <CardContent className="pt-6 text-center space-y-4">
                    <div className="text-5xl">🎉</div>
                    <h3 className="text-xl font-bold">匹配成功！</h3>
                    <p className="text-sm text-muted-foreground">
                      找到了和你一样想吃
                      <Badge variant="secondary" className="mx-1">
                        {selectedCuisine?.emoji} {matchResult.matched_cuisine || selectedCuisine?.label}
                      </Badge>
                      的人
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">🎯 +10积分已到账！</p>
                    <Button onClick={() => { setShowDialog(false); navigate(`/dinner/${matchResult.dinner_id}`); }} className="w-full bg-gradient-primary text-primary-foreground">
                      查看饭局详情
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
};
