import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
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
  const [user, setUser] = useState<User | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSessionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
              .single();

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
        console.error("获取聊天会话失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatSessions();
  }, [user]);

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
          // 重新获取聊天会话数据
          window.location.reload();
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

    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return messageTime.toLocaleDateString('zh-CN', {
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
            <p className="text-muted-foreground">加载聊天中...</p>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">聊天</h1>
        </div>

        {chatSessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">还没有聊天</h3>
              <p className="text-muted-foreground text-sm mb-4">
                参与饭局后就可以和其他成员聊天了
              </p>
              <Button onClick={() => navigate("/discover")}>
                发现饭局
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
                    <div className="relative">
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
                          {session.otherUser?.nickname || "未知用户"}
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
                            {session.lastMessage.sender_id === user?.id && "我: "}
                            {session.lastMessage.content}
                          </>
                        ) : (
                          "还没有消息"
                        )}
                      </p>
                      
                      {isSessionExpired(session) && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          聊天已过期
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
      <Navigation />
    </div>
  );
};

export default ChatList;