import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MessageCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChatImageUploader } from "@/components/ChatImageUploader";
import { ChatMessage } from "@/components/ChatMessage";
import { EvidenceImageViewer } from "@/components/EvidenceImageViewer";
import type { User } from '@supabase/supabase-js';
import type { ChatSession, ChatMessage as ChatMessageType, Profile } from '@/types/database';

interface MessageWithProfile extends ChatMessageType {
  sender?: Profile;
  message_type: 'text' | 'image'; // 明确定义消息类型
}

const Chat = () => {
  const { t } = useTranslation();
  const { sessionId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [session, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    if (!user || !sessionId) {
      setLoading(false);
      return;
    }

    const fetchChatData = async () => {
      try {
        // 获取聊天会话
        const { data: sessionData, error: sessionError } = await supabase
          .from("chat_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (sessionError) throw sessionError;
        setChatSession(sessionData);

        // 确定对方用户ID
        const otherUserId = sessionData.participant1_id === user.id 
          ? sessionData.participant2_id 
          : sessionData.participant1_id;

        // 获取对方用户资料
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", otherUserId)
          .maybeSingle();

        if (profileError) throw profileError;
        setOtherUser(profileData);

        // 获取聊天消息
        const { data: messagesData, error: messagesError } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (messagesError) throw messagesError;

        // 获取所有发送者的profile信息
        const senderIds = [...new Set(messagesData?.map(msg => msg.sender_id) || [])];
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", senderIds);

        if (profilesError) throw profilesError;

        // 合并消息和profile数据
        const messagesWithProfiles = messagesData?.map(message => ({
          ...message,
          message_type: (message.message_type || 'text') as 'text' | 'image',
          sender: profilesData?.find(profile => profile.user_id === message.sender_id) || null
        })) || [];

        setMessages(messagesWithProfiles);

        // 标记消息为已读
        await supabase
          .from("chat_messages")
          .update({ is_read: true })
          .eq("session_id", sessionId)
          .neq("sender_id", user.id);

      } catch (error: any) {
        toast({
          title: t('chat.loadFailed'),
          description: error.message,
          variant: "destructive",
        });
        navigate("/my-dinners");
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [user, sessionId, navigate, toast, t]);

  // 实时监听新消息
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessageType;
          
          // 获取发送者资料
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", newMessage.sender_id)
            .maybeSingle();

          const messageWithProfile: MessageWithProfile = {
            ...newMessage,
            message_type: (newMessage.message_type || 'text') as 'text' | 'image',
            sender: senderProfile
          };

          setMessages(prev => [...prev, messageWithProfile]);

          // 如果不是自己发的消息，标记为已读
          if (newMessage.sender_id !== user?.id) {
            await supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("id", newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, user?.id]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (messageType: 'text' | 'image' = 'text', content?: string) => {
    const messageContent = content || newMessage.trim();
    if (!messageContent || !user || !sessionId) return;

    setSending(true);
    try {
      // 检查用户是否被禁言
      const { data: banCheckResult, error: banCheckError } = await supabase.rpc('is_user_banned', {
        user_id_param: user.id
      });

      if (banCheckError) {
        console.error('Ban check failed:', banCheckError);
        // 如果检查失败，仍然允许发送（避免因为检查错误影响正常用户）
      } else if (banCheckResult === true) {
        // 用户被禁言，阻止发送消息
        toast({
          title: "无法发送消息",
          description: "您的账户已被禁言，暂时无法发送消息。如有疑问请联系管理员。",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      const { error } = await supabase
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          sender_id: user.id,
          content: messageContent,
          message_type: messageType
        });

      if (error) throw error;
      
      if (messageType === 'text') {
        setNewMessage("");
      } else {
        setPendingImageUrl(null);
        if (newMessage.trim()) {
          setNewMessage("");
        }
      }
    } catch (error: any) {
      toast({
        title: t('chat.sendFailed'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage('text');
    }
  };

  const handleImageUploaded = (imageUrl: string) => {
    setPendingImageUrl(imageUrl);
  };

  const handleSendImage = () => {
    if (pendingImageUrl) {
      // 如果有文字说明，将图片URL和文字组合发送
      if (newMessage.trim()) {
        handleSendMessage('image', pendingImageUrl);
        // 发送文字说明作为单独的消息
        setTimeout(() => {
          handleSendMessage('text', newMessage.trim());
        }, 100);
      } else {
        handleSendMessage('image', pendingImageUrl);
      }
    }
  };

  const { i18n } = useTranslation();
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-muted-foreground">{t('chat.loading')}</p>
        </div>
      </div>
    );
  }

  if (!session || !otherUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-6">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t('chat.notFound')}</h2>
            <p className="text-muted-foreground mb-4">{t('chat.notFoundDesc')}</p>
            <Button onClick={() => navigate("/my-dinners")}>
              {t('common.back')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = session.can_chat_until && new Date(session.can_chat_until) < new Date();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 聊天头部 */}
      <Card className="rounded-none border-b">
        <CardHeader className="flex flex-row items-center gap-3 py-3 px-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/my-dinners")}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherUser.avatar_url || ""} alt={otherUser.nickname} />
            <AvatarFallback className="text-sm bg-primary/10 text-primary">
              {otherUser.nickname[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-base">{otherUser.nickname}</CardTitle>
            {isExpired && (
              <Badge variant="destructive" className="text-xs mt-1">
                {t('chat.expired')}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-180px)]">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t('chat.noMessages')}</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              user={user}
              formatTime={formatTime}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <Card className="rounded-none border-t">
        <CardContent className="p-4">
          {isExpired ? (
            <div className="text-center py-2">
              <Badge variant="destructive">
                {t('chat.expiredCannotSend')}
              </Badge>
            </div>
          ) : (
            <div className="space-y-2">
              {/* 待发送图片预览 */}
              {pendingImageUrl && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 rounded overflow-hidden">
                    <EvidenceImageViewer
                      url={pendingImageUrl}
                      alt="待发送图片"
                      className="w-full h-full"
                      bucketName="chat-images"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">图片已准备发送</p>
                    <p className="text-xs text-muted-foreground">点击发送按钮或选择取消</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingImageUrl(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* 输入框区域 */}
              <div className="flex gap-2">
                <ChatImageUploader
                  userId={user.id}
                  onImageUploaded={handleImageUploaded}
                  disabled={sending}
                />
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={pendingImageUrl ? "添加文字说明（可选）" : t('chat.inputPlaceholder')}
                  className="flex-1"
                  disabled={sending}
                />
                {pendingImageUrl ? (
                  <Button
                    onClick={handleSendImage}
                    disabled={sending}
                    size="sm"
                    className="px-4"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSendMessage('text')}
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                    className="px-4"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;