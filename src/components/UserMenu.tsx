import React, { useState, useEffect } from 'react';
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
  ChefHat,
  MapPin,
  BookOpen
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const UserMenu = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { unreadCount } = useNotifications();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingReports, setPendingReports] = useState(0);
  const [renderKey, setRenderKey] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

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

  useEffect(() => {
    // 获取用户信息
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // 获取用户资料
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          setProfile(profileData);

          // 检查是否是管理员
          const { data: adminCheck } = await supabase
            .rpc('has_role', { 
              _user_id: user.id, 
              _role: 'admin' 
            });
          
          setIsAdmin(adminCheck || false);

          // 如果是管理员，获取待处理举报数量
          if (adminCheck) {
            const { data: reportsData } = await supabase
              .from('reports')
              .select('id')
              .eq('status', 'pending');
            setPendingReports(reportsData?.length || 0);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    getUser();
  }, []);

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMenuItemClick = (path: string) => {
    try {
      setIsOpen(false);
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" key={`user-menu-${renderKey}`}>
      <Button 
        variant="ghost" 
        className="flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-xl transition-all duration-200 min-w-0 flex-1 max-w-[80px] text-muted-foreground hover:text-foreground hover:bg-accent/50"
        onClick={(e) => {
          console.log('UserMenu button clicked!');
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
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
          <div className="absolute bottom-full right-0 mb-2 w-56 bg-background backdrop-blur-sm border rounded-md shadow-lg z-50 p-2">
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
                onClick={() => handleMenuItemClick('/food-guide')}
                className="flex items-center w-full px-2 py-2 text-sm hover:bg-accent rounded"
              >
                <ChefHat className="mr-2 h-4 w-4" />
                <span>美食城市指南</span>
              </button>
              
              <button 
                onClick={() => handleMenuItemClick('/faq')}
                className="flex items-center w-full px-2 py-2 text-sm hover:bg-accent rounded"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                <span>{t('userMenu.faq')}</span>
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