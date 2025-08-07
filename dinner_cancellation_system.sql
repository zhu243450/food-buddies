-- 饭局取消系统完整SQL代码
-- 请在 Supabase SQL Editor 中执行此脚本

-- 1. 为 dinners 表添加状态字段
ALTER TABLE public.dinners 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed'));

-- 2. 创建取消记录表
CREATE TABLE IF NOT EXISTS public.cancellation_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    dinner_id UUID NOT NULL REFERENCES public.dinners(id) ON DELETE CASCADE,
    cancellation_type TEXT NOT NULL CHECK (cancellation_type IN ('creator_cancel', 'participant_cancel')),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    dinner_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    hours_before_start INTEGER NOT NULL,
    is_late_cancellation BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. 启用取消记录表的 RLS
ALTER TABLE public.cancellation_records ENABLE ROW LEVEL SECURITY;

-- 4. 创建取消记录表的 RLS 策略
CREATE POLICY "Users can view their own cancellation records" 
ON public.cancellation_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cancellation records" 
ON public.cancellation_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. 创建检查用户取消限制的函数
CREATE OR REPLACE FUNCTION public.check_user_cancellation_restrictions(user_id_param UUID)
RETURNS TABLE (
    can_create_dinner BOOLEAN,
    restriction_reason TEXT,
    late_cancellation_count INTEGER,
    restriction_end_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
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

-- 6. 创建取消饭局的函数
CREATE OR REPLACE FUNCTION public.cancel_dinner(
    dinner_id_param UUID,
    user_id_param UUID,
    cancellation_reason_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    cancellation_type TEXT,
    is_late_cancellation BOOLEAN
) 
LANGUAGE plpgsql
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

-- 7. 创建检查饭局创建限制的触发器函数
CREATE OR REPLACE FUNCTION public.check_dinner_creation_restrictions()
RETURNS TRIGGER 
LANGUAGE plpgsql
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

-- 8. 创建饭局创建限制触发器
DROP TRIGGER IF EXISTS trigger_check_dinner_creation_restrictions ON public.dinners;
CREATE TRIGGER trigger_check_dinner_creation_restrictions
    BEFORE INSERT ON public.dinners
    FOR EACH ROW 
    EXECUTE FUNCTION public.check_dinner_creation_restrictions();

-- 9. 更新现有饭局的状态（如果需要）
UPDATE public.dinners 
SET status = 'active' 
WHERE status IS NULL;

-- 10. 为取消记录表添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_cancellation_records_user_id_cancelled_at 
ON public.cancellation_records(user_id, cancelled_at DESC);

CREATE INDEX IF NOT EXISTS idx_cancellation_records_late_cancellation 
ON public.cancellation_records(user_id, is_late_cancellation, cancelled_at DESC) 
WHERE is_late_cancellation = true;

-- 脚本执行完毕提示
SELECT 'Dinner cancellation system created successfully!' as status;