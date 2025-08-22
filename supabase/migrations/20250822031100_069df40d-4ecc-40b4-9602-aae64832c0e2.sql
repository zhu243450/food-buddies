-- Update function to also notify the canceller themselves
CREATE OR REPLACE FUNCTION public.send_dinner_cancellation_notifications(
  dinner_id_param uuid,
  canceller_user_id uuid,
  cancellation_type text,
  reason text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

    -- 给取消者自己发送确认通知
    INSERT INTO public.notifications (
      user_id, title, message, type, category, related_dinner_id
    ) VALUES (
      canceller_user_id,
      '您已取消饭局',
      '您已取消饭局“' || dinner_rec.title || '”' || 
        CASE WHEN reason IS NOT NULL THEN '。取消原因：' || reason ELSE '' END,
      'info',
      'dinner_cancelled',
      dinner_id_param
    );
    
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

    -- 给退出者自己发送确认通知
    INSERT INTO public.notifications (
      user_id, title, message, type, category, related_dinner_id
    ) VALUES (
      canceller_user_id,
      '您已退出饭局',
      '您已退出饭局“' || dinner_rec.title || '”' || 
        CASE WHEN reason IS NOT NULL THEN '。退出原因：' || reason ELSE '' END,
      'info',
      'dinner_cancelled',
      dinner_id_param
    );
  END IF;
END;
$function$;