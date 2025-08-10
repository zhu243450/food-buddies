import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, MessageCircle, Heart, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shareUrl = `${window.location.origin}/dinner/${dinner.id}`;
  const shareText = `🍽️ ${dinner.title}\n📅 ${formatDateTime(dinner.dinner_time)}\n📍 ${dinner.location}\n👥 ${participantCount}/${dinner.max_participants}人\n\n${dinner.description || '快来一起享受美食时光吧！'}\n\n点击链接加入我们：`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({
        title: "链接已复制",
        description: "可以粘贴分享给朋友了！",
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
      name: "微信好友",
      icon: "💬",
      color: "bg-green-500 hover:bg-green-600",
      action: handleWeChatShare,
    },
    {
      name: "新浪微博",
      icon: "🔥",
      color: "bg-red-500 hover:bg-red-600",
      action: handleWeiboShare,
    },
    {
      name: "QQ空间",
      icon: "🌟",
      color: "bg-blue-500 hover:bg-blue-600",
      action: handleQQShare,
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
          variant="ghost"
          size="icon"
          className="text-black/80 hover:text-black hover:bg-black/10 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            分享饭局
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
              <span>{participantCount}/{dinner.max_participants}人</span>
              {participantCount >= dinner.max_participants && (
                <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive">
                  已满员
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
        <div className="grid grid-cols-2 gap-3">
          {shareOptions.map((option) => (
            <Button
              key={option.name}
              onClick={option.action}
              className={`${option.color} text-white h-12 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform`}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="text-xs">{option.name}</span>
            </Button>
          ))}
        </div>

        {/* 分享预览文本 */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">分享预览：</p>
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