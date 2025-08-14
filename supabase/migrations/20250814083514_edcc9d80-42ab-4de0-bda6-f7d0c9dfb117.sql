-- 为用户权限管理添加字段到 profiles 表
ALTER TABLE public.profiles 
ADD COLUMN is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN ban_reason TEXT,
ADD COLUMN banned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN banned_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN banned_by UUID REFERENCES auth.users(id);

-- 添加索引提高查询性能
CREATE INDEX idx_profiles_is_banned ON public.profiles(is_banned);
CREATE INDEX idx_profiles_banned_until ON public.profiles(banned_until);

-- 创建检查用户是否被禁言的函数
CREATE OR REPLACE FUNCTION public.is_user_banned(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_banned BOOLEAN := FALSE;
    ban_expires TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT is_banned, banned_until 
    INTO user_banned, ban_expires
    FROM public.profiles 
    WHERE user_id = user_id_param;
    
    -- 如果用户没有被禁言，返回 false
    IF NOT user_banned THEN
        RETURN FALSE;
    END IF;
    
    -- 如果没有设置过期时间（永久禁言），返回 true
    IF ban_expires IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- 如果禁言已过期，自动解除禁言
    IF ban_expires <= NOW() THEN
        UPDATE public.profiles 
        SET is_banned = FALSE,
            ban_reason = NULL,
            banned_at = NULL,
            banned_until = NULL,
            banned_by = NULL
        WHERE user_id = user_id_param;
        RETURN FALSE;
    END IF;
    
    -- 禁言仍然有效
    RETURN TRUE;
END;
$$;

-- 创建管理员操作用户权限的函数
CREATE OR REPLACE FUNCTION public.manage_user_permissions(
    target_user_id UUID,
    action TEXT, -- 'ban', 'unban'
    reason TEXT DEFAULT NULL,
    ban_duration_hours INTEGER DEFAULT NULL -- NULL表示永久禁言
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    admin_user_id UUID;
    ban_until TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 检查当前用户是否是管理员
    admin_user_id := auth.uid();
    IF NOT public.has_role(admin_user_id, 'admin') THEN
        RETURN QUERY SELECT FALSE, '无权限执行此操作'::TEXT;
        RETURN;
    END IF;
    
    -- 检查目标用户是否存在
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = target_user_id) THEN
        RETURN QUERY SELECT FALSE, '用户不存在'::TEXT;
        RETURN;
    END IF;
    
    IF action = 'ban' THEN
        -- 计算禁言到期时间
        IF ban_duration_hours IS NOT NULL THEN
            ban_until := NOW() + (ban_duration_hours || ' hours')::INTERVAL;
        ELSE
            ban_until := NULL; -- 永久禁言
        END IF;
        
        -- 执行禁言
        UPDATE public.profiles 
        SET is_banned = TRUE,
            ban_reason = reason,
            banned_at = NOW(),
            banned_until = ban_until,
            banned_by = admin_user_id
        WHERE user_id = target_user_id;
        
        RETURN QUERY SELECT TRUE, '用户已被禁言'::TEXT;
        
    ELSIF action = 'unban' THEN
        -- 解除禁言
        UPDATE public.profiles 
        SET is_banned = FALSE,
            ban_reason = NULL,
            banned_at = NULL,
            banned_until = NULL,
            banned_by = NULL
        WHERE user_id = target_user_id;
        
        RETURN QUERY SELECT TRUE, '用户禁言已解除'::TEXT;
        
    ELSE
        RETURN QUERY SELECT FALSE, '无效的操作类型'::TEXT;
    END IF;
END;
$$;