-- 延长聊天会话时间并添加重新激活功能
-- 1. 修改默认聊天时间为7天
ALTER TABLE chat_sessions ALTER COLUMN can_chat_until SET DEFAULT (now() + INTERVAL '7 days');

-- 2. 更新现有过期的聊天会话，延长7天
UPDATE chat_sessions 
SET can_chat_until = now() + INTERVAL '7 days',
    updated_at = now()
WHERE can_chat_until < now();

-- 3. 创建重新激活聊天的函数
CREATE OR REPLACE FUNCTION reactivate_chat_session(session_id_param UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    session_record chat_sessions;
    user_id_val UUID;
BEGIN
    -- 获取当前用户ID
    user_id_val := auth.uid();
    
    IF user_id_val IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- 检查会话是否存在且用户是参与者
    SELECT * INTO session_record
    FROM chat_sessions
    WHERE id = session_id_param
    AND (participant1_id = user_id_val OR participant2_id = user_id_val);
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 重新激活会话，延长7天
    UPDATE chat_sessions
    SET can_chat_until = now() + INTERVAL '7 days',
        updated_at = now()
    WHERE id = session_id_param;
    
    RETURN TRUE;
END;
$$;

-- 4. 创建删除过期聊天的函数
CREATE OR REPLACE FUNCTION delete_expired_chats(user_id_param UUID)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- 验证用户身份
    IF auth.uid() != user_id_param THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    
    -- 删除用户的过期聊天消息
    DELETE FROM chat_messages
    WHERE session_id IN (
        SELECT id FROM chat_sessions
        WHERE (participant1_id = user_id_param OR participant2_id = user_id_param)
        AND can_chat_until < now() - INTERVAL '7 days'
    );
    
    -- 删除用户的过期聊天会话（7天前过期的）
    DELETE FROM chat_sessions
    WHERE (participant1_id = user_id_param OR participant2_id = user_id_param)
    AND can_chat_until < now() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- 5. 创建自动清理过期聊天的函数（管理员用）
CREATE OR REPLACE FUNCTION cleanup_all_expired_chats()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- 只允许管理员执行
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Admin role required';
    END IF;
    
    -- 删除过期超过7天的聊天消息
    DELETE FROM chat_messages
    WHERE session_id IN (
        SELECT id FROM chat_sessions
        WHERE can_chat_until < now() - INTERVAL '7 days'
    );
    
    -- 删除过期超过7天的聊天会话
    DELETE FROM chat_sessions
    WHERE can_chat_until < now() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;