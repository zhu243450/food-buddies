import React, { useState } from 'react';
import { MediaViewer } from '@/components/MediaViewer';
import { ImageFullscreenViewer } from '@/components/chat/ImageFullscreenViewer';
import { LocationMessage } from '@/components/chat/LocationMessage';
import { MessageRecall } from '@/components/chat/MessageRecall';
import type { User } from '@supabase/supabase-js';

interface MessageWithProfile {
  id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'location';
  sender_id: string;
  created_at: string;
  sender?: {
    nickname: string;
    avatar_url?: string;
  } | null;
}

interface ChatMessageProps {
  message: MessageWithProfile;
  user: User;
  formatTime: (timestamp: string) => string;
  onRecall?: (messageId: string) => void;
}

export function ChatMessage({ message, user, formatTime, onRecall }: ChatMessageProps) {
  const isOwn = message.sender_id === user?.id;
  const [showFullscreen, setShowFullscreen] = useState(false);

  const handleRecall = (messageId: string) => {
    if (onRecall) {
      onRecall(messageId);
    }
  };

  const renderContent = () => {
    // 已撤回的消息
    if (message.content === '[消息已撤回]') {
      return (
        <div className={`rounded-lg px-3 py-2 ${
          isOwn ? "bg-muted/50" : "bg-muted/50"
        }`}>
          <p className="text-sm text-muted-foreground italic">消息已撤回</p>
        </div>
      );
    }

    // 位置消息
    if (message.message_type === 'location') {
      return <LocationMessage content={message.content} isOwn={isOwn} />;
    }

    // 图片消息
    if (message.message_type === 'image') {
      const bucketName = 'chat-images';
      return (
        <>
          <div 
            className="max-w-xs cursor-pointer"
            onClick={() => setShowFullscreen(true)}
          >
            <MediaViewer
              url={message.content}
              mediaType="image"
              alt="聊天图片"
              className="rounded-lg overflow-hidden max-h-48"
              bucketName={bucketName}
            />
          </div>
          <ImageFullscreenViewer
            isOpen={showFullscreen}
            onClose={() => setShowFullscreen(false)}
            imageUrl={message.content}
            bucketName={bucketName}
          />
        </>
      );
    }

    // 视频消息
    if (message.message_type === 'video') {
      const bucketName = 'chat-videos';
      return (
        <div className="max-w-xs">
          <MediaViewer
            url={message.content}
            mediaType="video"
            alt="聊天视频"
            className="rounded-lg overflow-hidden cursor-pointer max-h-48"
            bucketName={bucketName}
          />
        </div>
      );
    }
    
    // 文本消息
    return (
      <div
        className={`rounded-lg px-3 py-2 ${
          isOwn
            ? "bg-gradient-primary text-white shadow-sm"
            : "bg-muted text-foreground"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    );
  };

  return (
    <MessageRecall
      messageId={message.id}
      senderId={message.sender_id}
      currentUserId={user.id}
      createdAt={message.created_at}
      content={message.content}
      messageType={message.message_type}
      onRecall={handleRecall}
    >
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
          {renderContent()}
          <p className="text-xs text-muted-foreground mt-1 px-1">
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    </MessageRecall>
  );
}
