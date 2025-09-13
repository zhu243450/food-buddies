import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { Home, Search, Plus, MessageCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useAuth } from "@/hooks/useAuth";
import { useNavigationData } from "@/hooks/useNavigationData";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { unreadCount } = useNavigationData(user);
  const [renderKey, setRenderKey] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // 监听语言变化，强制重新渲染
  useEffect(() => {
    const handleLanguageChanged = () => {
      setRenderKey(prev => prev + 1);
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const handleNavigation = useCallback((path: string) => {
    if (isNavigating || location.pathname === path) return;
    
    setIsNavigating(true);
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation failed:', error);
    } finally {
      // 延迟重置导航状态，防止快速连续点击
      setTimeout(() => setIsNavigating(false), 300);
    }
  }, [navigate, isNavigating, location.pathname]);

  // 使用useMemo稳定navItems引用
  const navItems = useMemo(() => [
    { icon: Home, label: t('nav.myDinners'), path: "/my-dinners" },
    { icon: Search, label: t('nav.discover'), path: "/discover" },
    { icon: Plus, label: t('dinner.create'), path: "/create-dinner", special: true },
    { icon: MessageCircle, label: t('nav.chat'), path: "/chat-list", hasNotification: unreadCount > 0 },
  ], [t, unreadCount]);

  // 如果还在加载认证状态，不渲染导航
  if (authLoading) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/40" 
      key={`navigation-${renderKey}`}
    >
      <div className="flex items-center justify-around max-w-md mx-auto px-4 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isSpecial = item.special;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNavigation(item.path);
              }}
              disabled={isNavigating}
              className={
                isSpecial 
                  ? "flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-xl transition-all duration-200 min-w-0 flex-1 max-w-[80px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg scale-110 disabled:opacity-70" 
                  : isActive 
                    ? "flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-xl transition-all duration-200 min-w-0 flex-1 max-w-[80px] text-primary bg-primary/10 font-semibold disabled:opacity-70" 
                    : "flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-xl transition-all duration-200 min-w-0 flex-1 max-w-[80px] text-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-70"
              }
            >
              <div className="relative">
                <item.icon className={`${isSpecial ? "w-6 h-6" : "w-5 h-5"}`} />
                {item.hasNotification && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full border border-background"></div>
                )}
                {isActive && !isSpecial && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
                )}
              </div>
              
              <span className={`text-xs font-medium truncate w-full text-center ${
                isSpecial 
                  ? "font-bold text-primary-foreground" 
                  : isActive 
                    ? "font-semibold text-primary" 
                    : "font-medium text-foreground"
              }`}>
                {item.label}
              </span>
            </Button>
          );
        })}
        
        {/* 用户菜单 */}
        <UserMenu />
      </div>
    </div>
  );
};

export default Navigation;