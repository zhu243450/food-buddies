import { useState, useEffect, useRef, useCallback } from "react";
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
import { ChatMediaUploader } from "@/components/ChatMediaUploader";
import { ChatMessage } from "@/components/ChatMessage";
import { EvidenceImageViewer } from "@/components/EvidenceImageViewer";
import { MultiImageUploader } from "@/components/chat/MultiImageUploader";
import { LocationPicker, LocationData } from "@/components/chat/LocationPicker";
import { useAuth } from '@/contexts/AuthContext';
import type { ChatSession, ChatMessage as ChatMessageType, Profile } from '@/types/database';

interface MessageWithProfile extends ChatMessageType {
  sender?: Profile;
  message_type: 'text' | 'image' | 'video' | 'location';
}

const Chat = () => {
  const { t } = useTranslation();
  const { sessionId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [session, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [pendingMediaUrl, setPendingMediaUrl] = useState<string | null>(null);
  const [pendingMediaType, setPendingMediaType] = useState<'image' | 'video' | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasFetchedRef = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !sessionId || hasFetchedRef.current) {
      if (!sessionId) setLoading(false);
      return;
    }

    hasFetchedRef.current = true;

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
          message_type: message.message_type as 'text' | 'image' | 'video' | 'location',
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
        console.error('fetchChatData error:', error);
        toast({
          title: t('chat.loadFailed'),
          description: error.message,
          variant: "destructive",
        });
        navigate("/discover?tab=myDinners");
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [user, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 实时监听新消息和消息更新
  useEffect(() => {
    if (!sessionId || !user) return;

    const channel = supabase
      .channel(`chat:${sessionId}`)
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
            message_type: (newMessage.message_type || 'text') as 'text' | 'image' | 'video' | 'location',
            sender: senderProfile
          };

          setMessages(prev => {
            // 如果消息 ID 已存在（包括乐观消息被替换的情况），用真实数据替换
            const existingIndex = prev.findIndex(m => m.id === messageWithProfile.id);
            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = messageWithProfile;
              return updated;
            }
            
            // 如果是自己发的消息，可能有乐观消息需要替换（ID 以 optimistic- 开头）
            if (newMessage.sender_id === user.id) {
              const optimisticIndex = prev.findIndex(m => 
                m.id.startsWith('optimistic-') && 
                m.sender_id === newMessage.sender_id && 
                m.content === newMessage.content
              );
              if (optimisticIndex !== -1) {
                const updated = [...prev];
                updated[optimisticIndex] = messageWithProfile;
                return updated;
              }
            }
            
            return [...prev, messageWithProfile];
          });

          // 如果不是自己发的消息，标记为已读
          if (newMessage.sender_id !== user.id) {
            await supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("id", newMessage.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessageType;
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id 
              ? { ...msg, content: updatedMessage.content, message_type: (updatedMessage.message_type || 'text') as 'text' | 'image' | 'video' | 'location' }
              : msg
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, user]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = useCallback(async (messageType: 'text' | 'image' | 'video' | 'location' = 'text', content?: string) => {
    const messageContent = content || newMessage.trim();
    if (!messageContent || !user || !sessionId) {
      console.log('[Chat] handleSendMessage blocked:', { hasContent: !!messageContent, hasUser: !!user, sessionId });
      return;
    }

    setSending(true);
    try {
      // 检查用户是否被禁言
      const { data: banCheckResult, error: banCheckError } = await supabase.rpc('is_user_banned', {
        user_id_param: user.id
      });

      if (banCheckError) {
        console.error('[Chat] Ban check failed:', banCheckError);
      } else if (banCheckResult === true) {
        toast({
          title: t('chat.bannedTitle'),
          description: t('chat.bannedDesc'),
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      // 先构建乐观消息
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: MessageWithProfile = {
        id: optimisticId,
        session_id: sessionId,
        sender_id: user.id,
        content: messageContent,
        message_type: messageType,
        is_read: false,
        created_at: new Date().toISOString(),
        sender: undefined,
      };

      // 立即在 UI 中显示消息
      setMessages(prev => {
        console.log('[Chat] Adding optimistic message, prev count:', prev.length);
        return [...prev, optimisticMessage];
      });

      const { data: insertedMessage, error } = await supabase
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          sender_id: user.id,
          content: messageContent,
          message_type: messageType
        })
        .select()
        .single();

      if (error) {
        console.error('[Chat] Insert failed:', error);
        // 插入失败，移除乐观消息
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        throw error;
      }

      console.log('[Chat] Insert success, real ID:', insertedMessage?.id);

      // 用真实数据替换乐观消息
      if (insertedMessage) {
        const realMessage: MessageWithProfile = {
          ...insertedMessage,
          message_type: (insertedMessage.message_type || 'text') as 'text' | 'image' | 'video' | 'location',
          sender: undefined,
        };
        setMessages(prev => {
          const updated = prev.map(m => m.id === optimisticId ? realMessage : m);
          console.log('[Chat] Replaced optimistic with real, count:', updated.length);
          return updated;
        });
      }
      
      if (messageType === 'text') {
        setNewMessage("");
      } else {
        setPendingMediaUrl(null);
        setPendingMediaType(null);
        if (newMessage.trim()) {
          setNewMessage("");
        }
      }
    } catch (error: any) {
      console.error('[Chat] Send error:', error);
      toast({
        title: t('chat.sendFailed'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }, [newMessage, user, sessionId, toast, t]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage('text');
    }
  };

  const handleMediaUploaded = (mediaUrl: string, mediaType: 'image' | 'video') => {
    setPendingMediaUrl(mediaUrl);
    setPendingMediaType(mediaType);
  };

  const handleSendMedia = () => {
    if (pendingMediaUrl && pendingMediaType) {
      if (newMessage.trim()) {
        handleSendMessage(pendingMediaType, pendingMediaUrl);
        setTimeout(() => {
          handleSendMessage('text', newMessage.trim());
        }, 100);
      } else {
        handleSendMessage(pendingMediaType, pendingMediaUrl);
      }
    }
  };

  // 处理多图发送
  const handleMultiImagesUploaded = async (urls: string[]) => {
    for (const url of urls) {
      await handleSendMessage('image', url);
    }
  };

  // 处理位置发送
  const handleLocationSelect = (location: LocationData) => {
    const locationContent = JSON.stringify(location);
    handleSendMessage('location', locationContent);
  };

  // 处理消息撤回
  const handleMessageRecall = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: t('chat.messageRecalled'), message_type: 'text' as const }
        : msg
    ));
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

  if (!session || !otherUser || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-6">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t('chat.notFound')}</h2>
            <p className="text-muted-foreground mb-4">{t('chat.notFoundDesc')}</p>
            <Button onClick={() => navigate("/discover?tab=myDinners")}>
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
            onClick={() => navigate("/chat-list")}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-accent/10 rounded-lg p-2 -ml-2 transition-colors"
               onClick={() => navigate(`/user/${otherUser.user_id}`)}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherUser.avatar_url || ""} alt={otherUser.nickname} />
              <AvatarFallback className="text-sm bg-primary/10 text-primary">
                {otherUser.nickname[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-base hover:text-primary transition-colors">{otherUser.nickname}</CardTitle>
              {isExpired && (
                <Badge variant="destructive" className="text-xs mt-1">
                  {t('chat.expired')}
                </Badge>
              )}
            </div>
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
              onRecall={handleMessageRecall}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <Card className="rounded-none border-t">
        <CardContent className="p-4">
            {isExpired ? (
              <div className="text-center py-3 space-y-2">
                <Badge variant="destructive" className="block mb-2">
                  {t('chat.expiredCannotSend')}
                </Badge>
                <Button
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.rpc('reactivate_chat_session', {
                        session_id_param: sessionId
                      });
                      
                      if (error) throw error;
                      
                       if (data) {
                        toast({
                          title: t('chat.reactivated'),
                          description: t('chat.reactivatedDesc'),
                        });
                        // 重新加载聊天数据而非整页刷新
                        window.location.href = `/chat/${sessionId}`;
                      }
                    } catch (error: any) {
                      toast({
                        title: t('chat.reactivateFailed'),
                        description: error.message,
                        variant: "destructive",
                      });
                    }
                  }}
                  size="sm"
                  variant="outline"
                >
                  {t('chat.reactivateChat')}
                </Button>
              </div>
            ) : (
            <div className="space-y-2">
              {/* 待发送媒体预览 */}
              {pendingMediaUrl && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 rounded overflow-hidden">
                    {pendingMediaType === 'video' ? (
                      <video 
                        src={pendingMediaUrl} 
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <EvidenceImageViewer
                        url={pendingMediaUrl}
                        alt="待发送图片"
                        className="w-full h-full"
                        bucketName="chat-images"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {pendingMediaType === 'video' ? t('chat.videoReady') : t('chat.imageReady')}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('chat.sendOrCancel')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPendingMediaUrl(null);
                      setPendingMediaType(null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* 输入框区域 */}
              <div className="flex gap-2">
                <ChatMediaUploader
                  userId={user.id}
                  onMediaUploaded={handleMediaUploaded}
                  disabled={sending}
                />
                <MultiImageUploader
                  userId={user.id}
                  onImagesUploaded={handleMultiImagesUploaded}
                  disabled={sending}
                />
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  disabled={sending}
                />
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={pendingMediaUrl ? t('chat.addCaptionOptional') : t('chat.inputPlaceholder')}
                  className="flex-1"
                  disabled={sending}
                />
                {pendingMediaUrl ? (
                  <Button
                    onClick={handleSendMedia}
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
