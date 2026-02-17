import { useState } from 'react';
import { ArrowLeft, TrendingUp, Hash, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { PostCard } from '@/components/social/PostCard';
import { CreatePostDialog } from '@/components/social/CreatePostDialog';
import { GuestBrowsePrompt } from '@/components/GuestBrowsePrompt';

const TRENDING_TAGS = ['今日份快乐', '深夜食堂', '美食探店', '约饭日记', '一人食', '周末聚餐'];

const SocialFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTag, setActiveTag] = useState<string | undefined>();
  const { postsQuery } = usePosts(activeTag ? 'hashtag' : 'all', activeTag);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/40">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground flex-1">动态广场</h1>
        </div>

        {/* Trending tags */}
        <div className="px-4 pb-3 max-w-lg mx-auto overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
            <Badge
              variant={!activeTag ? 'default' : 'outline'}
              className="cursor-pointer text-xs whitespace-nowrap"
              onClick={() => setActiveTag(undefined)}
            >
              全部
            </Badge>
            {TRENDING_TAGS.map(tag => (
              <Badge
                key={tag}
                variant={activeTag === tag ? 'default' : 'outline'}
                className="cursor-pointer text-xs whitespace-nowrap"
                onClick={() => setActiveTag(activeTag === tag ? undefined : tag)}
              >
                <Hash className="w-3 h-3 mr-0.5" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {!user && <GuestBrowsePrompt show={true} />}

        {postsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : postsQuery.data?.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-4xl">📝</div>
            <p className="text-muted-foreground">
              {activeTag ? `还没有 #${activeTag} 相关动态` : '还没有动态，快来发布第一条吧！'}
            </p>
            {user && (
              <p className="text-xs text-muted-foreground">点击右下角 + 号发布动态</p>
            )}
          </div>
        ) : (
          postsQuery.data?.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onHashtagClick={(tag) => setActiveTag(tag)}
            />
          ))
        )}
      </div>

      {/* FAB - Create Post */}
      {user && <CreatePostDialog />}
    </div>
  );
};

export default SocialFeed;
