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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4">饭搭子</h1>
        <p className="text-xl text-muted-foreground">找到你的完美饭搭子，一起享受美食时光</p>
        <div className="space-y-4">
          <Button onClick={() => navigate("/auth")} size="lg" className="w-full max-w-xs">
            开始使用
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
