import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Download, Image, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toPng } from "html-to-image";
import QRCode from "qrcode";

interface CampaignSharePosterProps {
  campaign: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    participant_count: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CampaignSharePoster = ({ campaign, open, onOpenChange }: CampaignSharePosterProps) => {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const posterRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [posterImageUrl, setPosterImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const isZh = i18n.language === 'zh';
  const publishedOrigin = 'https://dinemate.xyz';
  const shareUrl = `${publishedOrigin}/campaign/${campaign.id}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isZh ? "zh-CN" : "en-US", { month: "long", day: "numeric" });
  };

  const generatePosterImage = useCallback(async () => {
    if (!posterRef.current) return;
    setGenerating(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 120,
        margin: 1,
        color: { dark: '#1a1a2e', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      setQrCodeUrl(qrDataUrl);

      await new Promise(r => setTimeout(r, 300));
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
  }, [campaign, isZh, toast, shareUrl]);

  useEffect(() => {
    if (open) {
      setPosterImageUrl(null);
      const timer = setTimeout(() => generatePosterImage(), 300);
      return () => clearTimeout(timer);
    }
  }, [open, generatePosterImage]);

  const handleSaveImage = useCallback(async () => {
    if (!posterImageUrl) return;
    setSaving(true);
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        try {
          const response = await fetch(posterImageUrl);
          const blob = await response.blob();
          const file = new File([blob], `campaign-${campaign.id}.png`, { type: 'image/png' });
          await navigator.share({
            title: campaign.title,
            text: isZh ? '快来参加活动吧！' : 'Join this campaign!',
            files: [file],
          });
          return;
        } catch {
          // Fall through to download
        }
      }

      const link = document.createElement('a');
      link.download = `campaign-${campaign.id}.png`;
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
  }, [posterImageUrl, campaign, toast, isZh]);

  // Extract first 2 lines of description for poster
  const shortDesc = campaign.description.split('\n').filter(l => l.trim()).slice(0, 2).join('\n');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-5 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            {isZh ? '生成活动海报' : 'Generate Campaign Poster'}
          </DialogTitle>
          <DialogDescription>
            {isZh ? '长按图片保存，直接发朋友圈' : 'Long press to save, then share'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-3 overflow-y-auto flex-1 min-h-0">
          {posterImageUrl ? (
            <div className="rounded-xl overflow-hidden shadow-lg border border-border">
              <img
                src={posterImageUrl}
                alt={isZh ? '活动分享海报' : 'Campaign share poster'}
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
                background: 'linear-gradient(145deg, #ffffff 0%, #fef3c7 30%, #fde68a 60%, #fed7aa 100%)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                padding: '0',
                overflow: 'hidden',
              }}
            >
              {/* Top decorative bar */}
              <div style={{ height: '6px', background: 'linear-gradient(135deg, #ef4444, #f97316, #eab308)', width: '100%' }} />

              {/* Header */}
              <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🎆</span>
                  <span style={{
                    fontSize: '16px', fontWeight: '700',
                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    {isZh ? '饭约社' : 'FoodBuddies'}
                  </span>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '20px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  fontSize: '12px', color: '#dc2626', fontWeight: '500',
                }}>
                  🔥 {isZh ? '热门活动' : 'Hot Campaign'}
                </div>
              </div>

              {/* Main content */}
              <div style={{ padding: '0 24px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a2e', margin: '0 0 8px 0', lineHeight: '1.3' }}>
                  {campaign.title}
                </h2>

                <p style={{
                  fontSize: '13px', color: '#6b7280', margin: '0 0 16px 0', lineHeight: '1.5',
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {shortDesc}
                </p>

                {/* Info cards */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <div style={{
                    flex: 1, background: 'rgba(255,255,255,0.8)', borderRadius: '12px',
                    padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.1)',
                  }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>📅 {isZh ? '活动时间' : 'Period'}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e' }}>
                      {formatDate(campaign.start_date)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>至</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e' }}>
                      {formatDate(campaign.end_date)}
                    </div>
                  </div>
                  <div style={{
                    flex: 1, background: 'rgba(255,255,255,0.8)', borderRadius: '12px',
                    padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(249, 115, 22, 0.1)',
                  }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>👥 {isZh ? '参与人数' : 'Participants'}</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#f97316' }}>
                      {campaign.participant_count}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{isZh ? '人已参与' : 'joined'}</div>
                  </div>
                </div>

                {/* Highlights */}
                <div style={{
                  background: 'rgba(255,255,255,0.6)', borderRadius: '12px',
                  padding: '12px 16px', marginBottom: '16px',
                  border: '1px solid rgba(234, 179, 8, 0.2)',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px' }}>
                    🎯 {isZh ? '活动亮点' : 'Highlights'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.6' }}>
                    {isZh ? '📸 拍照打卡赢积分 · 🏆 排行榜赢大奖 · 🎖️ 解锁限定徽章' : '📸 Check in for points · 🏆 Leaderboard prizes · 🎖️ Unlock badges'}
                  </div>
                </div>
              </div>

              {/* Footer with QR code */}
              <div style={{
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                {qrCodeUrl && (
                  <div style={{
                    background: '#ffffff', borderRadius: '8px', padding: '6px',
                    flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}>
                    <img src={qrCodeUrl} alt="QR Code" style={{ width: '80px', height: '80px', display: 'block' }} />
                  </div>
                )}
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
                    📱 {isZh ? '扫码参与活动' : 'Scan to join campaign'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4' }}>
                    {isZh ? '用手机相机扫码，即可查看详情' : 'Use phone camera to scan & view details'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-5 pt-2 flex flex-col gap-2 shrink-0 border-t border-border/40 bg-background">
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
