import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { Home, Search, Plus, User, MessageCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);

  // 获取当前用户
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // 获取未读消息数量
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("id")
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);

      if (!sessions || sessions.length === 0) {
        setUnreadCount(0);
        return;
      }

      const sessionIds = sessions.map(s => s.id);
      
      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: 'exact', head: true })
        .in("session_id", sessionIds)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // 初始化未读消息数量
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  // 实时监听新消息
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('navigation_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const navItems = [
    { icon: Home, label: t('nav.myDinners'), path: "/my-dinners" },
    { icon: Search, label: t('nav.discover'), path: "/discover" },
    { icon: Plus, label: t('dinner.create'), path: "/create-dinner", special: true },
    { icon: MessageCircle, label: t('nav.chat'), path: "/chat-list", hasNotification: unreadCount > 0 },
    { icon: User, label: t('nav.profile'), path: "/profile" },
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
                {item.hasNotification && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full border border-background"></div>
                )}
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
        
        {/* 用户菜单 */}
        <div className="flex-1 max-w-[80px] flex justify-center">
          <UserMenu />
        </div>
      </div>
    </div>
  );
};

export default Navigation;