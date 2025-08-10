import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, MessageCircle, Heart, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

interface ShareDinnerProps {
  dinner: {
    id: string;
    title: string;
    description?: string;
    dinner_time: string;
    location: string;
    max_participants: number;
    food_preferences?: string[];
  };
  participantCount: number;
}

const ShareDinner = ({ dinner, participantCount }: ShareDinnerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(i18n.language === 'zh' ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shareUrl = `${window.location.origin}/dinner/${dinner.id}`;
  const shareText = `🍽️ ${dinner.title}\n📅 ${formatDateTime(dinner.dinner_time)}\n📍 ${dinner.location}\n👥 ${participantCount}/${dinner.max_participants}${t('share.people')}\n\n${dinner.description || t('share.defaultMessage')}\n\n${t('share.clickToJoin')}:`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({
        title: t('share.linkCopied'),
        description: t('share.linkCopiedDesc'),
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: t('share.copyFailed'),
        description: t('share.copyFailedDesc'),
        variant: "destructive",
      });
    }
  };

  const handleWeChatShare = () => {
    handleCopyLink();
    toast({
      title: t('share.wechatShare'),
      description: t('share.wechatShareDesc'),
    });
  };

  const handleWeiboShare = () => {
    const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
    window.open(weiboUrl, '_blank');
    setIsOpen(false);
  };

  const handleQQShare = () => {
    const qqUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
    window.open(qqUrl, '_blank');
    setIsOpen(false);
  };

  const shareOptions = [
    {
      name: t('share.wechat'),
      icon: "💬",
      color: "bg-green-500 hover:bg-green-600",
      action: handleWeChatShare,
    },
    {
      name: "Instagram",
      icon: "📸",
      color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
      action: () => {
        handleCopyLink();
        toast({
          title: t('share.instagramShare'),
          description: t('share.instagramShareDesc'),
        });
      },
    },
    {
      name: "X (Twitter)",
      icon: "🐦",
      color: "bg-black hover:bg-gray-800",
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
        setIsOpen(false);
      },
    },
    {
      name: "Facebook",
      icon: "📘",
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(fbUrl, '_blank');
        setIsOpen(false);
      },
    },
    {
      name: t('share.weibo'),
      icon: "🔥",
      color: "bg-red-500 hover:bg-red-600",
      action: handleWeiboShare,
    },
    {
      name: t('share.qzone'),
      icon: "🌟",
      color: "bg-blue-500 hover:bg-blue-600",
      action: handleQQShare,
    },
    {
      name: t('share.copyLink'),
      icon: "📋",
      color: "bg-gray-500 hover:bg-gray-600",
      action: handleCopyLink,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 h-8 w-8 text-black/80 hover:text-black hover:bg-black/10 transition-all shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            {t('share.shareDinner')}
          </DialogTitle>
        </DialogHeader>
        
        {/* 饭局预览卡片 */}
        <div className="bg-gradient-to-br from-card to-accent/10 p-4 rounded-lg border border-accent/20 mb-4">
          <h3 className="font-bold text-lg mb-2">{dinner.title}</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{formatDateTime(dinner.dinner_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>{dinner.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{participantCount}/{dinner.max_participants}{t('share.people')}</span>
              {participantCount >= dinner.max_participants && (
                <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive">
                  {t('share.full')}
                </Badge>
              )}
            </div>
          </div>
          {dinner.food_preferences && dinner.food_preferences.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {dinner.food_preferences.slice(0, 3).map((preference) => (
                <Badge 
                  key={preference} 
                  variant="secondary" 
                  className="text-xs bg-primary/20 text-primary"
                >
                  {preference}
                </Badge>
              ))}
              {dinner.food_preferences.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{dinner.food_preferences.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* 分享选项 */}
        <div className="grid grid-cols-2 gap-2">
          {shareOptions.map((option) => (
            <Button
              key={option.name}
              onClick={option.action}
              className={`${option.color} text-white h-14 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform text-xs`}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="leading-tight text-center">{option.name}</span>
            </Button>
          ))}
        </div>

        {/* 分享预览文本 */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">{t('share.sharePreview')}:</p>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {shareText}
          </p>
          <p className="text-xs text-primary mt-2 break-all">{shareUrl}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDinner;