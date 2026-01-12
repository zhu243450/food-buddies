import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Download, Share2, Loader2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const InvitePoster = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generatePoster = async () => {
    if (!user) {
      toast.error(i18n.language === 'zh' ? '请先登录' : 'Please login first');
      return;
    }

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('generate-poster', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { imageUrl, success } = response.data;
      
      if (success && imageUrl) {
        setPosterUrl(imageUrl);
        toast.success(i18n.language === 'zh' ? '海报生成成功！' : 'Poster generated!');
      } else {
        throw new Error('Failed to generate poster');
      }
    } catch (error: any) {
      console.error('Error generating poster:', error);
      toast.error(i18n.language === 'zh' ? '生成失败，请重试' : 'Generation failed, please retry');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPoster = async () => {
    if (!posterUrl) return;
    
    try {
      const response = await fetch(posterUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invite-poster-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(i18n.language === 'zh' ? '下载成功' : 'Downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(i18n.language === 'zh' ? '下载失败' : 'Download failed');
    }
  };

  const sharePoster = async () => {
    if (!posterUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: i18n.language === 'zh' ? '约饭邀请' : 'Dinner Invite',
          text: i18n.language === 'zh' ? '快来和我一起约饭吧！' : 'Come join me for dinner!',
          url: posterUrl,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      // Fallback: copy URL
      try {
        await navigator.clipboard.writeText(posterUrl);
        toast.success(i18n.language === 'zh' ? '链接已复制' : 'Link copied');
      } catch (error) {
        toast.error(i18n.language === 'zh' ? '复制失败' : 'Copy failed');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          {i18n.language === 'zh' ? '邀请海报' : 'Invite Poster'}
        </CardTitle>
        <CardDescription>
          {i18n.language === 'zh' 
            ? '生成精美海报分享给好友' 
            : 'Generate beautiful posters to share'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!posterUrl ? (
          <div className="text-center py-8">
            <div className="w-48 h-64 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center border-2 border-dashed border-orange-300">
              <div className="text-center text-muted-foreground">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {i18n.language === 'zh' ? '点击生成海报' : 'Click to generate'}
                </p>
              </div>
            </div>
            <Button 
              onClick={generatePoster} 
              disabled={generating}
              className="mt-4"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {i18n.language === 'zh' ? '生成中...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Image className="w-4 h-4 mr-2" />
                  {i18n.language === 'zh' ? '生成邀请海报' : 'Generate Poster'}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="relative max-w-xs mx-auto mb-4">
              <img 
                src={posterUrl} 
                alt="Invite Poster" 
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={downloadPoster}>
                <Download className="w-4 h-4 mr-2" />
                {i18n.language === 'zh' ? '下载' : 'Download'}
              </Button>
              <Button variant="outline" size="sm" onClick={sharePoster}>
                <Share2 className="w-4 h-4 mr-2" />
                {i18n.language === 'zh' ? '分享' : 'Share'}
              </Button>
              <Button variant="ghost" size="sm" onClick={generatePoster} disabled={generating}>
                <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                {i18n.language === 'zh' ? '重新生成' : 'Regenerate'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
