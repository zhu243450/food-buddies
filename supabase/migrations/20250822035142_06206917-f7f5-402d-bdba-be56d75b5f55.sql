-- 创建举报反馈表
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('user', 'chat', 'dinner', 'general_feedback')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[],
  related_dinner_id UUID REFERENCES public.dinners(id) ON DELETE SET NULL,
  related_chat_session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "用户可以查看自己提交的举报" 
ON public.reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

CREATE POLICY "用户可以提交举报" 
ON public.reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "管理员可以查看所有举报" 
ON public.reports 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "管理员可以更新举报状态" 
ON public.reports 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- 创建更新时间戳触发器
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();