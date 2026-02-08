import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Clock, MessageSquareOff } from "lucide-react";

import type { User } from '@supabase/supabase-js';
import type { ChatSession, Profile } from '@/types/database';

interface ChatSessionWithProfile extends ChatSession {
  otherUser?: Profile;
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount?: number;
}

const ChatList = () => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSessionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banInfo, setBanInfo] = useState<{reason?: string; until?: string} | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
    };

    getUser();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const checkBanStatus = async () => {
      try {
        // 检查用户是否被禁言
        const { data: isBannedResult, error: banCheckError } = await supabase.rpc('is_user_banned', {
          user_id_param: user.id
        });

        if (banCheckError) {
          console.error('Ban check failed:', banCheckError);
        } else if (isBannedResult === true) {
          setIsBanned(true);
          
          // 获取禁言详细信息
          const { data: profile } = await supabase
            .from('profiles')
            .select('ban_reason, banned_until')
            .eq('user_id', user.id)
            .single();
          
          if (profile) {
            setBanInfo({
              reason: profile.ban_reason,
              until: profile.banned_until
            });
          }
        } else {
          setIsBanned(false);
          setBanInfo(null);
        }
      } catch (error) {
        console.error('Failed to check ban status:', error);
      }
    };

    checkBanStatus();

    const fetchChatSessions = async () => {
      try {
        // 获取用户的聊天会话
        const { data: sessions, error: sessionsError } = await supabase
          .from("chat_sessions")
          .select("*")
          .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
          .order("updated_at", { ascending: false });

        if (sessionsError) throw sessionsError;

        // 为每个会话获取对方用户信息和最后一条消息
        const sessionsWithData = await Promise.all(
          (sessions || []).map(async (session) => {
            const otherUserId = session.participant1_id === user.id 
              ? session.participant2_id 
              : session.participant1_id;

            // 获取对方用户资料
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", otherUserId)
              .single();

            // 获取最后一条消息
            const { data: lastMessage } = await supabase
              .from("chat_messages")
              .select("content, created_at, sender_id")
              .eq("session_id", session.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            // 获取未读消息数量
            const { count: unreadCount } = await supabase
              .from("chat_messages")
              .select("*", { count: "exact", head: true })
              .eq("session_id", session.id)
              .neq("sender_id", user.id)
              .eq("is_read", false);

            return {
              ...session,
              otherUser: profile,
              lastMessage,
              unreadCount: unreadCount || 0
            };
          })
        );

        setChatSessions(sessionsWithData);
      } catch (error) {
        console.error("Failed to fetch chat sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatSessions();
  }, [user]);

  // 增量刷新聊天会话数据（不整页刷新）
  const refreshChatSessions = async () => {
    if (!user) return;
    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from("chat_sessions")
        .select("*")
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      const sessionsWithData = await Promise.all(
        (sessions || []).map(async (session) => {
          const otherUserId = session.participant1_id === user.id 
            ? session.participant2_id 
            : session.participant1_id;

          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", otherUserId)
            .single();

          const { data: lastMessage } = await supabase
            .from("chat_messages")
            .select("content, created_at, sender_id")
            .eq("session_id", session.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("session_id", session.id)
            .neq("sender_id", user.id)
            .eq("is_read", false);

          return {
            ...session,
            otherUser: profile,
            lastMessage,
            unreadCount: unreadCount || 0
          };
        })
      );

      setChatSessions(sessionsWithData);
    } catch (error) {
      console.error("Failed to refresh chat sessions:", error);
    }
  };

  // 实时监听新消息和会话更新
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          // 增量刷新，不整页刷新
          refreshChatSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const formatLastMessageTime = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    const locale = i18n.language === 'zh' ? 'zh-CN' : 'en-US';

    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return messageTime.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const isSessionExpired = (session: ChatSessionWithProfile) => {
    return session.can_chat_until && new Date(session.can_chat_until) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-muted-foreground">{t('chat.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">{t('nav.chat')}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (!user) return;
              
              try {
                const { data, error } = await supabase.rpc('delete_expired_chats', {
                  user_id_param: user.id
                });
                
                if (error) throw error;
                
                toast({
                  title: t('chat.cleanupComplete'),
                  description: t('chat.cleanupDesc', { count: data || 0 }),
                });
                
                // 增量刷新聊天列表
                refreshChatSessions();
              } catch (error: any) {
                toast({
                  title: t('chat.cleanupFailed'),
                  description: error.message,
                  variant: "destructive",
                });
              }
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            {t('chat.deleteExpired')}
          </Button>
        </div>

        {/* 禁言提示 */}
        {isBanned && (
          <Alert className="mb-6 border-destructive bg-destructive/10">
            <MessageSquareOff className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <div className="font-medium mb-1">您的账户已被禁言</div>
              {banInfo?.reason && (
                <div className="text-sm mb-1">原因: {banInfo.reason}</div>
              )}
              {banInfo?.until ? (
                <div className="text-sm">
                  禁言至: {new Date(banInfo.until).toLocaleString('zh-CN')}
                </div>
              ) : (
                <div className="text-sm">永久禁言</div>
              )}
              <div className="text-sm mt-1 text-muted-foreground">
                在禁言期间，您无法发送消息。如有疑问请联系管理员。
              </div>
            </AlertDescription>
          </Alert>
        )}

        {chatSessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">{t('chat.noChats')}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {t('chat.noChatsDesc')}
              </p>
              <Button onClick={() => navigate("/discover")}>
                {t('nav.discover')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {chatSessions.map((session) => (
              <Card 
                key={session.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSessionExpired(session) ? 'opacity-60' : ''
                }`}
                onClick={() => navigate(`/chat/${session.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="relative cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation(); // 阻止卡片的点击事件
                        if (session.otherUser?.user_id) {
                          navigate(`/user/${session.otherUser.user_id}`);
                        }
                      }}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={session.otherUser?.avatar_url || ""} 
                          alt={session.otherUser?.nickname || "用户"} 
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {session.otherUser?.nickname?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {session.unreadCount! > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                          {session.unreadCount! > 9 ? '9+' : session.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {session.otherUser?.nickname || t('myDinners.unknownUser')}
                        </h3>
                        <div className="flex items-center gap-1">
                          {isSessionExpired(session) && (
                            <Clock className="w-3 h-3 text-muted-foreground" />
                          )}
                          {session.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatLastMessageTime(session.lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">
                        {session.lastMessage ? (
                          <>
                            {session.lastMessage.sender_id === user?.id && t('myDinners.me')}
                            {session.lastMessage.content}
                          </>
                        ) : (
                          t('myDinners.noMessages')
                        )}
                      </p>
                      
                      {isSessionExpired(session) && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {t('myDinners.chatExpired')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
};

export default ChatList;