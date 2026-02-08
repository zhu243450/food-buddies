import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Download, Image, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toPng } from "html-to-image";

interface DinnerSharePosterProps {
  dinner: {
    id: string;
    title: string;
    description?: string | null;
    dinner_time: string;
    location: string;
    max_participants: number;
    food_preferences?: string[] | null;
    dinner_category?: string | null;
  };
  participantCount: number;
  hostName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_CONFIG: Record<string, { emoji: string; label: string; labelEn: string }> = {
  business: { emoji: '💼', label: '商务宴请', labelEn: 'Business' },
  friends: { emoji: '🎉', label: '朋友聚餐', labelEn: 'Friends' },
  meetup: { emoji: '🤝', label: '认识新朋友', labelEn: 'Meetup' },
  celebration: { emoji: '🎂', label: '庆祝纪念', labelEn: 'Celebration' },
  foodie: { emoji: '🍜', label: '美食探店', labelEn: 'Foodie' },
  family: { emoji: '👨‍👩‍👧‍👦', label: '家庭聚餐', labelEn: 'Family' },
  themed: { emoji: '🎭', label: '主题饭局', labelEn: 'Themed' },
};

export const DinnerSharePoster = ({ dinner, participantCount, hostName, open, onOpenChange }: DinnerSharePosterProps) => {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const posterRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [posterImageUrl, setPosterImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isZh = i18n.language === 'zh';
  const shareUrl = `${window.location.origin}/dinner/${dinner.id}`;
  const spotsLeft = dinner.max_participants - participantCount;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(isZh ? "zh-CN" : "en-US", { month: "long", day: "numeric", weekday: "short" }),
      time: date.toLocaleTimeString(isZh ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit" })
    };
  };

  const { date, time } = formatDateTime(dinner.dinner_time);
  const category = dinner.dinner_category ? CATEGORY_CONFIG[dinner.dinner_category] : null;

  // Auto-generate poster image when dialog opens
  const generatePosterImage = useCallback(async () => {
    if (!posterRef.current) return;
    setGenerating(true);
    try {
      // Small delay to ensure DOM is fully rendered
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(posterRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });
      setPosterImageUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate poster:', error);
      toast({
        title: isZh ? '生成失败' : 'Generation failed',
        description: isZh ? '请重试' : 'Please try again',
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }, [dinner, isZh, toast]);

  // Reset and regenerate when dialog opens
  useEffect(() => {
    if (open) {
      setPosterImageUrl(null);
      // Wait for hidden template to render, then generate
      const timer = setTimeout(() => generatePosterImage(), 300);
      return () => clearTimeout(timer);
    }
  }, [open, generatePosterImage]);

  const handleSaveImage = useCallback(async () => {
    if (!posterImageUrl) return;
    setSaving(true);
    try {
      // Try to share with file on mobile
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        try {
          const response = await fetch(posterImageUrl);
          const blob = await response.blob();
          const file = new File([blob], `dinner-${dinner.id}.png`, { type: 'image/png' });
          await navigator.share({
            title: dinner.title,
            text: isZh ? '快来一起吃饭吧！' : 'Join me for dinner!',
            files: [file],
          });
          return;
        } catch {
          // Fall through to download
        }
      }

      // Fallback: download
      const link = document.createElement('a');
      link.download = `dinner-${dinner.id}.png`;
      link.href = posterImageUrl;
      link.click();

      toast({
        title: isZh ? '海报已保存' : 'Poster saved',
        description: isZh ? '图片已保存，可直接发送至微信朋友圈' : 'Image saved, share it on social media',
      });
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [posterImageUrl, dinner, toast, isZh]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            {isZh ? '生成分享海报' : 'Generate Share Poster'}
          </DialogTitle>
          <DialogDescription>
            {isZh ? '长按图片保存，直接发朋友圈' : 'Long press to save, then share'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-3">
          {/* Show generated image (long-pressable) or loading state */}
          {posterImageUrl ? (
            <div className="rounded-xl overflow-hidden shadow-lg border border-border">
              <img
                src={posterImageUrl}
                alt={isZh ? '饭局分享海报' : 'Dinner share poster'}
                className="w-full h-auto block"
                style={{ WebkitTouchCallout: 'default' }}
              />
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden shadow-lg border border-border bg-muted flex items-center justify-center" style={{ minHeight: '300px' }}>
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm">{isZh ? '海报生成中...' : 'Generating poster...'}</span>
              </div>
            </div>
          )}

          {/* Hidden template for html-to-image capture */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <div
              ref={posterRef}
              style={{
                width: '360px',
                background: 'linear-gradient(145deg, #ffffff 0%, #fdf2f8 30%, #fce7f3 60%, #fff7ed 100%)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                padding: '0',
                overflow: 'hidden',
              }}
            >
              {/* Top decorative bar */}
              <div style={{ height: '6px', background: 'linear-gradient(135deg, #c026d3, #f97316)', width: '100%' }} />

              {/* Header */}
              <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🍽️</span>
                  <span style={{
                    fontSize: '16px', fontWeight: '700',
                    background: 'linear-gradient(135deg, #c026d3, #f97316)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    {isZh ? '饭约社' : 'FoodBuddies'}
                  </span>
                </div>
                {category && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '20px',
                    background: 'rgba(192, 38, 211, 0.1)',
                    fontSize: '12px', color: '#a21caf', fontWeight: '500',
                  }}>
                    <span>{category.emoji}</span>
                    <span>{isZh ? category.label : category.labelEn}</span>
                  </div>
                )}
              </div>

              {/* Main content */}
              <div style={{ padding: '0 24px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a2e', margin: '0 0 8px 0', lineHeight: '1.3' }}>
                  {dinner.title}
                </h2>

                {dinner.description && (
                  <p style={{
                    fontSize: '13px', color: '#6b7280', margin: '0 0 16px 0', lineHeight: '1.5',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {dinner.description}
                  </p>
                )}

                {/* Info cards */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <div style={{
                    flex: 1, background: 'rgba(255,255,255,0.8)', borderRadius: '12px',
                    padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(192, 38, 211, 0.1)',
                  }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>📅 {isZh ? '时间' : 'Time'}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginBottom: '2px' }}>{date}</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#c026d3' }}>{time}</div>
                  </div>
                  <div style={{
                    flex: 1, background: 'rgba(255,255,255,0.8)', borderRadius: '12px',
                    padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(249, 115, 22, 0.1)',
                  }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>📍 {isZh ? '地点' : 'Location'}</div>
                    <div style={{
                      fontSize: '13px', fontWeight: '600', color: '#1a1a2e', lineHeight: '1.4',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {dinner.location}
                    </div>
                  </div>
                </div>

                {/* Food preferences */}
                {dinner.food_preferences && dinner.food_preferences.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', justifyContent: 'center' }}>
                    {dinner.food_preferences.slice(0, 5).map((pref, idx) => pref && (
                      <span key={idx} style={{
                        padding: '4px 12px', borderRadius: '20px',
                        background: 'rgba(249, 115, 22, 0.1)', color: '#ea580c', fontSize: '12px', fontWeight: '500',
                      }}>
                        {pref}
                      </span>
                    ))}
                  </div>
                )}

                {/* Spots */}
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', borderRadius: '24px',
                    background: spotsLeft > 0 ? 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))' : 'rgba(239,68,68,0.1)',
                    border: spotsLeft > 0 ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)',
                  }}>
                    <span style={{ fontSize: '16px' }}>👥</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: spotsLeft > 0 ? '#16a34a' : '#dc2626' }}>
                      {spotsLeft > 0
                        ? (isZh ? `还剩 ${spotsLeft} 个名额` : `${spotsLeft} spots left`)
                        : (isZh ? '名额已满' : 'Full')}
                    </span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      ({participantCount}/{dinner.max_participants})
                    </span>
                  </div>
                </div>

                {hostName && (
                  <div style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280', marginBottom: '14px' }}>
                    {isZh ? '发起人' : 'Host'}: <span style={{ fontWeight: '600', color: '#1a1a2e' }}>{hostName}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                background: 'linear-gradient(135deg, #c026d3, #f97316)',
                padding: '16px 24px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', marginBottom: '6px' }}>
                  {isZh ? '🍴 搜索「饭约社」加入我们' : '🍴 Search "FoodBuddies" to join'}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', wordBreak: 'break-all' }}>
                  {shareUrl}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-5 pt-2 flex flex-col gap-3">
          <Button
            onClick={handleSaveImage}
            disabled={!posterImageUrl || saving}
            className="w-full h-12 bg-gradient-primary text-white font-bold text-base"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {isZh ? '保存中...' : 'Saving...'}
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                {isZh ? '保存海报到相册' : 'Save Poster'}
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            {isZh ? '💡 也可以长按上方图片直接保存' : '💡 You can also long press the image to save'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
