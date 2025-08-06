import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

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
        <h1 className="text-5xl font-bold text-foreground mb-4">饭搭子</h1>
        <p className="text-xl text-muted-foreground mb-8">
          找到你的完美饭搭子，一起享受美食时光
        </p>
        <Button 
          onClick={() => navigate("/auth")} 
          size="lg" 
          className="w-48 h-12 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          开始使用
        </Button>
      </div>
    </div>
  );
};

export default Index;
