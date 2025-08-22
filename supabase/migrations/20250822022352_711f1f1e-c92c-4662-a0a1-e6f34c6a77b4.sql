-- 创建通知表
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  category TEXT NOT NULL DEFAULT 'general', -- 'dinner_cancelled', 'dinner_updated', 'chat_message', 'general'
  related_dinner_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 系统可以创建通知（通过服务角色）
CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- 创建更新时间戳触发器
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 创建发送取消通知的函数
CREATE OR REPLACE FUNCTION public.send_dinner_cancellation_notifications(
  dinner_id_param UUID,
  canceller_user_id UUID,
  cancellation_type TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  dinner_rec RECORD;
  participant_rec RECORD;
  canceller_profile RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- 获取饭局信息
  SELECT * INTO dinner_rec FROM public.dinners WHERE id = dinner_id_param;
  IF NOT FOUND THEN RETURN; END IF;
  
  -- 获取取消者信息
  SELECT * INTO canceller_profile FROM public.profiles WHERE user_id = canceller_user_id;
  
  -- 根据取消类型设置通知内容
  IF cancellation_type = 'creator_cancel' THEN
    -- 创建者取消饭局，通知所有参与者
    notification_title := '饭局已取消';
    notification_message := COALESCE(canceller_profile.nickname, '创建者') || ' 取消了饭局"' || dinner_rec.title || '"';
    IF reason IS NOT NULL THEN
      notification_message := notification_message || '。取消原因：' || reason;
    END IF;
    
    -- 给所有参与者发送通知（不包括创建者自己）
    FOR participant_rec IN 
      SELECT user_id FROM public.dinner_participants 
      WHERE dinner_id = dinner_id_param AND user_id != canceller_user_id
    LOOP
      INSERT INTO public.notifications (
        user_id, title, message, type, category, related_dinner_id
      ) VALUES (
        participant_rec.user_id,
        notification_title,
        notification_message,
        'warning',
        'dinner_cancelled',
        dinner_id_param
      );
    END LOOP;
    
  ELSIF cancellation_type = 'participant_cancel' THEN
    -- 参与者退出，通知创建者
    notification_title := '参与者退出饭局';
    notification_message := COALESCE(canceller_profile.nickname, '参与者') || ' 退出了您的饭局"' || dinner_rec.title || '"';
    IF reason IS NOT NULL THEN
      notification_message := notification_message || '。退出原因：' || reason;
    END IF;
    
    -- 通知创建者
    INSERT INTO public.notifications (
      user_id, title, message, type, category, related_dinner_id
    ) VALUES (
      dinner_rec.created_by,
      notification_title,
      notification_message,
      'info',
      'dinner_cancelled',
      dinner_id_param
    );
  END IF;
END;
$$;

-- 修改取消饭局函数，添加通知功能
CREATE OR REPLACE FUNCTION public.cancel_dinner(dinner_id_param uuid, user_id_param uuid, cancellation_reason_param text DEFAULT NULL::text)
 RETURNS TABLE(success boolean, message text, cancellation_type text, is_late_cancellation boolean)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
        
        -- 发送通知给所有参与者
        PERFORM public.send_dinner_cancellation_notifications(
            dinner_id_param, user_id_param, cancel_type, cancellation_reason_param
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
        
        -- 发送通知给创建者
        PERFORM public.send_dinner_cancellation_notifications(
            dinner_id_param, user_id_param, cancel_type, cancellation_reason_param
        );
        
        IF is_late THEN
            RETURN QUERY SELECT true, '已退出饭局。由于是当天退出，可能会影响您未来参与饭局的权限'::TEXT, cancel_type, is_late;
        ELSE
            RETURN QUERY SELECT true, '已成功退出饭局'::TEXT, cancel_type, is_late;
        END IF;
    END IF;
END;
$function$;

-- 为通知表创建索引以提高查询性能
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_category ON public.notifications(category);