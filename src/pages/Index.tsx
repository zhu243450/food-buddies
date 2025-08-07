import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Index页面认证状态变化:', { event, session });
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('用户已登录，重定向到my-dinners');
          navigate("/my-dinners", { replace: true });
        }
        setLoading(false);
      }
    );

    // 检查当前会话
    const checkUser = async () => {
      console.log('Index页面检查用户会话');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('当前会话:', session);
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('用户已登录，重定向到my-dinners');
        navigate("/my-dinners", { replace: true });
      }
      setLoading(false);
    };

    checkUser();

    return () => subscription.unsubscribe();
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
    <div className="min-h-screen flex items-center justify-center bg-background p-5">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-5xl font-bold text-foreground mb-4">{t('about.title')}</h1>
        <p className="text-xl text-muted-foreground mb-8">
          {t('about.subtitle')}
        </p>
        <Button 
          onClick={() => navigate("/auth")} 
          size="lg" 
          className="w-48 h-12 text-lg font-semibold bg-primary text-black hover:bg-primary/90 hover:text-black transition-colors"
        >
          {t('common.getStarted')}
        </Button>
      </div>
    </div>
  );
};

export default Index;
