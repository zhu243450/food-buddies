import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuTrigger 
} from '@/components/ui/context-menu';
import { RotateCcw, Copy, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageRecallProps {
  messageId: string;
  senderId: string;
  currentUserId: string;
  createdAt: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'location';
  children: React.ReactNode;
  onRecall: (messageId: string) => void;
}

// 撤回时间限制（2分钟）
const RECALL_TIME_LIMIT = 2 * 60 * 1000;

export function MessageRecall({ 
  messageId, 
  senderId, 
  currentUserId, 
  createdAt, 
  content,
  messageType,
  children, 
  onRecall 
}: MessageRecallProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [recalling, setRecalling] = useState(false);
  const { toast } = useToast();

  const isOwn = senderId === currentUserId;
  const messageTime = new Date(createdAt).getTime();
  const now = Date.now();
  const canRecall = isOwn && (now - messageTime) < RECALL_TIME_LIMIT;
  const remainingTime = Math.max(0, Math.ceil((RECALL_TIME_LIMIT - (now - messageTime)) / 1000));

  const handleRecall = async () => {
    if (!canRecall) {
      toast({
        title: '无法撤回',
        description: '消息发送超过2分钟，无法撤回',
        variant: 'destructive'
      });
      return;
    }

    setRecalling(true);
    try {
      // 更新消息内容为撤回标记
      const { error } = await supabase
        .from('chat_messages')
        .update({ 
          content: '[消息已撤回]',
          message_type: 'text'
        })
        .eq('id', messageId)
        .eq('sender_id', currentUserId);

      if (error) throw error;

      onRecall(messageId);
      toast({
        title: '撤回成功',
        description: '消息已撤回'
      });
    } catch (error: any) {
      toast({
        title: '撤回失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setRecalling(false);
      setShowConfirm(false);
    }
  };

  const handleCopy = () => {
    if (messageType === 'text' && content !== '[消息已撤回]') {
      navigator.clipboard.writeText(content);
      toast({
        title: '已复制',
        description: '消息内容已复制到剪贴板'
      });
    }
  };

  // 如果是已撤回的消息，不显示上下文菜单
  if (content === '[消息已撤回]') {
    return <>{children}</>;
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {messageType === 'text' && (
            <ContextMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              复制文字
            </ContextMenuItem>
          )}
          {canRecall && (
            <ContextMenuItem 
              onClick={() => setShowConfirm(true)}
              className="text-destructive focus:text-destructive"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              撤回消息 ({remainingTime}秒)
            </ContextMenuItem>
          )}
          {isOwn && !canRecall && (
            <ContextMenuItem disabled className="text-muted-foreground">
              <Trash2 className="h-4 w-4 mr-2" />
              已超过撤回时限
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>撤回消息</AlertDialogTitle>
            <AlertDialogDescription>
              确定要撤回这条消息吗？撤回后双方都将看不到原消息内容。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={recalling}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecall} disabled={recalling}>
              {recalling ? '撤回中...' : '确定撤回'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
