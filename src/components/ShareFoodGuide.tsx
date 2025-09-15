import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, MapPin, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

interface ShareFoodGuideProps {
  regionInfo: {
    name: string;
    description?: string;
    path: Array<{
      name: string;
      level: string;
    }>;
  };
  currentPath: string;
}

const ShareFoodGuide = ({ regionInfo, currentPath }: ShareFoodGuideProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const shareUrl = `${window.location.origin}/food-guide${currentPath}`;
  const shareTitle = `🍽️ ${regionInfo.name}美食指南`;
  const shareText = `${shareTitle}\n\n📍 ${regionInfo.path.map(p => p.name).join(' > ')}\n\n${regionInfo.description || '发现当地最佳美食推荐，寻找完美的用餐体验！'}\n\n👆 点击链接查看完整美食指南:`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({
        title: "链接已复制",
        description: "美食指南链接已复制到剪贴板",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "复制失败",
        description: "请手动复制链接",
        variant: "destructive",
      });
    }
  };

  const handleWeChatShare = () => {
    handleCopyLink();
    toast({
      title: "微信分享",
      description: "链接已复制，请在微信中粘贴分享",
    });
  };

  const shareOptions = [
    {
      name: "微信",
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
          title: "Instagram 分享",
          description: "链接已复制，可在 Instagram Story 中分享",
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
      name: "微博",
      icon: "🔥",
      color: "bg-red-500 hover:bg-red-600",
      action: () => {
        const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
        window.open(weiboUrl, '_blank');
        setIsOpen(false);
      },
    },
    {
      name: "QQ空间",
      icon: "🌟",
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => {
        const qqUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
        window.open(qqUrl, '_blank');
        setIsOpen(false);
      },
    },
    {
      name: "复制链接",
      icon: "📋",
      color: "bg-gray-500 hover:bg-gray-600",
      action: handleCopyLink,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          分享美食指南
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            分享美食指南
          </DialogTitle>
          <DialogDescription>
            与朋友分享这个精彩的美食指南
          </DialogDescription>
        </DialogHeader>
        
        {/* 美食指南预览卡片 */}
        <div className="bg-gradient-to-br from-card to-accent/10 p-4 rounded-lg border border-accent/20 mb-4">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            {regionInfo.name}美食指南
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{regionInfo.path.map(p => p.name).join(' > ')}</span>
            </div>
            {regionInfo.description && (
              <p className="text-foreground/80 mt-2">{regionInfo.description}</p>
            )}
          </div>
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
          <p className="text-xs text-muted-foreground mb-2">分享预览:</p>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {shareText}
          </p>
          <p className="text-xs text-primary mt-2 break-all">{shareUrl}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareFoodGuide;