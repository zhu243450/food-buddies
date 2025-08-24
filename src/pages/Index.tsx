import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { SEO } from "@/components/SEO";
import { useSEO } from "@/hooks/useSEO";
import { CampaignBanner } from "@/components/CampaignBanner";
import type { User } from '@supabase/supabase-js';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const seoData = getPageSEO('home');

  useEffect(() => {
    let isComponentMounted = true;
    
    // 检查当前会话
    const checkUser = async () => {
      try {
        console.log('Index页面检查用户会话');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isComponentMounted) return;
        
        console.log('当前会话:', !!session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('用户已登录，重定向到my-dinners');
          navigate("/my-dinners", { replace: true });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('检查用户会话时出错:', error);
        if (isComponentMounted) {
          setLoading(false);
        }
      }
    };

    // 监听认证状态变化 - 只监听登录事件
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isComponentMounted) return;
        
        console.log('Index页面认证状态变化:', { event, session: !!session });
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('检测到用户登录，重定向');
          navigate("/my-dinners", { replace: true });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    checkUser();

    return () => {
      isComponentMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // 如果正在加载或用户已登录，显示空白页面
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
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
                立即加入饭约社，开始你的美食社交之旅
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
