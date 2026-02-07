
-- =============================================
-- 1. Friend notification triggers
-- =============================================

-- Trigger: Notify user when they receive a friend request
CREATE OR REPLACE FUNCTION public.notify_on_friend_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requester_name TEXT;
BEGIN
  -- Only fire on new pending requests
  IF NEW.status = 'pending' THEN
    SELECT nickname INTO requester_name
    FROM public.profiles
    WHERE user_id = NEW.requester_id;

    INSERT INTO public.notifications (user_id, title, message, type, category)
    VALUES (
      NEW.addressee_id,
      '新的好友请求',
      COALESCE(requester_name, '用户') || ' 向你发送了好友请求',
      'info',
      'friend_request'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_friend_request
  AFTER INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_friend_request();

-- Trigger: Notify requester when friend request is accepted
CREATE OR REPLACE FUNCTION public.notify_on_friend_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  accepter_name TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT nickname INTO accepter_name
    FROM public.profiles
    WHERE user_id = NEW.addressee_id;

    INSERT INTO public.notifications (user_id, title, message, type, category)
    VALUES (
      NEW.requester_id,
      '好友请求已接受',
      COALESCE(accepter_name, '用户') || ' 接受了你的好友请求，你们现在是好友了！',
      'success',
      'friend_accepted'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_friend_accept
  AFTER UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_friend_accept();

-- =============================================
-- 2. Dinner reviews table
-- =============================================

CREATE TABLE public.dinner_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dinner_id UUID NOT NULL REFERENCES public.dinners(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewed_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dinner_id, reviewer_id, reviewed_user_id)
);

-- Enable RLS
ALTER TABLE public.dinner_reviews ENABLE ROW LEVEL SECURITY;

-- Users can view reviews about themselves or reviews they wrote
CREATE POLICY "Users can view relevant reviews"
  ON public.dinner_reviews
  FOR SELECT
  USING (
    auth.uid() = reviewer_id
    OR auth.uid() = reviewed_user_id
    OR EXISTS (
      SELECT 1 FROM public.dinner_participants
      WHERE dinner_id = dinner_reviews.dinner_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.dinners
      WHERE id = dinner_reviews.dinner_id AND created_by = auth.uid()
    )
  );

-- Users can create reviews for dinners they participated in
CREATE POLICY "Users can create reviews for their dinners"
  ON public.dinner_reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND reviewer_id != reviewed_user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.dinner_participants
        WHERE dinner_id = dinner_reviews.dinner_id AND user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.dinners
        WHERE id = dinner_reviews.dinner_id AND created_by = auth.uid()
      )
    )
  );

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
  ON public.dinner_reviews
  FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
  ON public.dinner_reviews
  FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Trigger for updated_at
CREATE TRIGGER update_dinner_reviews_updated_at
  BEFORE UPDATE ON public.dinner_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
