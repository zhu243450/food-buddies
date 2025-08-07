-- 完整的数据库架构修复脚本
-- 请在 Supabase SQL Editor 中执行此脚本

-- 1. 创建更新时间戳的函数（如果不存在）
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建新用户处理函数（如果不存在）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', '新用户'));
  RETURN NEW;
END;
$function$;

-- 3. 创建匹配分数计算函数（如果不存在）
CREATE OR REPLACE FUNCTION public.calculate_match_score(dinner_id_param uuid, user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
  score INTEGER := 0;
  dinner_rec RECORD;
  user_profile RECORD;
  creator_profile RECORD;
  distance_km DECIMAL;
BEGIN
  -- 获取饭局信息
  SELECT * INTO dinner_rec FROM public.dinners WHERE id = dinner_id_param;
  IF NOT FOUND THEN RETURN 0; END IF;
  
  -- 获取用户资料
  SELECT * INTO user_profile FROM public.profiles WHERE user_id = user_id_param;
  IF NOT FOUND THEN RETURN 0; END IF;
  
  -- 获取饭局创建者资料
  SELECT * INTO creator_profile FROM public.profiles WHERE user_id = dinner_rec.created_by;
  IF NOT FOUND THEN RETURN 0; END IF;
  
  -- 1. 性别偏好匹配 (0-30分)
  IF dinner_rec.gender_preference = 'no_preference' THEN
    score := score + 30;
  ELSIF dinner_rec.gender_preference = 'same_gender' AND creator_profile.gender = user_profile.gender THEN
    score := score + 30;
  ELSIF dinner_rec.gender_preference = 'opposite_gender' AND creator_profile.gender != user_profile.gender THEN
    score := score + 30;
  END IF;
  
  -- 2. 饮食偏好匹配 (0-25分)
  IF dinner_rec.food_preferences IS NOT NULL AND user_profile.food_preferences IS NOT NULL THEN
    IF dinner_rec.food_preferences && user_profile.food_preferences THEN
      score := score + 25;
    END IF;
  ELSE
    score := score + 15; -- 无偏好设置时给基础分
  END IF;
  
  -- 3. 饮食禁忌匹配 (0-20分)
  IF dinner_rec.dietary_restrictions IS NULL OR user_profile.dietary_restrictions IS NULL THEN
    score := score + 20; -- 无禁忌时给满分
  ELSIF NOT (dinner_rec.dietary_restrictions && user_profile.dietary_restrictions) THEN
    score := score + 20; -- 禁忌不冲突
  END IF;
  
  -- 4. 性格标签匹配 (0-15分)
  IF dinner_rec.personality_tags IS NOT NULL AND user_profile.personality_tags IS NOT NULL THEN
    IF dinner_rec.personality_tags && user_profile.personality_tags THEN
      score := score + 15;
    END IF;
  ELSE
    score := score + 10; -- 无标签时给基础分
  END IF;
  
  -- 5. 距离匹配 (0-10分)
  IF creator_profile.location_latitude IS NOT NULL 
     AND creator_profile.location_longitude IS NOT NULL 
     AND user_profile.location_latitude IS NOT NULL 
     AND user_profile.location_longitude IS NOT NULL THEN
    
    -- 计算两点间距离 (简化的距离计算)
    distance_km := SQRT(
      POWER(creator_profile.location_latitude - user_profile.location_latitude, 2) + 
      POWER(creator_profile.location_longitude - user_profile.location_longitude, 2)
    ) * 111.32; -- 转换为大概的公里数
    
    IF distance_km <= 5 THEN
      score := score + 10;
    ELSIF distance_km <= 10 THEN
      score := score + 8;
    ELSIF distance_km <= 20 THEN
      score := score + 5;
    END IF;
  ELSE
    score := score + 5; -- 无位置信息时给基础分
  END IF;
  
  RETURN score;
END;
$function$;

-- 4. 创建聊天会话创建函数（如果不存在）
CREATE OR REPLACE FUNCTION public.create_chat_session_on_join()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- 为新参与者和饭局创建者创建聊天会话
  INSERT INTO public.chat_sessions (dinner_id, participant1_id, participant2_id)
  SELECT 
    NEW.dinner_id,
    LEAST(NEW.user_id, d.created_by) as participant1_id,
    GREATEST(NEW.user_id, d.created_by) as participant2_id
  FROM public.dinners d
  WHERE d.id = NEW.dinner_id
    AND NEW.user_id != d.created_by  -- 不为自己创建聊天会话
  ON CONFLICT (dinner_id, participant1_id, participant2_id) DO NOTHING;
  
  -- 为新参与者和其他已有参与者创建聊天会话
  INSERT INTO public.chat_sessions (dinner_id, participant1_id, participant2_id)
  SELECT 
    NEW.dinner_id,
    LEAST(NEW.user_id, dp.user_id) as participant1_id,
    GREATEST(NEW.user_id, dp.user_id) as participant2_id
  FROM public.dinner_participants dp
  WHERE dp.dinner_id = NEW.dinner_id
    AND dp.user_id != NEW.user_id  -- 不包括自己
  ON CONFLICT (dinner_id, participant1_id, participant2_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- 5. 添加缺失的外键约束
-- 为 chat_messages 表添加外键约束
ALTER TABLE public.chat_messages 
ADD CONSTRAINT fk_chat_messages_session_id 
FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.chat_messages 
ADD CONSTRAINT fk_chat_messages_sender_id 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 为 chat_sessions 表添加外键约束
ALTER TABLE public.chat_sessions 
ADD CONSTRAINT fk_chat_sessions_dinner_id 
FOREIGN KEY (dinner_id) REFERENCES public.dinners(id) ON DELETE CASCADE;

ALTER TABLE public.chat_sessions 
ADD CONSTRAINT fk_chat_sessions_participant1_id 
FOREIGN KEY (participant1_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.chat_sessions 
ADD CONSTRAINT fk_chat_sessions_participant2_id 
FOREIGN KEY (participant2_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 为 dinner_participants 表添加外键约束
ALTER TABLE public.dinner_participants 
ADD CONSTRAINT fk_dinner_participants_dinner_id 
FOREIGN KEY (dinner_id) REFERENCES public.dinners(id) ON DELETE CASCADE;

ALTER TABLE public.dinner_participants 
ADD CONSTRAINT fk_dinner_participants_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 为 dinners 表添加外键约束
ALTER TABLE public.dinners 
ADD CONSTRAINT fk_dinners_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 为 profiles 表添加外键约束
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. 添加唯一约束
-- chat_sessions 的唯一约束
ALTER TABLE public.chat_sessions 
ADD CONSTRAINT unique_chat_session 
UNIQUE (dinner_id, participant1_id, participant2_id);

-- profiles 的唯一约束
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_profile_user_id 
UNIQUE (user_id);

-- dinner_participants 的唯一约束
ALTER TABLE public.dinner_participants 
ADD CONSTRAINT unique_dinner_participant 
UNIQUE (dinner_id, user_id);

-- 7. 创建触发器（如果不存在）
-- 饭局参与者加入时创建聊天会话的触发器
DROP TRIGGER IF EXISTS trigger_create_chat_session ON public.dinner_participants;
CREATE TRIGGER trigger_create_chat_session
  AFTER INSERT ON public.dinner_participants
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_chat_session_on_join();

-- 用户注册时创建profile的触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 更新时间戳的触发器
DROP TRIGGER IF EXISTS update_dinners_updated_at ON public.dinners;
CREATE TRIGGER update_dinners_updated_at
  BEFORE UPDATE ON public.dinners
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 9. 存储桶的RLS策略
-- 头像存储策略
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 脚本执行完毕提示
SELECT 'Database schema setup completed successfully!' as status;