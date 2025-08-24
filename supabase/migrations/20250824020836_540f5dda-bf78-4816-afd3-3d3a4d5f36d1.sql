-- 创建活动表
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_priority INTEGER NOT NULL DEFAULT 0,
  target_audience TEXT NOT NULL DEFAULT 'all', -- 'all', 'new_users', 'existing_users'
  campaign_type TEXT NOT NULL DEFAULT 'promotion', -- 'promotion', 'event', 'announcement'
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- 活动规则和条件
  rules JSONB,
  -- 活动统计数据
  view_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0
);

-- 启用 RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "所有用户可以查看活跃的活动" 
ON public.campaigns 
FOR SELECT 
USING (is_active = true AND start_date <= now() AND end_date >= now());

CREATE POLICY "管理员可以管理所有活动" 
ON public.campaigns 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 创建更新时间戳触发器
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 创建活动参与记录表（用于跟踪用户参与情况）
CREATE TABLE public.campaign_participations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  participation_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- 启用 RLS
ALTER TABLE public.campaign_participations ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "用户可以查看自己的参与记录" 
ON public.campaign_participations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的参与记录" 
ON public.campaign_participations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "管理员可以查看所有参与记录" 
ON public.campaign_participations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));