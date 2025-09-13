import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { SEO } from "@/components/SEO";
import { useSEO } from "@/hooks/useSEO";
import { CampaignBanner } from "@/components/CampaignBanner";
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  const { user, loading } = useAuth();

  const seoData = getPageSEO('home');

  // 用户已登录时自动重定向
  useEffect(() => {
    if (!loading && user) {
      navigate("/my-dinners", { replace: true });
    }
  }, [user, loading, navigate]);

  // 如果还在加载或用户已登录，显示加载状态
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <div className="text-lg">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO {...seoData} />
      <div className="min-h-screen bg-background">
        {/* Campaign Banner */}
        <div className="container mx-auto px-4 pt-6">
          <CampaignBanner className="mb-8" />
        </div>
        
        {/* Main Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-5">
          <div className="text-center space-y-8 max-w-lg">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">{t('about.title')}</h1>
              <p className="text-lg text-muted-foreground">
                {t('about.subtitle')}
              </p>
            </div>
            
            {/* Auth Actions */}
            <div className="space-y-4">
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => navigate("/auth")} 
                  size="lg" 
                  className="flex-1 max-w-[140px] h-12 text-lg font-semibold bg-primary text-black hover:bg-primary/90 hover:text-black transition-colors"
                >
                  {t('auth.signIn')}
                </Button>
                <Button 
                  onClick={() => navigate("/auth")} 
                  size="lg" 
                  variant="outline"
                  className="flex-1 max-w-[140px] h-12 text-lg font-semibold border-primary text-primary hover:bg-primary/10 transition-colors"
                >
                  {t('auth.signUp')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('myDinners.joinNow')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
