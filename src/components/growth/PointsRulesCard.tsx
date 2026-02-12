import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, ChevronDown, Users, Utensils, Camera, Trophy, Star, Gift } from 'lucide-react';

interface RuleItem {
  icon: React.ElementType;
  action: string;
  actionEn: string;
  points: string;
  color: string;
}

const RULES: RuleItem[] = [
  { icon: Users, action: '邀请好友注册', actionEn: 'Invite a friend', points: '+100', color: 'text-blue-500' },
  { icon: Gift, action: '受邀人完成注册', actionEn: 'Invitee signs up', points: '+50', color: 'text-cyan-500' },
  { icon: Utensils, action: '创建饭局', actionEn: 'Create a dinner', points: '+20', color: 'text-green-500' },
  { icon: Utensils, action: '参加饭局', actionEn: 'Join a dinner', points: '+10', color: 'text-emerald-500' },
  { icon: Camera, action: '活动打卡上传照片', actionEn: 'Campaign check-in photo', points: '+20', color: 'text-orange-500' },
  { icon: Star, action: '完成饭局评价', actionEn: 'Review after dinner', points: '+10', color: 'text-yellow-500' },
  { icon: Trophy, action: '解锁成就勋章', actionEn: 'Unlock achievement', points: '+10~100', color: 'text-purple-500' },
];

export function PointsRulesCard() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const isZh = i18n.language === 'zh';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                {isZh ? '积分获取说明' : 'How to Earn Points'}
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="space-y-2.5 mt-2">
              {RULES.map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <rule.icon className={`h-4 w-4 ${rule.color} shrink-0`} />
                    <span className="text-sm text-foreground">
                      {isZh ? rule.action : rule.actionEn}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary whitespace-nowrap ml-2">
                    {rule.points}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
              <p>💡 {isZh ? '积分可用于兑换优惠券或提现（50积分 = 1元）' : 'Points can be used for coupons or cash withdrawal (50 pts = ¥1)'}</p>
              <p>⚠️ {isZh ? '恶意刷分将被清零处理' : 'Abuse will result in points reset'}</p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
