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
      <Card className="bg-card border-2 border-primary/30 shadow-xl rounded-3xl overflow-hidden">
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
                      ? "bg-accent text-black shadow-lg hover:shadow-xl hover:scale-105 w-16 h-16 border-2 border-accent/50 font-bold" 
                      : isActive 
                        ? "bg-primary text-black shadow-lg scale-105 border-2 border-primary font-bold" 
                        : "text-primary bg-primary/10 hover:text-black hover:bg-primary hover:scale-105 border-2 border-primary/50 hover:border-primary font-semibold"
                    }
                  `}
                >
                  {/* 活跃指示器 */}
                  {isActive && !isSpecial && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-md"></div>
                  )}
                  
                  <div className="flex items-center justify-center">
                    <item.icon className="w-5 h-5" />
                  </div>
                  
                  {!isSpecial && (
                    <span className="text-xs font-semibold">{item.label}</span>
                  )}
                </Button>
                
                {/* 特殊按钮的标签 */}
                {isSpecial && (
                  <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-primary whitespace-nowrap">
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