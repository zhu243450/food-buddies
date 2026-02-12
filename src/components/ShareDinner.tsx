import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Image, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';
import { DinnerSharePoster } from "@/components/DinnerSharePoster";

interface ShareDinnerProps {
  dinner: {
    id: string;
    title: string;
    description?: string;
    dinner_time: string;
    location: string;
    max_participants: number;
    food_preferences?: string[];
    dinner_category?: string | null;
  };
  participantCount: number;
  hostName?: string;
}

const ShareDinner = ({ dinner, participantCount, hostName }: ShareDinnerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const isZh = i18n.language === 'zh';

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(isZh ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const publishedOrigin = 'https://food-buddies.lovable.app';
  const shareUrl = `${publishedOrigin}/dinner/${dinner.id}`;
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

  const handleGeneratePoster = () => {
    setIsOpen(false);
    // Small delay so the first dialog closes before opening the poster
    setTimeout(() => setShowPoster(true), 200);
  };

  const handleWeiboShare = () => {
    const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
    window.open(weiboUrl, '_blank');
    setIsOpen(false);
  };

  const shareOptions = [
    {
      name: isZh ? '📸 生成海报' : '📸 Poster',
      description: isZh ? '保存图片发朋友圈' : 'Save image to share',
      color: "bg-gradient-primary text-white hover:opacity-90",
      action: handleGeneratePoster,
      featured: true,
    },
    {
      name: isZh ? '💬 微信' : '💬 WeChat',
      description: isZh ? '复制文案分享' : 'Copy text to share',
      color: "bg-green-500 hover:bg-green-600 text-white",
      action: () => {
        handleCopyLink();
        toast({
          title: t('share.wechatShare'),
          description: t('share.wechatShareDesc'),
        });
      },
      featured: false,
    },
    {
      name: "X (Twitter)",
      description: '',
      color: "bg-foreground/90 hover:bg-foreground text-background",
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
        setIsOpen(false);
      },
      featured: false,
    },
    {
      name: "Facebook",
      description: '',
      color: "bg-blue-600 hover:bg-blue-700 text-white",
      action: () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(fbUrl, '_blank');
        setIsOpen(false);
      },
      featured: false,
    },
    {
      name: isZh ? '🔥 微博' : '🔥 Weibo',
      description: '',
      color: "bg-red-500 hover:bg-red-600 text-white",
      action: handleWeiboShare,
      featured: false,
    },
    {
      name: isZh ? '📋 复制链接' : '📋 Copy Link',
      description: '',
      color: "bg-muted hover:bg-muted/80 text-foreground",
      action: handleCopyLink,
      featured: false,
    },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-all shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="w-3 h-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              {t('share.shareDinner')}
            </DialogTitle>
            <DialogDescription>
              {t('share.shareDescription', 'Choose how you want to share this dinner event')}
            </DialogDescription>
          </DialogHeader>
          
          {/* Dinner preview card */}
          <div className="bg-gradient-to-br from-card to-accent/10 p-4 rounded-lg border border-accent/20 mb-4">
            <h3 className="font-bold text-lg text-foreground mb-2">{dinner.title}</h3>
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
                {dinner.food_preferences.slice(0, 3).map((preference) => preference && (
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

          {/* Share options - poster first and prominent */}
          <div className="space-y-2">
            {/* Featured: Generate Poster */}
            {shareOptions.filter(o => o.featured).map((option) => (
              <Button
                key={option.name}
                onClick={option.action}
                className={`${option.color} w-full h-14 flex items-center justify-center gap-3 text-base font-bold shadow-lg`}
              >
                <Image className="w-5 h-5" />
                <div className="flex flex-col items-start">
                  <span>{option.name}</span>
                  {option.description && (
                    <span className="text-xs opacity-80 font-normal">{option.description}</span>
                  )}
                </div>
              </Button>
            ))}

            {/* Other options grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {shareOptions.filter(o => !o.featured).map((option) => (
                <Button
                  key={option.name}
                  onClick={option.action}
                  className={`${option.color} h-11 flex items-center justify-center gap-1 text-sm`}
                >
                  <span>{option.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Poster Dialog */}
      <DinnerSharePoster
        dinner={dinner}
        participantCount={participantCount}
        hostName={hostName}
        open={showPoster}
        onOpenChange={setShowPoster}
      />
    </>
  );
};

export default ShareDinner;
