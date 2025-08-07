import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate("/my-dinners");
      }
    };

    checkUser();
  }, [navigate]);

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
