import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Check, CheckCheck, Calendar, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';

const Notifications = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Auth guard
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  const getNotificationIcon = (type: string, category: string) => {
    if (category === 'dinner_cancelled') {
      return <AlertTriangle className="w-5 h-5 text-warning" />;
    }
    
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'success':
        return <Check className="w-5 h-5 text-success" />;
      default:
        return <Info className="w-5 h-5 text-info" />;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.category === 'dinner_cancelled' && notification.related_dinner_id) {
      navigate('/discover?tab=myDinners');
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'dinner_cancelled': return t('notifications.categoryDinnerCancelled');
      case 'dinner_updated': return t('notifications.categoryDinnerUpdated');
      case 'chat_message': return t('notifications.categoryChatMessage');
      case 'general': return t('notifications.categoryGeneral');
      default: return category;
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const dateLocale = i18n.language === 'zh' ? { locale: zhCN } : {};

  return (
    <>
      <SEO
        title={t('notifications.seoTitle')}
        description={t('notifications.seoDescription')}
        keywords={t('notifications.seoKeywords')}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  try {
                    if (document.referrer && document.referrer !== window.location.href) {
                      navigate(-1);
                    } else {
                      navigate('/discover?tab=myDinners');
                    }
                  } catch {
                    navigate('/discover?tab=myDinners');
                  }
                }}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
                {unreadCount > 0 && (
                  <p className="text-muted-foreground text-sm">
                    {t('notifications.unreadCount', { count: unreadCount })}
                  </p>
                )}
              </div>
            </div>
            
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllAsRead}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                {t('notifications.markAllRead')}
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              {t('notifications.allNotifications')} ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              {t('notifications.unreadNotifications')} ({unreadCount})
            </Button>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">
                  {filter === 'unread' ? t('notifications.noUnread') : t('notifications.noNotifications')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {filter === 'unread' 
                    ? t('notifications.allRead')
                    : t('notifications.willNotify')
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.is_read ? 'ring-1 ring-primary/20 bg-accent/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type || 'info', notification.category || 'general')}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!notification.is_read) {
                                  markAsRead(notification.id);
                                }
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              ...dateLocale,
                            })}
                          </span>
                          {notification.category && (
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryLabel(notification.category)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;