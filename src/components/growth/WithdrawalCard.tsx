import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ArrowRightLeft, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRewards } from '@/hooks/useUserRewards';
import { toast } from 'sonner';

interface WithdrawalCardProps {
  userId?: string;
}

const POINTS_PER_YUAN = 50;
const MIN_CASH = 100;
const MIN_POINTS = MIN_CASH * POINTS_PER_YUAN;

export function WithdrawalCard({ userId }: WithdrawalCardProps) {
  const { rewards } = useUserRewards(userId);
  const [pointsInput, setPointsInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const cashAmount = pointsInput ? (parseInt(pointsInput) / POINTS_PER_YUAN) : 0;
  const isValid = parseInt(pointsInput) >= MIN_POINTS && 
                  parseInt(pointsInput) % POINTS_PER_YUAN === 0 &&
                  parseInt(pointsInput) <= rewards.totalPoints;

  useEffect(() => {
    if (!userId) return;
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      setHistory(data || []);
      setHistoryLoading(false);
    };
    fetchHistory();
  }, [userId]);

  const handleSubmit = async () => {
    if (!userId || !isValid) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_withdrawal_request', {
        user_id_param: userId,
        points_amount_param: parseInt(pointsInput),
        payment_method_param: paymentMethod || null,
        payment_account_param: paymentAccount || null,
      });
      
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        toast.success(result.message);
        setPointsInput('');
        setPaymentMethod('');
        setPaymentAccount('');
        // Refresh history
        const { data: newHistory } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        setHistory(newHistory || []);
      } else {
        toast.error(result?.message || '提现失败');
      }
    } catch (err: any) {
      toast.error(err.message || '提现申请失败');
    } finally {
      setLoading(false);
    }
  };

  const setMaxPoints = () => {
    const max = Math.floor(rewards.totalPoints / POINTS_PER_YUAN) * POINTS_PER_YUAN;
    setPointsInput(String(max));
  };

  const statusConfig: Record<string, { label: string; icon: any; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: '审核中', icon: Clock, variant: 'secondary' },
    approved: { label: '已通过', icon: CheckCircle, variant: 'default' },
    rejected: { label: '已拒绝', icon: XCircle, variant: 'destructive' },
    completed: { label: '已完成', icon: CheckCircle, variant: 'default' },
  };

  return (
    <div className="space-y-4">
      {/* 兑换规则 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            积分兑换规则
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{POINTS_PER_YUAN}</p>
              <p>积分 = 1元</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{MIN_CASH}元</p>
              <p>最低提现</p>
            </div>
          </div>
          <div className="flex items-start gap-2 mt-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs">提现申请提交后需等待管理员审核，每次仅限一笔未处理申请。</p>
          </div>
        </CardContent>
      </Card>

      {/* 提现申请 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            申请提现
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>提现积分</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                placeholder={`最少 ${MIN_POINTS} 积分`}
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
                min={MIN_POINTS}
                step={POINTS_PER_YUAN}
              />
              <Button variant="outline" size="sm" onClick={setMaxPoints} className="shrink-0">
                全部
              </Button>
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                可用: {rewards.totalPoints} 积分
              </p>
              {pointsInput && (
                <p className="text-xs font-medium text-primary">
                  ≈ ¥{cashAmount.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>收款方式</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="选择收款方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wechat">微信</SelectItem>
                <SelectItem value="alipay">支付宝</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>收款账号</Label>
            <Input
              className="mt-1"
              placeholder="请输入收款账号"
              value={paymentAccount}
              onChange={(e) => setPaymentAccount(e.target.value)}
            />
          </div>

          <Button 
            className="w-full" 
            disabled={!isValid || loading || !paymentMethod || !paymentAccount}
            onClick={handleSubmit}
          >
            {loading ? '提交中...' : `申请提现 ¥${cashAmount.toFixed(2)}`}
          </Button>
        </CardContent>
      </Card>

      {/* 提现记录 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">提现记录</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">暂无提现记录</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const config = statusConfig[item.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                return (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">¥{Number(item.cash_amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.points_amount}积分 · {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={config.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
