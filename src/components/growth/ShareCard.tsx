import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Share2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface ShareCardProps {
  type: 'dinner' | 'achievement' | 'invite';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  inviteCode?: string;
  stats?: { label: string; value: string | number }[];
}

export function ShareCard({ 
  type, 
  title, 
  subtitle, 
  imageUrl, 
  inviteCode,
  stats 
}: ShareCardProps) {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    
    const shareData = {
      title: title,
      text: subtitle || title,
      url: inviteCode 
        ? `${window.location.origin}/auth?invite=${inviteCode}`
        : window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: i18n.language === 'zh' ? '分享成功' : 'Shared successfully'
        });
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: i18n.language === 'zh' ? '链接已复制' : 'Link copied',
          description: i18n.language === 'zh' ? '可以粘贴分享给好友' : 'You can paste and share with friends'
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: i18n.language === 'zh' ? '分享失败' : 'Share failed',
          variant: 'destructive'
        });
      }
    } finally {
      setSharing(false);
    }
  };

  const gradients = {
    dinner: 'from-orange-400 to-red-500',
    achievement: 'from-purple-400 to-pink-500',
    invite: 'from-blue-400 to-cyan-500'
  };

  return (
    <Card className="overflow-hidden shadow-lg">
      <div ref={cardRef}>
        {/* 卡片头部 */}
        <div className={`bg-gradient-to-br ${gradients[type]} p-6 text-white relative overflow-hidden`}>
          {/* 装饰元素 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5" />
              <Badge className="bg-white/20 text-white border-0">
                {type === 'dinner' && (i18n.language === 'zh' ? '饭局分享' : 'Dinner Share')}
                {type === 'achievement' && (i18n.language === 'zh' ? '成就分享' : 'Achievement')}
                {type === 'invite' && (i18n.language === 'zh' ? '邀请好友' : 'Invite')}
              </Badge>
            </div>
            
            <h3 className="text-xl font-bold mb-1">{title}</h3>
            {subtitle && (
              <p className="text-white/80 text-sm">{subtitle}</p>
            )}
          </div>
        </div>

        {/* 卡片内容 */}
        <CardContent className="p-4">
          {/* 统计数据 */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* 邀请码 */}
          {inviteCode && (
            <div className="bg-muted/50 rounded-lg p-3 text-center mb-4">
              <p className="text-xs text-muted-foreground mb-1">
                {i18n.language === 'zh' ? '邀请码' : 'Invite Code'}
              </p>
              <p className="text-xl font-bold tracking-widest text-primary">
                {inviteCode}
              </p>
            </div>
          )}

          {/* 分享按钮 */}
          <Button 
            onClick={handleShare} 
            className="w-full gap-2"
            disabled={sharing}
          >
            <Share2 className="h-4 w-4" />
            {sharing 
              ? (i18n.language === 'zh' ? '分享中...' : 'Sharing...') 
              : (i18n.language === 'zh' ? '立即分享' : 'Share Now')}
          </Button>

          {/* App标识 */}
          <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
            <span className="text-xs">
              {i18n.language === 'zh' ? '来自约饭App' : 'From Dinner App'}
            </span>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
