import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Bell, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Shield,
  HelpCircle,
  MapPin,
  BookOpen,
  Gift
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

export const UserMenu = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { unreadCount } = useNotifications();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingReports, setPendingReports] = useState(0);
  const [renderKey, setRenderKey] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const loadingRef = useRef(false);

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

  // 获取用户配置文件和管理员状态
  useEffect(() => {
    if (!user || loadingRef.current) return;
    
    loadingRef.current = true;
    
    const getProfile = async () => {
      try {
        // 获取用户资料
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setProfile(profileData);

        // 检查是否是管理员
        const { data: adminCheck } = await supabase
          .rpc('has_role', { 
            _user_id: user.id, 
            _role: 'admin' 
          });
        
        const isAdminUser = adminCheck || false;
        setIsAdmin(isAdminUser);

        // 如果是管理员，获取待处理举报数量
        if (isAdminUser) {
          try {
            const { data: reportsData } = await supabase
              .from('reports')
              .select('id')
              .eq('status', 'pending');
            
            setPendingReports(reportsData?.length || 0);
          } catch (error) {
            console.error('Error loading reports:', error);
            setPendingReports(0);
          }
        }
      } catch (error) {
        console.error('获取用户配置文件失败:', error);
      } finally {
        loadingRef.current = false;
      }
    };

    getProfile();
  }, [user?.id]);

  // 管理员实时监听新举报
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-reports-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        () => {
          setPendingReports((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports' },
        (payload) => {
          const newReport = payload.new as any;
          const oldReport = payload.old as any;
          if (oldReport.status === 'pending' && newReport.status !== 'pending') {
            setPendingReports((prev) => Math.max(0, prev - 1));
          } else if (oldReport.status !== 'pending' && newReport.status === 'pending') {
            setPendingReports((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const handleLogout = useCallback(async () => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    try {
      await signOut();
      setIsOpen(false);
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setTimeout(() => setIsNavigating(false), 500);
    }
  }, [signOut, navigate, isNavigating]);

  const handleMenuItemClick = useCallback((path: string) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    try {
      setIsOpen(false);
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setTimeout(() => setIsNavigating(false), 300);
    }
  }, [navigate, isNavigating]);

  if (!user) return null;

  return (
    <div className="relative" key={`user-menu-${renderKey}`}>
      <Button 
        variant="ghost" 
        className="flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-xl transition-all duration-200 min-w-0 flex-1 max-w-[80px] text-muted-foreground hover:text-foreground hover:bg-accent/50"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isNavigating) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={isNavigating}
      >
        <div className="relative">
          <Avatar className="h-5 w-5">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-xs">
              {profile?.nickname?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {(unreadCount > 0 || (isAdmin && pendingReports > 0)) && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full border border-background"></div>
          )}
        </div>
        <span className="text-xs font-medium truncate w-full text-center">{t('userMenu.mine')}</span>
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 w-56 bg-background/95 backdrop-blur-sm border border-border/50 rounded-md shadow-xl z-50 p-2">
            <div className="font-normal p-2 border-b">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.nickname || t('userMenu.user')}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            
            <div className="py-2">
              <button 
                onClick={() => handleMenuItemClick('/profile')}
                className="flex items-center w-full px-2 py-2 text-sm hover:bg-accent rounded"
              >
                <User className="mr-2 h-4 w-4" />
                <span>{t('userMenu.profile')}</span>
              </button>
              
              <button 
                onClick={() => handleMenuItemClick('/notifications')}
                className="flex items-center w-full px-2 py-2 text-sm hover:bg-accent rounded"
              >
                <Bell className="mr-2 h-4 w-4" />
                <span>{t('userMenu.notifications')}</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto h-5 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </button>
              
              <button 
                onClick={() => handleMenuItemClick('/feedback')}
                className="flex items-center w-full px-2 py-2 text-sm hover:bg-accent rounded"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>{t('userMenu.feedback')}</span>
              </button>
              
              <button 
                onClick={() => handleMenuItemClick('/help')}
                className="flex items-center w-full px-2 py-2 text-sm hover:bg-accent rounded"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>{t('userMenu.help')}</span>
              </button>
            </div>
            
            <div className="border-t py-2">
              <button 
                onClick={() => handleMenuItemClick('/faq')}
                className="flex items-center w-full px-2 py-2 text-sm hover:bg-accent rounded"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                <span>{t('userMenu.faq')}</span>
              </button>
              <button 
                onClick={() => handleMenuItemClick('/growth')}
                className="flex items-center w-full px-2 py-2 text-sm hover:bg-accent rounded"
              >
                <Gift className="mr-2 h-4 w-4" />
                <span>{i18n.language === 'zh' ? '增长中心' : 'Growth Center'}</span>
              </button>
            </div>
            
            {isAdmin && (
              <div className="border-t py-2">
                <button 
                  onClick={() => handleMenuItemClick('/admin')}
                  className="flex items-center w-full px-2 py-2 text-sm hover:bg-accent rounded"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  <span>{t('userMenu.admin')}</span>
                  {pendingReports > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 text-xs">
                      {pendingReports}
                    </Badge>
                  )}
                </button>
              </div>
            )}
            
            <div className="border-t py-2">
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-2 py-2 text-sm hover:bg-accent rounded"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('userMenu.logout')}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};