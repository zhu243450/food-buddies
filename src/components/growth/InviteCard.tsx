import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, Users, Gift, QrCode } from 'lucide-react';
import { useInviteCode } from '@/hooks/useInviteCode';
import { useTranslation } from 'react-i18next';

interface InviteCardProps {
  userId: string;
}

export function InviteCard({ userId }: InviteCardProps) {
  const { t, i18n } = useTranslation();
  const { 
    inviteCode, 
    successfulInvites, 
    loading, 
    copyInviteCode, 
    copyInviteLink 
  } = useInviteCode(userId);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-32 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const handleShare = async () => {
    const link = `${window.location.origin}/auth?invite=${inviteCode}`;
    const text = i18n.language === 'zh' 
      ? `我在约饭App发现了超棒的社交方式，快来加入我吧！使用邀请码 ${inviteCode} 注册可获得额外积分奖励！`
      : `I found an amazing social dining app! Join me using invite code ${inviteCode} and get bonus points!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: i18n.language === 'zh' ? '约饭App邀请' : 'Dinner Invite',
          text,
          url: link
        });
      } catch {
        copyInviteLink();
      }
    } else {
      copyInviteLink();
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-primary text-primary-foreground pb-8">
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          {i18n.language === 'zh' ? '邀请好友' : 'Invite Friends'}
        </CardTitle>
        <p className="text-primary-foreground/80 text-sm mt-1">
          {i18n.language === 'zh' 
            ? '邀请好友注册，双方都可获得积分奖励！' 
            : 'Invite friends and both get bonus points!'}
        </p>
      </CardHeader>
      
      <CardContent className="p-6 -mt-4">
        {/* 邀请码卡片 */}
        <div className="bg-background rounded-xl border-2 border-dashed border-primary/30 p-4 text-center mb-4">
          <p className="text-xs text-muted-foreground mb-2">
            {i18n.language === 'zh' ? '我的专属邀请码' : 'My Invite Code'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold tracking-widest text-primary">
              {inviteCode}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={copyInviteCode}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 奖励说明 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-accent/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">+100</p>
            <p className="text-xs text-muted-foreground">
              {i18n.language === 'zh' ? '邀请者奖励' : 'Inviter Reward'}
            </p>
          </div>
          <div className="bg-accent/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">+50</p>
            <p className="text-xs text-muted-foreground">
              {i18n.language === 'zh' ? '被邀请者奖励' : 'Invitee Reward'}
            </p>
          </div>
        </div>

        {/* 邀请统计 */}
        <div className="flex items-center justify-between py-3 border-t">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {i18n.language === 'zh' ? '已邀请' : 'Invited'}
            </span>
          </div>
          <Badge variant="secondary" className="font-bold">
            {successfulInvites} {i18n.language === 'zh' ? '人' : 'people'}
          </Badge>
        </div>

        {/* 分享按钮 */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="outline" onClick={copyInviteLink} className="gap-2">
            <Copy className="h-4 w-4" />
            {i18n.language === 'zh' ? '复制链接' : 'Copy Link'}
          </Button>
          <Button onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            {i18n.language === 'zh' ? '立即分享' : 'Share Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
