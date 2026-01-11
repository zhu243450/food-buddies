import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown } from 'lucide-react';
import { useUserRewards } from '@/hooks/useUserRewards';
import { useTranslation } from 'react-i18next';

interface LeaderboardCardProps {
  userId?: string;
}

export function LeaderboardCard({ userId }: LeaderboardCardProps) {
  const { i18n } = useTranslation();
  const { leaderboard } = useUserRewards(userId);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center font-medium text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-700';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-muted/30';
    }
  };

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {i18n.language === 'zh' ? '邀请排行榜' : 'Invite Leaderboard'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>{i18n.language === 'zh' ? '暂无排行数据' : 'No leaderboard data yet'}</p>
            <p className="text-sm mt-1">
              {i18n.language === 'zh' ? '成为第一个邀请好友的人！' : 'Be the first to invite friends!'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {i18n.language === 'zh' ? '邀请排行榜' : 'Invite Leaderboard'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {leaderboard.map((entry) => (
          <div 
            key={entry.user_id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(Number(entry.rank))} ${
              entry.user_id === userId ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-center justify-center w-6">
              {getRankIcon(Number(entry.rank))}
            </div>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.avatar_url || ''} alt={entry.nickname} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {entry.nickname?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {entry.nickname}
                {entry.user_id === userId && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {i18n.language === 'zh' ? '我' : 'Me'}
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {entry.total_points} {i18n.language === 'zh' ? '积分' : 'points'}
              </p>
            </div>
            
            <div className="text-right">
              <Badge variant="outline" className="font-bold">
                {entry.invite_count} {i18n.language === 'zh' ? '人' : ''}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
