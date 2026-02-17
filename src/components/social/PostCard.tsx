import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Globe, Users, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Post, usePosts, usePostComments } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { PostComments } from './PostComments';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  onHashtagClick?: (tag: string) => void;
}

export function PostCard({ post, onHashtagClick }: PostCardProps) {
  const { user } = useAuth();
  const { toggleLike, deletePost } = usePosts();
  const [showComments, setShowComments] = useState(false);
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  const navigate = useNavigate();
  const isOwner = user?.id === post.user_id;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: zhCN });

  const visibilityIcon = {
    public: <Globe className="w-3 h-3" />,
    friends: <Users className="w-3 h-3" />,
    private: <Lock className="w-3 h-3" />,
  }[post.visibility] || <Globe className="w-3 h-3" />;

  const images = post.media_urls.filter((_, i) => post.media_types[i] !== 'video');
  const videos = post.media_urls.filter((_, i) => post.media_types[i] === 'video');

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/user/${post.user_id}`)}
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {post.profile?.nickname?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-foreground">{post.profile?.nickname || '匿名用户'}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {visibilityIcon}
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>

        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deletePost.mutate(post.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除动态
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-2">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
        </div>
      )}

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {post.hashtags.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-primary/20"
              onClick={() => onHashtagClick?.(tag)}
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Media Grid */}
      {images.length > 0 && (
        <div className={`px-4 pb-2 grid gap-1 ${
          images.length === 1 ? 'grid-cols-1' :
          images.length === 2 ? 'grid-cols-2' :
          images.length === 4 ? 'grid-cols-2' :
          'grid-cols-3'
        }`}>
          {images.map((url, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-lg cursor-pointer ${
                images.length === 1 ? 'max-h-80' : 'aspect-square'
              }`}
              onClick={() => setImageIndex(i)}
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      {videos.map((url, i) => (
        <div key={i} className="px-4 pb-2">
          <video
            src={url}
            controls
            className="w-full rounded-lg max-h-80"
            preload="metadata"
          />
        </div>
      ))}

      {/* Actions */}
      <div className="flex items-center justify-around px-4 py-3 border-t border-border/30">
        <button
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            post.is_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
          }`}
          onClick={() => user && toggleLike.mutate(post.id)}
        >
          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
          <span>{post.likes_count || ''}</span>
        </button>

        <button
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments_count || ''}</span>
        </button>

        <button
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          onClick={() => {
            navigator.clipboard?.writeText(`${window.location.origin}/social?post=${post.id}`);
          }}
        >
          <Share2 className="w-5 h-5" />
          <span>{post.shares_count || ''}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <PostComments postId={post.id} />
      )}

      {/* Image Fullscreen */}
      {imageIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setImageIndex(null)}
        >
          <img
            src={images[imageIndex]}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
