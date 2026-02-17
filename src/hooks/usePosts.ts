import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Post {
  id: string;
  user_id: string;
  content: string | null;
  media_urls: string[];
  media_types: string[];
  visibility: string;
  hashtags: string[];
  related_dinner_id: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  // joined profile
  profile?: {
    nickname: string;
    avatar_url: string | null;
    user_id: string;
  };
  // user interaction state
  is_liked?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  profile?: {
    nickname: string;
    avatar_url: string | null;
  };
}

export function usePosts(filter?: 'all' | 'following' | 'hashtag', hashtag?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ['posts', filter, hashtag],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (hashtag) {
        query = query.contains('hashtags', [hashtag]);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles for all posts
      const userIds = [...new Set((data || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', userIds);

      // Fetch user likes
      let userLikes: string[] = [];
      if (user) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
        userLikes = (likes || []).map(l => l.post_id);
      }

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      return (data || []).map(post => ({
        ...post,
        profile: profileMap.get(post.user_id),
        is_liked: userLikes.includes(post.id),
      })) as Post[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (postData: {
      content: string;
      media_urls?: string[];
      media_types?: string[];
      visibility: string;
      hashtags?: string[];
      related_dinner_id?: string | null;
    }) => {
      if (!user) throw new Error('请先登录');
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postData.content,
          media_urls: postData.media_urls || [],
          media_types: postData.media_types || [],
          visibility: postData.visibility,
          hashtags: postData.hashtags || [],
          related_dinner_id: postData.related_dinner_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({ title: '发布成功', description: '动态已发布，获得 +3 积分' });
    },
    onError: (error) => {
      toast({ title: '发布失败', description: error.message, variant: 'destructive' });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('请先登录');
      const { data: existing } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('post_likes').delete().eq('id', existing.id);
        return { liked: false };
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
        return { liked: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({ title: '已删除', description: '动态已删除' });
    },
  });

  const addComment = useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      if (!user) throw new Error('请先登录');
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_comment_id: parentId || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post-comments'] });
    },
  });

  return { postsQuery, createPost, toggleLike, deletePost, addComment };
}

export function usePostComments(postId: string) {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      return (data || []).map(c => ({
        ...c,
        profile: profileMap.get(c.user_id),
      })) as PostComment[];
    },
    enabled: !!postId,
  });
}
