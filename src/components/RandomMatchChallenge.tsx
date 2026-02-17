import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, Dice5, Clock, MapPin, Loader2, X, ChefHat } from "lucide-react";
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

export const RandomMatchChallenge = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState<'select' | 'spinning' | 'waiting' | 'matched'>('select');
  const [selectedCuisine, setSelectedCuisine] = useState<typeof CUISINE_OPTIONS[0] | null>(null);
  const [location, setLocation] = useState('');
  const [matchResult, setMatchResult] = useState<any>(null);
  const [waitingQueueId, setWaitingQueueId] = useState<string | null>(null);
  const [spinIndex, setSpinIndex] = useState(0);
  const [countdown, setCountdown] = useState(30 * 60); // 30 minutes in seconds

  // Spin animation
  useEffect(() => {
    if (step !== 'spinning') return;
    const interval = setInterval(() => {
      setSpinIndex(prev => (prev + 1) % CUISINE_OPTIONS.length);
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      // Random select if user didn't pick
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
        if (prev <= 0) {
          clearInterval(interval);
          handleCancelWaiting();
          return 0;
        }
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
        setMatchResult({
          dinner_id: data.matched_dinner_id,
          cuisine: data.cuisine_type,
        });
        setStep('matched');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, waitingQueueId, user]);

  const handleStart = () => {
    if (!user) {
      toast({ title: '请先登录', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    setShowDialog(true);
    setStep('select');
    setSelectedCuisine(null);
    setMatchResult(null);
    setCountdown(30 * 60);
  };

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
    try {
      await supabase.rpc('cancel_random_match', { user_id_param: user.id });
    } catch {}
    setStep('select');
    setWaitingQueueId(null);
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Button
        onClick={handleStart}
        size="lg"
        className="relative overflow-hidden w-full bg-gradient-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <Dice5 className="w-5 h-5" />
          <span className="font-bold">今天吃什么？</span>
          <Sparkles className="w-4 h-4" />
        </div>
      </Button>

      <Dialog open={showDialog} onOpenChange={(open) => {
        if (!open && step === 'waiting') {
          handleCancelWaiting();
        }
        setShowDialog(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dice5 className="w-5 h-5 text-violet-500" />
              今天吃什么挑战
            </DialogTitle>
            <DialogDescription>
              {step === 'select' && '选一个菜系，找到同好一起吃！匹配成功+10积分 🎯'}
              {step === 'spinning' && '命运的转盘正在旋转...'}
              {step === 'waiting' && '等待同菜系的有缘人中...'}
              {step === 'matched' && '🎉 太巧了！找到和你想吃一样的人！'}
            </DialogDescription>
          </DialogHeader>

          {step === 'spinning' && (
            <div className="flex flex-col items-center py-12">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-spin" />
                <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                  <span className="text-4xl animate-bounce">
                    {CUISINE_OPTIONS[spinIndex].emoji}
                  </span>
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
                        ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30 shadow-md'
                        : 'border-border/60 hover:border-violet-300'
                    }`}
                  >
                    <span className="text-2xl">{cuisine.emoji}</span>
                    <p className="text-sm font-medium mt-1">{cuisine.label}</p>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRandomSpin}
                  className="flex-1"
                >
                  <Dice5 className="w-4 h-4 mr-1" />
                  随机转一个
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> 你在哪里？（选填）
                </label>
                <Input
                  placeholder="如：望京、西二旗、天河..."
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              <Button
                onClick={handleConfirmMatch}
                disabled={!selectedCuisine}
                className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
              >
                <ChefHat className="w-4 h-4 mr-2" />
                {selectedCuisine 
                  ? `开始匹配：${selectedCuisine.emoji} ${selectedCuisine.label}`
                  : '先选一个菜系'
                }
              </Button>
            </div>
          )}

          {step === 'waiting' && (
            <div className="flex flex-col items-center py-8 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-violet-200 dark:border-violet-800 flex items-center justify-center">
                  <span className="text-3xl">{selectedCuisine?.emoji}</span>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 animate-pulse flex items-center justify-center">
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="font-medium">
                  正在寻找想吃 <span className="text-violet-500">{selectedCuisine?.label}</span> 的人
                </p>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="w-4 h-4" />
                  <span>剩余等待时间：{formatCountdown(countdown)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  匹配成功后会自动创建饭局并通知你
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleCancelWaiting}
                className="text-destructive border-destructive/50"
              >
                <X className="w-4 h-4 mr-1" />
                取消等待
              </Button>
            </div>
          )}

          {step === 'matched' && matchResult && (
            <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30">
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
                
                <Button
                  onClick={() => {
                    setShowDialog(false);
                    navigate(`/dinner/${matchResult.dinner_id}`);
                  }}
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                >
                  查看饭局详情
                </Button>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
