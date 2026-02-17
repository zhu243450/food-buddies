import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { usePostComments, usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PostCommentsProps {
  postId: string;
}

export function PostComments({ postId }: PostCommentsProps) {
  const { user } = useAuth();
  const { data: comments, isLoading } = usePostComments(postId);
  const { addComment } = usePosts();
  const [input, setInput] = useState('');

  const handleSubmit = async () => {
    if (!input.trim() || !user) return;
    await addComment.mutateAsync({ postId, content: input.trim() });
    setInput('');
  };

  return (
    <div className="border-t border-border/30 bg-muted/30">
      {/* Comment list */}
      <div className="max-h-60 overflow-y-auto px-4 py-2 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : comments?.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">暂无评论，快来说点什么~</p>
        ) : (
          comments?.map(comment => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={comment.profile?.avatar_url || ''} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {comment.profile?.nickname?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-foreground">{comment.profile?.nickname || '用户'}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: zhCN })}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment input */}
      {user && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border/20">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="写评论..."
            className="flex-1 text-sm bg-background rounded-full px-3 py-1.5 border border-border/50 outline-none focus:ring-1 focus:ring-primary/50"
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            disabled={!input.trim() || addComment.isPending}
            onClick={handleSubmit}
          >
            {addComment.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
