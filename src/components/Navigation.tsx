import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Search, Plus, User, Sparkles } from "lucide-react";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "首页", path: "/my-dinners", emoji: "🏠" },
    { icon: Search, label: "发现", path: "/discover", emoji: "🔍" },
    { icon: Plus, label: "发布", path: "/create-dinner", emoji: "➕", special: true },
    { icon: User, label: "我的", path: "/profile", emoji: "👤" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <Card className="bg-gradient-to-r from-card/95 via-background/90 to-card/95 backdrop-blur-xl border-2 border-primary/20 shadow-glow rounded-3xl overflow-hidden">
        <div className="flex items-center justify-center p-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const isSpecial = item.special;
            
            return (
              <div key={item.path} className="relative">
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`
                    relative flex flex-col items-center gap-1 h-auto py-3 px-4 mx-1 rounded-2xl transition-all duration-300 transform
                    ${isSpecial 
                      ? "bg-gradient-accent text-white shadow-glow hover:shadow-xl hover:scale-110 scale-105 w-16 h-16" 
                      : isActive 
                        ? "bg-gradient-primary text-white shadow-lg scale-105" 
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-105"
                    }
                  `}
                >
                  {/* 特殊按钮的装饰 */}
                  {isSpecial && (
                    <>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                      <Sparkles className="absolute -top-2 -left-1 w-3 h-3 text-accent/70 animate-bounce" />
                    </>
                  )}
                  
                  {/* 活跃指示器 */}
                  {isActive && !isSpecial && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-md"></div>
                  )}
                  
                  <div className="flex items-center justify-center">
                    <item.icon className={`${isSpecial ? "w-6 h-6" : "w-5 h-5"}`} />
                  </div>
                  
                  {!isSpecial && (
                    <span className="text-xs font-semibold">{item.label}</span>
                  )}
                </Button>
                
                {/* 特殊按钮的标签 */}
                {isSpecial && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-primary whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* 底部装饰线 */}
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50"></div>
      </Card>
    </div>
  );
};

export default Navigation;