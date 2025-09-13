import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { Home, Search, Plus, MessageCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const fetchTimer = useRef<number>();
  const [renderKey, setRenderKey] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // 监听语言变化，强制重新渲染
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setRenderKey(prev => prev + 1);
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  // 获取当前用户
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);
      } catch (error) {
        console.error('Failed to get user:', error);
        setUser(null);
      }
    };
    getUser();
    
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // 获取未读消息数量（使用已缓存的会话ID）
  const fetchUnreadCount = useCallback(async (ids?: string[]) => {
    if (!user) return;
    const targetIds = ids ?? sessionIds;
    if (!targetIds || targetIds.length === 0) {
      setUnreadCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from("chat_messages")
        .select("*", { count: 'exact', head: true })
        .in("session_id", targetIds)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
      // 网络错误时保持现有状态，不重置计数
    }
  }, [user, sessionIds]);

  // 初始化未读消息数量
  useEffect(() => {
    if (!user) {
      setSessionIds([]);
      setUnreadCount(0);
      return;
    }
    
    let cancelled = false;
    const loadSessions = async () => {
      try {
        const { data: sessions, error } = await supabase
          .from("chat_sessions")
          .select("id")
          .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);
          
        if (error) throw error;
        if (cancelled) return;
        
        const ids = (sessions || []).map((s) => s.id);
        setSessionIds(ids);
        if (ids.length === 0) {
          setUnreadCount(0);
        } else {
          fetchUnreadCount(ids);
        }
      } catch (e) {
        console.error("Error loading sessions:", e);
        if (!cancelled) {
          setSessionIds([]);
          setUnreadCount(0);
        }
      }
    };
    loadSessions();
    return () => {
      cancelled = true;
    };
  }, [user, fetchUnreadCount]);

  // 实时监听新消息
  useEffect(() => {
    if (!user || sessionIds.length === 0) return;

    const channel = supabase
      .channel('navigation_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `sender_id=neq.${user.id}` },
        (payload: any) => {
          if (sessionIds.includes(payload.new.session_id)) {
            if (fetchTimer.current) window.clearTimeout(fetchTimer.current);
            fetchTimer.current = window.setTimeout(() => fetchUnreadCount(), 200);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `sender_id=neq.${user.id}` },
        (payload: any) => {
          if (sessionIds.includes(payload.new.session_id)) {
            if (fetchTimer.current) window.clearTimeout(fetchTimer.current);
            fetchTimer.current = window.setTimeout(() => fetchUnreadCount(), 200);
          }
        }
      )
      .subscribe();

    return () => {
      if (fetchTimer.current) window.clearTimeout(fetchTimer.current);
      supabase.removeChannel(channel);
    };
  }, [user, sessionIds, fetchUnreadCount]);

  const handleNavigation = useCallback((path: string) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation failed:', error);
    } finally {
      // 延迟重置导航状态，防止快速连续点击
      setTimeout(() => setIsNavigating(false), 300);
    }
  }, [navigate, isNavigating]);

  const navItems = [
    { icon: Home, label: t('nav.myDinners'), path: "/my-dinners" },
    { icon: Search, label: t('nav.discover'), path: "/discover" },
    { icon: Plus, label: t('dinner.create'), path: "/create-dinner", special: true },
    { icon: MessageCircle, label: t('nav.chat'), path: "/chat-list", hasNotification: unreadCount > 0 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/40" key={`navigation-${renderKey}`}>
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
                console.log(`Navigation clicked: ${item.path}`);
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