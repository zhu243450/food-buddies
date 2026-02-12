
-- 1. 为 dinner_photos 添加 campaign_id 列，支持活动照片打卡
ALTER TABLE public.dinner_photos 
ADD COLUMN campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- 2. 创建索引加速活动照片查询
CREATE INDEX idx_dinner_photos_campaign_id ON public.dinner_photos(campaign_id) WHERE campaign_id IS NOT NULL;

-- 3. 更新 RLS 策略：允许用户上传活动照片（无需关联饭局）
DROP POLICY IF EXISTS "用户可以上传自己的照片" ON public.dinner_photos;
CREATE POLICY "用户可以上传自己的照片" ON public.dinner_photos
FOR INSERT WITH CHECK (
  (auth.uid() = user_id) AND (
    -- 个人照片（无饭局无活动）
    (dinner_id IS NULL AND campaign_id IS NULL) OR
    -- 活动打卡照片
    (campaign_id IS NOT NULL) OR
    -- 饭局照片
    (dinner_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM dinner_participants WHERE dinner_participants.dinner_id = dinner_photos.dinner_id AND dinner_participants.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM dinners WHERE dinners.id = dinner_photos.dinner_id AND dinners.created_by = auth.uid())
    ))
  )
);

-- 4. 更新查看策略：所有人可查看活动照片
DROP POLICY IF EXISTS "用户可以查看已参与饭局的照片" ON public.dinner_photos;
CREATE POLICY "用户可以查看已参与饭局的照片或活动照片" ON public.dinner_photos
FOR SELECT USING (
  -- 活动照片所有人可见
  (campaign_id IS NOT NULL) OR
  -- 个人照片所有人可见
  (dinner_id IS NULL) OR
  -- 饭局照片需要参与
  (dinner_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM dinner_participants WHERE dinner_participants.dinner_id = dinner_photos.dinner_id AND dinner_participants.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM dinners WHERE dinners.id = dinner_photos.dinner_id AND dinners.created_by = auth.uid())
  ))
);

-- 5. 创建活动打卡奖励触发器函数
CREATE OR REPLACE FUNCTION public.reward_campaign_photo_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  reward_points INTEGER := 20;
  campaign_title TEXT;
BEGIN
  -- 只处理活动照片
  IF NEW.campaign_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 获取活动标题
  SELECT title INTO campaign_title FROM campaigns WHERE id = NEW.campaign_id;

  -- 奖励积分
  INSERT INTO user_rewards (user_id, total_points, dinner_points)
  VALUES (NEW.user_id, reward_points, reward_points)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_rewards.total_points + reward_points,
    dinner_points = user_rewards.dinner_points + reward_points,
    updated_at = now();

  -- 记录积分交易
  INSERT INTO point_transactions (user_id, points, transaction_type, description, related_id)
  VALUES (NEW.user_id, reward_points, 'campaign_checkin', 
          '活动打卡奖励: ' || COALESCE(campaign_title, '主题活动'), NEW.campaign_id);

  -- 发送通知
  INSERT INTO notifications (user_id, title, message, type, category)
  VALUES (NEW.user_id, '打卡成功！', 
          '您在活动"' || COALESCE(campaign_title, '主题活动') || '"中成功打卡，获得' || reward_points || '积分！',
          'success', 'campaign_checkin');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_campaign_photo_checkin
AFTER INSERT ON public.dinner_photos
FOR EACH ROW
WHEN (NEW.campaign_id IS NOT NULL)
EXECUTE FUNCTION public.reward_campaign_photo_checkin();
