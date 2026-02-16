
-- ============================================
-- 1. 匿名正面标签表 (饭后匿名互评)
-- ============================================
CREATE TABLE public.anonymous_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dinner_id UUID NOT NULL REFERENCES public.dinners(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewed_user_id UUID NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- 每个饭局每对用户只能评一次
  CONSTRAINT unique_anonymous_tag UNIQUE (dinner_id, reviewer_id, reviewed_user_id),
  -- 不能给自己贴标签
  CONSTRAINT no_self_tag CHECK (reviewer_id != reviewed_user_id)
);

ALTER TABLE public.anonymous_tags ENABLE ROW LEVEL SECURITY;

-- 参与者可以给同饭局的人贴标签
CREATE POLICY "Users can create anonymous tags for dinner participants"
ON public.anonymous_tags FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id
  AND (
    EXISTS (
      SELECT 1 FROM dinner_participants WHERE dinner_id = anonymous_tags.dinner_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM dinners WHERE id = anonymous_tags.dinner_id AND created_by = auth.uid()
    )
  )
  AND (
    EXISTS (
      SELECT 1 FROM dinner_participants WHERE dinner_id = anonymous_tags.dinner_id AND user_id = anonymous_tags.reviewed_user_id
    )
    OR EXISTS (
      SELECT 1 FROM dinners WHERE id = anonymous_tags.dinner_id AND created_by = anonymous_tags.reviewed_user_id
    )
  )
);

-- 被评价的用户可以看到自己收到的标签（但看不到是谁给的 - 由前端控制不查询reviewer_id）
CREATE POLICY "Users can view tags they received"
ON public.anonymous_tags FOR SELECT
USING (auth.uid() = reviewed_user_id);

-- 用户可以看到自己发出的标签
CREATE POLICY "Users can view tags they gave"
ON public.anonymous_tags FOR SELECT
USING (auth.uid() = reviewer_id);

-- 管理员可以查看所有标签
CREATE POLICY "Admins can view all tags"
ON public.anonymous_tags FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 2. 匿名标签积分奖励触发器
-- ============================================
CREATE OR REPLACE FUNCTION public.reward_anonymous_tag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  reward_points INTEGER := 5;
BEGIN
  -- 给评价者奖励积分
  INSERT INTO user_rewards (user_id, total_points, dinner_points)
  VALUES (NEW.reviewer_id, reward_points, reward_points)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_rewards.total_points + reward_points,
    dinner_points = user_rewards.dinner_points + reward_points,
    updated_at = now();

  -- 记录积分交易
  INSERT INTO point_transactions (user_id, points, transaction_type, description, related_id)
  VALUES (NEW.reviewer_id, reward_points, 'anonymous_tag', '匿名互评奖励', NEW.dinner_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER reward_on_anonymous_tag
AFTER INSERT ON public.anonymous_tags
FOR EACH ROW
EXECUTE FUNCTION public.reward_anonymous_tag();

-- ============================================
-- 3. 随机匹配队列表
-- ============================================
CREATE TABLE public.random_match_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cuisine_type TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  matched_with_user_id UUID,
  matched_dinner_id UUID REFERENCES public.dinners(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes'),
  -- 每个用户同时只能有一个等待中的匹配
  CONSTRAINT unique_waiting_user UNIQUE (user_id, status) 
);

-- 这个约束太严格，改用部分唯一索引
ALTER TABLE public.random_match_queue DROP CONSTRAINT unique_waiting_user;
CREATE UNIQUE INDEX idx_unique_waiting_user ON public.random_match_queue (user_id) WHERE status = 'waiting';

ALTER TABLE public.random_match_queue ENABLE ROW LEVEL SECURITY;

-- 用户可以加入队列
CREATE POLICY "Users can join match queue"
ON public.random_match_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 用户可以查看自己的匹配记录
CREATE POLICY "Users can view own matches"
ON public.random_match_queue FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = matched_with_user_id);

-- 用户可以取消自己的等待
CREATE POLICY "Users can cancel own waiting"
ON public.random_match_queue FOR DELETE
USING (auth.uid() = user_id AND status = 'waiting');

-- 系统可以更新匹配状态（通过函数）
CREATE POLICY "Users can update own queue entries"
ON public.random_match_queue FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = matched_with_user_id);

-- ============================================
-- 4. 随机匹配函数 - 查找匹配并自动创建饭局
-- ============================================
CREATE OR REPLACE FUNCTION public.try_random_match(
  user_id_param UUID,
  cuisine_type_param TEXT,
  location_param TEXT DEFAULT '待定'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  match_record RECORD;
  new_dinner_id UUID;
  new_queue_id UUID;
  reward_points INTEGER := 10;
BEGIN
  -- 检查用户是否已在等待队列
  IF EXISTS (
    SELECT 1 FROM random_match_queue 
    WHERE user_id = user_id_param AND status = 'waiting' AND expires_at > now()
  ) THEN
    RETURN jsonb_build_object('success', false, 'status', 'already_waiting', 'message', '您已在匹配队列中');
  END IF;

  -- 清理过期的等待记录
  UPDATE random_match_queue SET status = 'expired' 
  WHERE status = 'waiting' AND expires_at <= now();

  -- 查找相同菜系的等待用户
  SELECT * INTO match_record
  FROM random_match_queue
  WHERE status = 'waiting'
    AND cuisine_type = cuisine_type_param
    AND user_id != user_id_param
    AND expires_at > now()
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF match_record IS NOT NULL THEN
    -- 找到匹配！自动创建饭局
    INSERT INTO dinners (
      title, location, dinner_time, max_participants, 
      created_by, food_preferences, dinner_mode, description
    ) VALUES (
      '🎲 随机挑战：一起吃' || cuisine_type_param || '！',
      COALESCE(NULLIF(location_param, ''), COALESCE(match_record.location, '待定')),
      now() + interval '2 hours',
      2,
      match_record.user_id,
      ARRAY[cuisine_type_param],
      'instant',
      '通过"今天吃什么"随机匹配挑战自动创建的饭局 🎯'
    ) RETURNING id INTO new_dinner_id;

    -- 将匹配的用户加入饭局参与者
    INSERT INTO dinner_participants (dinner_id, user_id)
    VALUES (new_dinner_id, user_id_param);

    -- 更新匹配记录
    UPDATE random_match_queue
    SET status = 'matched', 
        matched_with_user_id = user_id_param,
        matched_dinner_id = new_dinner_id
    WHERE id = match_record.id;

    -- 创建当前用户的匹配记录
    INSERT INTO random_match_queue (user_id, cuisine_type, location, status, matched_with_user_id, matched_dinner_id)
    VALUES (user_id_param, cuisine_type_param, location_param, 'matched', match_record.user_id, new_dinner_id);

    -- 给两个用户都奖励积分
    INSERT INTO user_rewards (user_id, total_points, dinner_points)
    VALUES (user_id_param, reward_points, reward_points)
    ON CONFLICT (user_id) DO UPDATE SET
      total_points = user_rewards.total_points + reward_points,
      dinner_points = user_rewards.dinner_points + reward_points,
      updated_at = now();

    INSERT INTO user_rewards (user_id, total_points, dinner_points)
    VALUES (match_record.user_id, reward_points, reward_points)
    ON CONFLICT (user_id) DO UPDATE SET
      total_points = user_rewards.total_points + reward_points,
      dinner_points = user_rewards.dinner_points + reward_points,
      updated_at = now();

    -- 记录积分交易
    INSERT INTO point_transactions (user_id, points, transaction_type, description, related_id)
    VALUES (user_id_param, reward_points, 'random_match', '随机匹配挑战成功奖励', new_dinner_id);
    INSERT INTO point_transactions (user_id, points, transaction_type, description, related_id)
    VALUES (match_record.user_id, reward_points, 'random_match', '随机匹配挑战成功奖励', new_dinner_id);

    -- 通知对方
    INSERT INTO notifications (user_id, title, message, type, category, related_dinner_id)
    VALUES (
      match_record.user_id,
      '🎉 匹配成功！',
      '有人和你选了同样的菜系"' || cuisine_type_param || '"！饭局已自动创建，快去看看吧',
      'success',
      'random_match',
      new_dinner_id
    );

    RETURN jsonb_build_object(
      'success', true, 
      'status', 'matched',
      'message', '匹配成功！已自动创建饭局',
      'dinner_id', new_dinner_id,
      'matched_cuisine', cuisine_type_param
    );
  ELSE
    -- 没有匹配，加入等待队列
    INSERT INTO random_match_queue (user_id, cuisine_type, location, status)
    VALUES (user_id_param, cuisine_type_param, location_param, 'waiting')
    RETURNING id INTO new_queue_id;

    RETURN jsonb_build_object(
      'success', true,
      'status', 'waiting',
      'message', '已加入匹配队列，等待有缘人...',
      'queue_id', new_queue_id,
      'cuisine', cuisine_type_param
    );
  END IF;
END;
$$;

-- ============================================
-- 5. 取消匹配等待的函数
-- ============================================
CREATE OR REPLACE FUNCTION public.cancel_random_match(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM random_match_queue
  WHERE user_id = user_id_param AND status = 'waiting';

  RETURN TRUE;
END;
$$;
