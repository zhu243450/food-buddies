
-- 扩展 achievements 的 category 约束以支持活动类型
ALTER TABLE public.achievements DROP CONSTRAINT achievements_category_check;
ALTER TABLE public.achievements ADD CONSTRAINT achievements_category_check 
  CHECK (category = ANY (ARRAY['social', 'dinner', 'invite', 'milestone', 'campaign']));

-- 插入限定成就徽章
INSERT INTO public.achievements (
  name, name_en, description, description_en,
  category, requirement_type, requirement_value,
  icon, badge_color, points_reward, display_order, is_active
) VALUES (
  '跨年饭友', 'New Year Buddy',
  '在跨年活动中累计打卡3次', 'Check in 3 times during the New Year event',
  'campaign', 'campaign_checkin', 3,
  '🎆', 'red', 50, 100, true
);
