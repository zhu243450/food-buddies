import { useState } from 'react';
import { Bell, Check, CheckCheck, Calendar, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const getNotificationIcon = (type: string, category: string) => {
    if (category === 'dinner_cancelled') {
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    }
    
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'success':
        return <Check className="w-4 h-4 text-success" />;
      default:
        return <Info className="w-4 h-4 text-info" />;
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
    
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative"
        onClick={(e) => {
          console.log('Notification dropdown clicked!');
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-1 w-80 bg-background border rounded-md shadow-lg z-50">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="font-medium">通知</div>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="h-8 px-2"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  全部已读
                </Button>
              )}
            </div>
            <div className="border-t"></div>
            
            <ScrollArea className="h-96">
              {loading ? (
                <div className="px-3 py-4 text-center text-muted-foreground">
                  加载中...
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-3 py-8 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  暂无通知
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      className={`w-full flex flex-col items-start p-3 hover:bg-accent cursor-pointer text-left ${
                        !notification.is_read ? 'bg-accent/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        {getNotificationIcon(notification.type || 'info', notification.category || 'general')}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate">
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: zhCN,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {notifications.length > 0 && (
              <>
                <div className="border-t"></div>
                <button 
                  className="w-full text-center py-3 hover:bg-accent transition-colors"
                  onClick={() => {
                    navigate('/notifications');
                    setIsOpen(false);
                  }}
                >
                  查看全部通知
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};