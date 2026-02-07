
-- ============================================
-- FIX 1: Profiles - require authentication for SELECT
-- ============================================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Only authenticated users can view profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- FIX 2: Notifications - block direct client inserts
-- ============================================
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Only SECURITY DEFINER functions (which bypass RLS) can insert notifications
CREATE POLICY "No direct notification inserts"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Create trigger to auto-notify on photo likes
CREATE OR REPLACE FUNCTION public.notify_on_photo_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photo_owner_id UUID;
  liker_name TEXT;
  photo_dinner_id UUID;
BEGIN
  -- Get photo owner and dinner_id
  SELECT dp.user_id, dp.dinner_id INTO photo_owner_id, photo_dinner_id
  FROM public.dinner_photos dp
  WHERE dp.id = NEW.photo_id;

  -- Don't notify if liking own photo
  IF photo_owner_id IS NULL OR photo_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get liker nickname
  SELECT nickname INTO liker_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, title, message, type, category, related_dinner_id)
  VALUES (
    photo_owner_id,
    '新的点赞',
    COALESCE(liker_name, '有人') || ' 赞了您的照片',
    'info',
    'photo_like',
    photo_dinner_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_photo_like ON public.photo_likes;
CREATE TRIGGER trg_notify_photo_like
AFTER INSERT ON public.photo_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_photo_like();

-- Create trigger to auto-notify on photo comments
CREATE OR REPLACE FUNCTION public.notify_on_photo_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photo_owner_id UUID;
  commenter_name TEXT;
  photo_dinner_id UUID;
  comment_preview TEXT;
BEGIN
  -- Get photo owner and dinner_id
  SELECT dp.user_id, dp.dinner_id INTO photo_owner_id, photo_dinner_id
  FROM public.dinner_photos dp
  WHERE dp.id = NEW.photo_id;

  -- Don't notify if commenting on own photo
  IF photo_owner_id IS NULL OR photo_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get commenter nickname
  SELECT nickname INTO commenter_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- Truncate comment for preview
  comment_preview := LEFT(NEW.content, 50);
  IF LENGTH(NEW.content) > 50 THEN
    comment_preview := comment_preview || '...';
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, category, related_dinner_id)
  VALUES (
    photo_owner_id,
    '新的评论',
    COALESCE(commenter_name, '有人') || ' 评论了您的照片: ' || comment_preview,
    'info',
    'photo_comment',
    photo_dinner_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_photo_comment ON public.photo_comments;
CREATE TRIGGER trg_notify_photo_comment
AFTER INSERT ON public.photo_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_photo_comment();

-- ============================================
-- FIX 3: Admin access logs - block direct client inserts
-- ============================================
DROP POLICY IF EXISTS "系统可以创建访问日志" ON public.admin_access_logs;

-- Only SECURITY DEFINER functions can insert audit logs
CREATE POLICY "No direct audit log inserts"
ON public.admin_access_logs
FOR INSERT
TO authenticated
WITH CHECK (false);
