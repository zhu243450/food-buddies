-- 为 campaign_participations 表添加唯一约束防止重复参与
ALTER TABLE public.campaign_participations 
ADD CONSTRAINT unique_user_campaign_participation 
UNIQUE (user_id, campaign_id);

-- 为实时更新功能准备
ALTER TABLE public.campaign_participations REPLICA IDENTITY FULL;