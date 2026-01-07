import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Share2, Copy, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareInviteCardProps {
  dinner: {
    id: string;
    title: string;
    description?: string | null;
    dinner_time: string;
    location: string;
    max_participants: number;
    food_preferences?: string[] | null;
  };
  participantCount: number;
  hostName?: string;
}

export const ShareInviteCard = ({ dinner, participantCount, hostName }: ShareInviteCardProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" }),
      time: date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    };
  };

  const { date, time } = formatDateTime(dinner.dinner_time);
  const shareUrl = `${window.location.origin}/dinner/${dinner.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: t('share.linkCopied'),
        description: t('share.linkCopiedDesc')
      });
    } catch (error) {
      toast({
        title: t('share.copyFailed'),
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    const shareText = `🍽️ ${dinner.title}\n📅 ${date} ${time}\n📍 ${dinner.location}\n\n${shareUrl}`;
    
    // 使用 Web Share API (移动端)
    if (navigator.share) {
      try {
        await navigator.share({
          title: dinner.title,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (error) {
        // 用户取消或不支持
      }
    }
    
    // 回退到复制链接
    handleCopyLink();
  };

  const spotsLeft = dinner.max_participants - participantCount;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
      >
        <Share2 className="w-4 h-4" />
        {t('shareCard.generate', '生成邀请卡')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t('shareCard.title', '分享邀请卡')}
            </DialogTitle>
            <DialogDescription>
              {t('shareCard.description', '复制链接分享给好友')}
            </DialogDescription>
          </DialogHeader>

          {/* 邀请卡预览 */}
          <div className="p-6 pt-4">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent p-1">
              <div className="bg-background rounded-xl p-6 space-y-4">
                {/* 头部装饰 */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                    <Sparkles className="w-4 h-4" />
                    {t('shareCard.inviteYou', '诚邀你来')}
                  </div>
                </div>

                {/* 饭局标题 */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {dinner.title}
                  </h3>
                  {dinner.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {dinner.description}
                    </p>
                  )}
                </div>

                {/* 时间地点 */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">📅 {t('dinner.time', '时间')}</div>
                    <div className="font-semibold text-foreground">{date}</div>
                    <div className="text-lg font-bold text-primary">{time}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">📍 {t('dinner.location', '地点')}</div>
                    <div className="font-semibold text-foreground line-clamp-2">{dinner.location}</div>
                  </div>
                </div>

                {/* 美食标签 */}
                {dinner.food_preferences && dinner.food_preferences.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {dinner.food_preferences.slice(0, 4).map((pref, idx) => pref && (
                      <span 
                        key={idx} 
                        className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium"
                      >
                        {pref}
                      </span>
                    ))}
                  </div>
                )}

                {/* 名额信息 */}
                <div className="text-center">
                  {spotsLeft > 0 ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600">
                      <span className="font-bold">{t('shareCard.spotsLeft', '还剩')} {spotsLeft} {t('shareCard.spots', '个名额')}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive">
                      <span className="font-bold">{t('shareCard.full', '名额已满')}</span>
                    </div>
                  )}
                </div>

                {/* 发起人 */}
                {hostName && (
                  <div className="text-center text-sm text-muted-foreground">
                    {t('shareCard.hostedBy', '发起人')}: {hostName}
                  </div>
                )}

                {/* 底部链接区域 */}
                <div className="text-center pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    {t('shareCard.scanOrClick', '点击链接查看详情')}
                  </p>
                  <p className="text-xs text-primary font-medium mt-1 break-all">
                    {shareUrl}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="p-6 pt-0 flex gap-3">
            <Button
              onClick={handleShare}
              className="flex-1 bg-gradient-to-r from-primary to-accent"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t('shareCard.shareNow', '立即分享')}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('shareCard.copied', '已复制')}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  {t('shareCard.copyLink', '复制链接')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
