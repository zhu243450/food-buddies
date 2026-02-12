-- Fix campaign RLS to allow viewing campaigns that haven't started yet (for preview)
-- Drop the restrictive policy and replace with a more permissive one
DROP POLICY IF EXISTS "所有用户可以查看活跃的活动" ON public.campaigns;

CREATE POLICY "Anyone can view active campaigns"
ON public.campaigns
FOR SELECT
USING (is_active = true AND end_date >= now());