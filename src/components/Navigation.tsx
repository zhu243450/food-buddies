import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, Plus, User, MessageCircle } from "lucide-react";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "首页", path: "/my-dinners" },
    { icon: Search, label: "发现", path: "/discover" },
    { icon: Plus, label: "发布", path: "/create-dinner", special: true },
    { icon: MessageCircle, label: "聊天", path: "/chat-list" },
    { icon: User, label: "我的", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/40">
      <div className="flex items-center justify-around max-w-md mx-auto px-4 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isSpecial = item.special;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
              className={`
                flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-xl transition-all duration-200 min-w-0 flex-1 max-w-[80px]
                ${isSpecial 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg scale-110" 
                  : isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }
              `}
            >
              <div className="relative">
                <item.icon className={`${isSpecial ? "w-6 h-6" : "w-5 h-5"}`} />
                {isActive && !isSpecial && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
                )}
              </div>
              
              <span className={`text-xs font-medium truncate w-full text-center ${isSpecial ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;