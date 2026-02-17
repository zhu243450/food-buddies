
-- 动态/帖子表
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT,
  media_urls TEXT[] DEFAULT '{}',
  media_types TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'public',
  hashtags TEXT[] DEFAULT '{}',
  related_dinner_id UUID REFERENCES public.dinners(id) ON DELETE SET NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 动态点赞表
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 动态评论表
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 动态转发表
CREATE TABLE public.post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_visibility ON public.posts(visibility);
CREATE INDEX idx_posts_hashtags ON public.posts USING GIN(hashtags);
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_shares_original ON public.post_shares(original_post_id);

-- RLS: posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 公开动态所有人可见，好友可见需要好友关系，私密仅自己
CREATE POLICY "Users can view public posts"
  ON public.posts FOR SELECT
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (visibility = 'friends' AND are_friends(auth.uid(), user_id))
  );

CREATE POLICY "Users can create own posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS: post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view post likes"
  ON public.post_likes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.posts p WHERE p.id = post_id
    AND (p.visibility = 'public' OR p.user_id = auth.uid() OR (p.visibility = 'friends' AND are_friends(auth.uid(), p.user_id)))
  ));

CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS: post_comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view post comments"
  ON public.post_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.posts p WHERE p.id = post_id
    AND (p.visibility = 'public' OR p.user_id = auth.uid() OR (p.visibility = 'friends' AND are_friends(auth.uid(), p.user_id)))
  ));

CREATE POLICY "Users can comment on posts"
  ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS: post_shares
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view post shares"
  ON public.post_shares FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.posts p WHERE p.id = original_post_id
    AND (p.visibility = 'public' OR p.user_id = auth.uid())
  ));

CREATE POLICY "Users can share posts"
  ON public.post_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shares"
  ON public.post_shares FOR DELETE
  USING (auth.uid() = user_id);

-- 管理员策略
CREATE POLICY "Admins can manage all posts"
  ON public.posts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all post comments"
  ON public.post_comments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 点赞计数触发器
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    -- 发帖者获得积分
    INSERT INTO public.point_transactions (user_id, points, transaction_type, description, related_id)
    SELECT p.user_id, 1, 'post_liked', '动态被点赞 +1', NEW.post_id
    FROM public.posts p WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;
    UPDATE public.user_rewards SET total_points = total_points + 1, dinner_points = dinner_points + 1
    WHERE user_id = (SELECT user_id FROM public.posts WHERE id = NEW.post_id) 
    AND (SELECT user_id FROM public.posts WHERE id = NEW.post_id) != NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- 评论计数触发器
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- 转发计数触发器
CREATE OR REPLACE FUNCTION public.update_post_shares_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET shares_count = shares_count + 1 WHERE id = NEW.original_post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET shares_count = GREATEST(shares_count - 1, 0) WHERE id = OLD.original_post_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER trigger_update_post_shares_count
  AFTER INSERT OR DELETE ON public.post_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_post_shares_count();

-- 发帖奖励积分触发器
CREATE OR REPLACE FUNCTION public.reward_post_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 发帖 +3 积分
  INSERT INTO public.point_transactions (user_id, points, transaction_type, description, related_id)
  VALUES (NEW.user_id, 3, 'post_created', '发布动态 +3', NEW.id);
  
  UPDATE public.user_rewards SET total_points = total_points + 3, dinner_points = dinner_points + 3
  WHERE user_id = NEW.user_id;
  
  -- 如果没有 user_rewards 记录则创建
  IF NOT FOUND THEN
    INSERT INTO public.user_rewards (user_id, total_points, dinner_points)
    VALUES (NEW.user_id, 3, 3);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_reward_post_creation
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.reward_post_creation();

-- updated_at 触发器
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
