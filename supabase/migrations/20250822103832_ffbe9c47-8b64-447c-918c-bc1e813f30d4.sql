-- 创建管理员访问审计日志表
CREATE TABLE public.admin_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  access_type TEXT NOT NULL, -- 'chat_review', 'user_profile', 'report_investigation'
  target_resource_id UUID, -- 可能是 chat_session_id, user_id, report_id 等
  target_resource_type TEXT NOT NULL, -- 'chat_session', 'user_profile', 'report'
  justification TEXT NOT NULL, -- 访问的法律/业务理由
  related_report_id UUID, -- 相关的举报ID（如果有）
  accessed_data_summary TEXT, -- 访问的数据摘要（不包含具体内容）
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- 启用 RLS
ALTER TABLE public.admin_access_logs ENABLE ROW LEVEL SECURITY;

-- 创建索引
CREATE INDEX idx_admin_access_logs_admin_user_id ON public.admin_access_logs(admin_user_id);
CREATE INDEX idx_admin_access_logs_created_at ON public.admin_access_logs(created_at);
CREATE INDEX idx_admin_access_logs_related_report_id ON public.admin_access_logs(related_report_id);

-- RLS 策略：只有管理员可以查看访问日志
CREATE POLICY "管理员可以查看访问日志" 
ON public.admin_access_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS 策略：只有系统可以创建访问日志
CREATE POLICY "系统可以创建访问日志" 
ON public.admin_access_logs 
FOR INSERT 
WITH CHECK (true);

-- 创建管理员安全访问聊天消息的函数
CREATE OR REPLACE FUNCTION public.admin_access_chat_messages(
  session_id_param UUID, 
  report_id_param UUID,
  justification_param TEXT DEFAULT '举报调查'
)
RETURNS TABLE(
  message_id UUID,
  content TEXT,
  message_type TEXT,
  sender_id UUID,
  sender_nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  access_logged BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user_id UUID;
  report_exists BOOLEAN := FALSE;
  message_count INTEGER := 0;
BEGIN
  -- 检查当前用户是否是管理员
  admin_user_id := auth.uid();
  IF NOT public.has_role(admin_user_id, 'admin') THEN
    RAISE EXCEPTION '无权限：需要管理员权限才能访问聊天记录';
  END IF;
  
  -- 验证举报是否存在且与该聊天会话相关
  SELECT EXISTS(
    SELECT 1 FROM public.reports r
    WHERE r.id = report_id_param 
    AND (r.related_chat_session_id = session_id_param OR r.related_chat_session_id IS NULL)
    AND r.status IN ('pending', 'investigating')
  ) INTO report_exists;
  
  IF NOT report_exists THEN
    RAISE EXCEPTION '无效访问：只能查看与有效举报相关的聊天记录';
  END IF;
  
  -- 记录访问日志
  INSERT INTO public.admin_access_logs (
    admin_user_id,
    access_type,
    target_resource_id,
    target_resource_type,
    justification,
    related_report_id,
    accessed_data_summary
  ) VALUES (
    admin_user_id,
    'chat_review',
    session_id_param,
    'chat_session',
    justification_param,
    report_id_param,
    '管理员因举报调查访问聊天会话: ' || session_id_param::TEXT
  );
  
  -- 返回聊天消息（带发送者昵称）
  RETURN QUERY
  SELECT 
    cm.id as message_id,
    cm.content,
    cm.message_type,
    cm.sender_id,
    COALESCE(p.nickname, '未知用户') as sender_nickname,
    cm.created_at,
    TRUE as access_logged
  FROM public.chat_messages cm
  LEFT JOIN public.profiles p ON p.user_id = cm.sender_id
  WHERE cm.session_id = session_id_param
  ORDER BY cm.created_at ASC;
  
END;
$$;

-- 创建管理员获取举报相关聊天会话的函数
CREATE OR REPLACE FUNCTION public.admin_get_reportable_chat_sessions(
  report_id_param UUID
)
RETURNS TABLE(
  session_id UUID,
  participant1_nickname TEXT,
  participant2_nickname TEXT,
  dinner_title TEXT,
  session_created_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  message_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user_id UUID;
  report_rec RECORD;
BEGIN
  -- 检查管理员权限
  admin_user_id := auth.uid();
  IF NOT public.has_role(admin_user_id, 'admin') THEN
    RAISE EXCEPTION '无权限：需要管理员权限';
  END IF;
  
  -- 获取举报信息
  SELECT * INTO report_rec FROM public.reports WHERE id = report_id_param;
  IF NOT FOUND THEN
    RAISE EXCEPTION '举报记录不存在';
  END IF;
  
  -- 记录访问日志
  INSERT INTO public.admin_access_logs (
    admin_user_id,
    access_type,
    target_resource_id,
    target_resource_type,
    justification,
    related_report_id,
    accessed_data_summary
  ) VALUES (
    admin_user_id,
    'report_investigation',
    report_id_param,
    'report',
    '查看举报相关的聊天会话列表',
    report_id_param,
    '管理员查看举报 ' || report_id_param::TEXT || ' 的相关聊天会话'
  );
  
  -- 如果举报指定了具体的聊天会话
  IF report_rec.related_chat_session_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      cs.id as session_id,
      p1.nickname as participant1_nickname,
      p2.nickname as participant2_nickname,
      d.title as dinner_title,
      cs.created_at as session_created_at,
      (SELECT MAX(created_at) FROM public.chat_messages WHERE session_id = cs.id) as last_message_at,
      (SELECT COUNT(*) FROM public.chat_messages WHERE session_id = cs.id) as message_count
    FROM public.chat_sessions cs
    LEFT JOIN public.profiles p1 ON p1.user_id = cs.participant1_id
    LEFT JOIN public.profiles p2 ON p2.user_id = cs.participant2_id
    LEFT JOIN public.dinners d ON d.id = cs.dinner_id
    WHERE cs.id = report_rec.related_chat_session_id;
  
  -- 如果举报涉及特定用户，返回该用户的所有聊天会话
  ELSIF report_rec.reported_user_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      cs.id as session_id,
      p1.nickname as participant1_nickname, 
      p2.nickname as participant2_nickname,
      d.title as dinner_title,
      cs.created_at as session_created_at,
      (SELECT MAX(created_at) FROM public.chat_messages WHERE session_id = cs.id) as last_message_at,
      (SELECT COUNT(*) FROM public.chat_messages WHERE session_id = cs.id) as message_count
    FROM public.chat_sessions cs
    LEFT JOIN public.profiles p1 ON p1.user_id = cs.participant1_id
    LEFT JOIN public.profiles p2 ON p2.user_id = cs.participant2_id
    LEFT JOIN public.dinners d ON d.id = cs.dinner_id
    WHERE cs.participant1_id = report_rec.reported_user_id 
       OR cs.participant2_id = report_rec.reported_user_id
    ORDER BY cs.created_at DESC;
  
  ELSE
    -- 如果没有指定具体目标，返回空结果
    RETURN;
  END IF;
  
END;
$$;

-- 更新举报表，添加调查状态字段
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS investigation_notes TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS data_retention_days INTEGER DEFAULT 30;

-- 创建自动数据清理函数（符合数据最小化原则）
CREATE OR REPLACE FUNCTION public.cleanup_resolved_report_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cleanup_count INTEGER := 0;
BEGIN
  -- 清理已解决且超过保留期的访问日志
  DELETE FROM public.admin_access_logs 
  WHERE related_report_id IN (
    SELECT id FROM public.reports 
    WHERE status = 'resolved' 
    AND resolved_at < (now() - INTERVAL '90 days')
  );
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  RETURN cleanup_count;
END;
$$;