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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
          饭搭子
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
          找到你的完美饭搭子，一起享受美食时光
        </p>
        <Button 
          onClick={() => navigate("/auth")} 
          size="lg" 
          style={{ width: '200px', padding: '12px 24px', fontSize: '1.1rem' }}
        >
          开始使用
        </Button>
      </div>
    </div>
  );
};

export default Index;
