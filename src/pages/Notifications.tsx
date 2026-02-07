import { useState, useEffect } from 'react';
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

const Notifications = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

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
    
    // 根据通知类型跳转到相应页面
    if (notification.category === 'dinner_cancelled' && notification.related_dinner_id) {
      navigate('/my-dinners');
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <>
      <SEO
        title="通知中心 - 饭约社"
        description="查看您的饭局通知、消息提醒和系统更新"
        keywords="通知,消息,饭局提醒,系统更新"
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
                      navigate('/my-dinners');
                    }
                  } catch {
                    navigate('/my-dinners');
                  }
                }}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">通知中心</h1>
                {unreadCount > 0 && (
                  <p className="text-muted-foreground text-sm">
                    您有 {unreadCount} 条未读通知
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
                全部已读
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
              全部通知 ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              未读通知 ({unreadCount})
            </Button>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">加载中...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">
                  {filter === 'unread' ? '暂无未读通知' : '暂无通知'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {filter === 'unread' 
                    ? '您已查看了所有通知'
                    : '当有新的饭局消息时，我们会通知您'
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
                              locale: zhCN,
                            })}
                          </span>
                          {notification.category && (
                            <Badge variant="secondary" className="text-xs">
                              {notification.category === 'dinner_cancelled' && '饭局取消'}
                              {notification.category === 'dinner_updated' && '饭局更新'}
                              {notification.category === 'chat_message' && '聊天消息'}
                              {notification.category === 'general' && '系统通知'}
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