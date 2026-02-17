import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Hash, Loader2, RefreshCw, Flame, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { usePosts, SortMode } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { PostCard } from '@/components/social/PostCard';
import { CreatePostDialog } from '@/components/social/CreatePostDialog';
import { GuestBrowsePrompt } from '@/components/GuestBrowsePrompt';

const TRENDING_TAGS = ['今日份快乐', '深夜食堂', '美食探店', '约饭日记', '一人食', '周末聚餐'];

const SocialFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTag, setActiveTag] = useState<string | undefined>();
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const { postsQuery, postsInfiniteQuery } = usePosts(activeTag ? 'hashtag' : 'all', activeTag, sortMode);

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await postsInfiniteQuery.refetch();
    setIsRefreshing(false);
    setPullDistance(0);
  }, [postsInfiniteQuery]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop !== 0) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0 && diff < 120) {
      setPullDistance(diff);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  };

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && postsInfiniteQuery.hasNextPage && !postsInfiniteQuery.isFetchingNextPage) {
          postsInfiniteQuery.fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [postsInfiniteQuery.hasNextPage, postsInfiniteQuery.isFetchingNextPage]);

  const posts = postsQuery.data;

  return (
    <div
      ref={scrollContainerRef}
      className="min-h-screen bg-background pb-24"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center transition-all"
          style={{ height: pullDistance }}
        >
          <RefreshCw className={`w-5 h-5 text-primary ${pullDistance > 60 ? 'animate-spin' : ''}`} />
        </div>
      )}

      {isRefreshing && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
          <span className="text-xs text-muted-foreground">刷新中...</span>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/40">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground flex-1">动态广场</h1>

          {/* Sort toggle */}
          <div className="flex items-center bg-muted rounded-full p-0.5">
            <button
              onClick={() => setSortMode('latest')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortMode === 'latest' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Clock className="w-3 h-3" />
              最新
            </button>
            <button
              onClick={() => setSortMode('hot')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortMode === 'hot' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Flame className="w-3 h-3" />
              热门
            </button>
          </div>
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
        ) : !posts?.length ? (
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
          <>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onHashtagClick={(tag) => setActiveTag(tag)}
              />
            ))}

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {postsInfiniteQuery.isFetchingNextPage ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : postsInfiniteQuery.hasNextPage ? (
                <span className="text-xs text-muted-foreground">上滑加载更多</span>
              ) : posts.length > 0 ? (
                <span className="text-xs text-muted-foreground">— 已经到底了 —</span>
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* FAB - Create Post */}
      {user && <CreatePostDialog />}
    </div>
  );
};

export default SocialFeed;
