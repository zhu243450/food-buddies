import React from 'react';
import { EvidenceImageViewer } from '@/components/EvidenceImageViewer';
import type { User } from '@supabase/supabase-js';

interface MessageWithProfile {
  id: string;
  content: string;
  message_type: 'text' | 'image';
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
}

export function ChatMessage({ message, user, formatTime }: ChatMessageProps) {
  const isOwn = message.sender_id === user?.id;

  const renderContent = () => {
    if (message.message_type === 'image') {
      return (
        <div className="max-w-xs">
          <EvidenceImageViewer
            url={message.content}
            alt="聊天图片"
            className="rounded-lg overflow-hidden cursor-pointer"
            onClick={() => window.open(message.content, '_blank')}
            bucketName="chat-images"
          />
        </div>
      );
    }
    
    return (
      <div
        className={`rounded-lg px-3 py-2 ${
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    );
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
        {renderContent()}
        <p className="text-xs text-muted-foreground mt-1 px-1">
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}