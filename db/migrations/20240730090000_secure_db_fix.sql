-- Security fixes for the database
-- Phase 1: Replace SECURITY DEFINER views with secure admin-only functions

-- Drop existing insecure views
DROP VIEW IF EXISTS public.admin_user_stats;
DROP VIEW IF EXISTS public.admin_dinner_stats; 
DROP VIEW IF EXISTS public.admin_cancellation_stats;

-- Create secure admin-only functions
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS TABLE(
  total_users bigint,
  active_users bigint,
  new_users_this_month bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles)::bigint as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE updated_at > now() - interval '30 days')::bigint as active_users,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '30 days')::bigint as new_users_this_month;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_dinner_stats()
RETURNS TABLE(
  total_dinners bigint,
  active_dinners bigint,
  completed_dinners bigint,
  cancelled_dinners bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.dinners)::bigint as total_dinners,
    (SELECT COUNT(*) FROM public.dinners WHERE status = 'active')::bigint as active_dinners,
    (SELECT COUNT(*) FROM public.dinners WHERE status = 'completed')::bigint as completed_dinners,
    (SELECT COUNT(*) FROM public.dinners WHERE status = 'cancelled')::bigint as cancelled_dinners;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_cancellation_stats()
RETURNS TABLE(
  total_cancellations bigint,
  late_cancellations bigint,
  cancellation_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.cancellation_records)::bigint as total_cancellations,
    (SELECT COUNT(*) FROM public.cancellation_records WHERE is_late_cancellation = true)::bigint as late_cancellations,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.dinners) > 0 THEN
        (SELECT COUNT(*) FROM public.cancellation_records)::numeric / (SELECT COUNT(*) FROM public.dinners)::numeric * 100
      ELSE 0
    END as cancellation_rate;
END;
$$;

-- Add SET search_path to existing functions to prevent search path vulnerabilities
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', '新用户'));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_match_score(dinner_id_param uuid, user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.create_chat_session_on_join()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.check_user_cancellation_restrictions(user_id_param uuid)
RETURNS TABLE(can_create_dinner boolean, restriction_reason text, late_cancellation_count integer, restriction_end_date timestamp with time zone)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    late_cancellation_count_var INTEGER := 0;
    latest_late_cancellation TIMESTAMP WITH TIME ZONE;
    restriction_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 计算过去30天内的迟到取消次数
    SELECT COUNT(*) 
    INTO late_cancellation_count_var
    FROM public.cancellation_records 
    WHERE user_id = user_id_param 
      AND is_late_cancellation = true 
      AND cancelled_at >= (now() - INTERVAL '30 days');
    
    -- 获取最近的迟到取消时间
    SELECT MAX(cancelled_at) 
    INTO latest_late_cancellation
    FROM public.cancellation_records 
    WHERE user_id = user_id_param 
      AND is_late_cancellation = true;
    
    -- 根据迟到取消次数确定限制
    IF late_cancellation_count_var = 0 THEN
        -- 无限制
        RETURN QUERY SELECT true, ''::TEXT, late_cancellation_count_var, NULL::TIMESTAMP WITH TIME ZONE;
    ELSIF late_cancellation_count_var = 1 THEN
        -- 第一次迟到取消：限制3天
        restriction_end := latest_late_cancellation + INTERVAL '3 days';
        IF now() < restriction_end THEN
            RETURN QUERY SELECT false, '由于您在过去30天内有1次当天取消记录，暂时限制发布饭局3天'::TEXT, late_cancellation_count_var, restriction_end;
        ELSE
            RETURN QUERY SELECT true, ''::TEXT, late_cancellation_count_var, restriction_end;
        END IF;
    ELSIF late_cancellation_count_var = 2 THEN
        -- 第二次迟到取消：限制7天
        restriction_end := latest_late_cancellation + INTERVAL '7 days';
        IF now() < restriction_end THEN
            RETURN QUERY SELECT false, '由于您在过去30天内有2次当天取消记录，暂时限制发布饭局7天'::TEXT, late_cancellation_count_var, restriction_end;
        ELSE
            RETURN QUERY SELECT true, ''::TEXT, late_cancellation_count_var, restriction_end;
        END IF;
    ELSE
        -- 第三次及以上迟到取消：限制15天
        restriction_end := latest_late_cancellation + INTERVAL '15 days';
        IF now() < restriction_end THEN
            RETURN QUERY SELECT false, '由于您在过去30天内有多次当天取消记录，暂时限制发布饭局15天'::TEXT, late_cancellation_count_var, restriction_end;
        ELSE
            RETURN QUERY SELECT true, ''::TEXT, late_cancellation_count_var, restriction_end;
        END IF;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_dinner(dinner_id_param uuid, user_id_param uuid, cancellation_reason_param text DEFAULT NULL::text)
RETURNS TABLE(success boolean, message text, cancellation_type text, is_late_cancellation boolean)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    dinner_rec RECORD;
    hours_before INTEGER;
    is_creator BOOLEAN := false;
    is_participant BOOLEAN := false;
    is_late BOOLEAN := false;
    cancel_type TEXT;
BEGIN
    -- 获取饭局信息
    SELECT * INTO dinner_rec 
    FROM public.dinners 
    WHERE id = dinner_id_param AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, '饭局不存在或已被取消'::TEXT, ''::TEXT, false;
        RETURN;
    END IF;
    
    -- 检查用户是否是创建者
    IF dinner_rec.created_by = user_id_param THEN
        is_creator := true;
        cancel_type := 'creator_cancel';
    ELSE
        -- 检查用户是否是参与者
        SELECT EXISTS(
            SELECT 1 FROM public.dinner_participants 
            WHERE dinner_id = dinner_id_param AND user_id = user_id_param
        ) INTO is_participant;
        
        IF NOT is_participant THEN
            RETURN QUERY SELECT false, '您没有权限取消此饭局'::TEXT, ''::TEXT, false;
            RETURN;
        END IF;
        cancel_type := 'participant_cancel';
    END IF;
    
    -- 计算距离饭局开始的小时数
    hours_before := EXTRACT(EPOCH FROM (dinner_rec.dinner_time - now())) / 3600;
    
    -- 判断是否为迟到取消（距离开始不足24小时）
    is_late := hours_before < 24;
    
    -- 检查取消条件
    IF hours_before < 0 THEN
        RETURN QUERY SELECT false, '饭局已经开始，无法取消'::TEXT, cancel_type, is_late;
        RETURN;
    END IF;
    
    -- 如果是创建者取消
    IF is_creator THEN
        -- 更新饭局状态为已取消
        UPDATE public.dinners 
        SET status = 'cancelled', updated_at = now() 
        WHERE id = dinner_id_param;
        
        -- 记录取消信息
        INSERT INTO public.cancellation_records (
            user_id, dinner_id, cancellation_type, cancellation_reason,
            dinner_start_time, hours_before_start, is_late_cancellation
        ) VALUES (
            user_id_param, dinner_id_param, cancel_type, cancellation_reason_param,
            dinner_rec.dinner_time, hours_before, is_late
        );
        
        IF is_late THEN
            RETURN QUERY SELECT true, '饭局已取消。由于是当天取消，可能会影响您未来发布饭局的权限'::TEXT, cancel_type, is_late;
        ELSE
            RETURN QUERY SELECT true, '饭局已成功取消'::TEXT, cancel_type, is_late;
        END IF;
        
    ELSE
        -- 参与者退出饭局
        DELETE FROM public.dinner_participants 
        WHERE dinner_id = dinner_id_param AND user_id = user_id_param;
        
        -- 记录取消信息
        INSERT INTO public.cancellation_records (
            user_id, dinner_id, cancellation_type, cancellation_reason,
            dinner_start_time, hours_before_start, is_late_cancellation
        ) VALUES (
            user_id_param, dinner_id_param, cancel_type, cancellation_reason_param,
            dinner_rec.dinner_time, hours_before, is_late
        );
        
        IF is_late THEN
            RETURN QUERY SELECT true, '已退出饭局。由于是当天退出，可能会影响您未来参与饭局的权限'::TEXT, cancel_type, is_late;
        ELSE
            RETURN QUERY SELECT true, '已成功退出饭局'::TEXT, cancel_type, is_late;
        END IF;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_dinner_creation_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    restriction_check RECORD;
BEGIN
    -- 检查用户是否有创建限制
    SELECT * INTO restriction_check 
    FROM public.check_user_cancellation_restrictions(NEW.created_by);
    
    IF NOT restriction_check.can_create_dinner THEN
        RAISE EXCEPTION '无法创建饭局: %', restriction_check.restriction_reason;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Tighten RLS policies to prevent PII exposure

-- Drop and recreate profiles policies with stricter access
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- More restrictive profile viewing policy
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow viewing basic info of other participants in same dinners
CREATE POLICY "Users can view basic info of dinner participants"
ON public.profiles
FOR SELECT
USING (
  auth.uid() != user_id 
  AND (
    -- Can see participants of dinners they created
    EXISTS (
      SELECT 1 FROM public.dinners d
      JOIN public.dinner_participants dp ON d.id = dp.dinner_id
      WHERE d.created_by = auth.uid() AND dp.user_id = profiles.user_id
    )
    OR
    -- Can see other participants of dinners they joined
    EXISTS (
      SELECT 1 FROM public.dinner_participants dp1
      JOIN public.dinner_participants dp2 ON dp1.dinner_id = dp2.dinner_id
      WHERE dp1.user_id = auth.uid() AND dp2.user_id = profiles.user_id
    )
    OR
    -- Can see creators of dinners they joined
    EXISTS (
      SELECT 1 FROM public.dinners d
      JOIN public.dinner_participants dp ON d.id = dp.dinner_id
      WHERE dp.user_id = auth.uid() AND d.created_by = profiles.user_id
    )
  )
);

-- Tighten dinner_participants policies
DROP POLICY IF EXISTS "Participants viewable by dinner creator and participants" ON public.dinner_participants;

CREATE POLICY "Users can view participants of their own dinners"
ON public.dinner_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dinners d 
    WHERE d.id = dinner_participants.dinner_id 
    AND d.created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.dinner_participants dp
    WHERE dp.dinner_id = dinner_participants.dinner_id
    AND dp.user_id = auth.uid()
  )
);