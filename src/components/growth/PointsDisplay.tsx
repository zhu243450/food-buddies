import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, Users, Utensils, Award } from 'lucide-react';
import { useUserRewards } from '@/hooks/useUserRewards';
import { useTranslation } from 'react-i18next';

interface PointsDisplayProps {
  userId?: string;
}

export function PointsDisplay({ userId }: PointsDisplayProps) {
  const { i18n } = useTranslation();
  const { rewards } = useUserRewards(userId);

  if (rewards.loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-24 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    { 
      label: i18n.language === 'zh' ? '邀请积分' : 'Invite',
      value: rewards.invitePoints,
      icon: Users,
      color: 'text-blue-500'
    },
    { 
      label: i18n.language === 'zh' ? '饭局积分' : 'Dinner',
      value: rewards.dinnerPoints,
      icon: Utensils,
      color: 'text-green-500'
    },
    { 
      label: i18n.language === 'zh' ? '成就积分' : 'Achievement',
      value: rewards.achievementPoints,
      icon: Award,
      color: 'text-purple-500'
    }
  ];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* 总积分 */}
        <div className="bg-gradient-primary p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm flex items-center gap-1">
                <Coins className="h-4 w-4" />
                {i18n.language === 'zh' ? '我的积分' : 'My Points'}
              </p>
              <p className="text-4xl font-bold mt-1">
                {rewards.totalPoints.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <Badge className="bg-white/20 text-white border-0">
                Lv.{rewards.level}
              </Badge>
              <p className="text-xs text-primary-foreground/60 mt-2">
                {i18n.language === 'zh' ? '等级' : 'Level'}
              </p>
            </div>
          </div>
        </div>

        {/* 积分明细 */}
        <div className="grid grid-cols-3 divide-x">
          {stats.map((stat) => (
            <div key={stat.label} className="p-4 text-center">
              <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
