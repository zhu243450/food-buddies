-- =============================================
-- 病毒式增长系统 - 邀请码、奖励、成就、排行榜
-- =============================================

-- 1. 用户邀请码表
CREATE TABLE public.user_invite_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  total_invites INTEGER NOT NULL DEFAULT 0,
  successful_invites INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. 邀请记录表
CREATE TABLE public.invite_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  inviter_rewarded BOOLEAN NOT NULL DEFAULT false,
  invitee_rewarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(invitee_id)
);

-- 3. 用户奖励/积分表
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  invite_points INTEGER NOT NULL DEFAULT 0,
  dinner_points INTEGER NOT NULL DEFAULT 0,
  achievement_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 4. 积分交易记录
CREATE TABLE public.point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('invite', 'dinner', 'achievement', 'bonus', 'redeem')),
  description TEXT NOT NULL,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. 成就定义表
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT NOT NULL,
  description_en TEXT,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL CHECK (category IN ('social', 'dinner', 'invite', 'milestone')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 0,
  badge_color TEXT NOT NULL DEFAULT 'gold',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. 用户成就记录
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_shared BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- 7. 分享记录表
CREATE TABLE public.share_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('dinner', 'achievement', 'invite', 'profile', 'photo')),
  related_id UUID,
  platform TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.user_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_records ENABLE ROW LEVEL SECURITY;

-- RLS策略

-- user_invite_codes: 用户只能查看自己的邀请码
CREATE POLICY "Users can view own invite codes" ON public.user_invite_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invite code" ON public.user_invite_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- invite_records: 用户可以查看与自己相关的邀请记录
CREATE POLICY "Users can view own invite records" ON public.invite_records
  FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- user_rewards: 用户可以查看所有人的积分（排行榜需要），但只能修改自己的
CREATE POLICY "Anyone can view rewards" ON public.user_rewards
  FOR SELECT USING (true);

CREATE POLICY "System can manage rewards" ON public.user_rewards
  FOR ALL USING (auth.uid() = user_id);

-- point_transactions: 用户只能查看自己的交易记录
CREATE POLICY "Users can view own transactions" ON public.point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- achievements: 所有人可以查看成就定义
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

-- user_achievements: 所有人可以查看成就记录（社交展示）
CREATE POLICY "Anyone can view user achievements" ON public.user_achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can create own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON public.user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- share_records: 用户可以查看自己的分享记录
CREATE POLICY "Users can view own shares" ON public.share_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create shares" ON public.share_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建索引
CREATE INDEX idx_user_invite_codes_user_id ON public.user_invite_codes(user_id);
CREATE INDEX idx_user_invite_codes_code ON public.user_invite_codes(invite_code);
CREATE INDEX idx_invite_records_inviter ON public.invite_records(inviter_id);
CREATE INDEX idx_invite_records_invitee ON public.invite_records(invitee_id);
CREATE INDEX idx_user_rewards_points ON public.user_rewards(total_points DESC);
CREATE INDEX idx_point_transactions_user ON public.point_transactions(user_id);
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX idx_share_records_user ON public.share_records(user_id);

-- 插入默认成就
INSERT INTO public.achievements (name, name_en, description, description_en, icon, category, requirement_type, requirement_value, points_reward, badge_color, display_order) VALUES
-- 邀请成就
('社交新星', 'Social Star', '成功邀请1位好友加入', 'Invite 1 friend to join', '⭐', 'invite', 'invite_count', 1, 50, 'bronze', 1),
('人脉达人', 'Networker', '成功邀请5位好友加入', 'Invite 5 friends to join', '🌟', 'invite', 'invite_count', 5, 200, 'silver', 2),
('社交大使', 'Social Ambassador', '成功邀请10位好友加入', 'Invite 10 friends to join', '💫', 'invite', 'invite_count', 10, 500, 'gold', 3),
('传播之王', 'Viral King', '成功邀请50位好友加入', 'Invite 50 friends to join', '👑', 'invite', 'invite_count', 50, 2000, 'diamond', 4),

-- 饭局成就
('初次约饭', 'First Bite', '参与第1次饭局', 'Join your first dinner', '🍽️', 'dinner', 'dinner_count', 1, 30, 'bronze', 5),
('美食探索者', 'Food Explorer', '参与5次饭局', 'Join 5 dinners', '🥢', 'dinner', 'dinner_count', 5, 100, 'silver', 6),
('饭局达人', 'Dinner Master', '参与20次饭局', 'Join 20 dinners', '🍜', 'dinner', 'dinner_count', 20, 300, 'gold', 7),
('美食家', 'Gourmet', '参与50次饭局', 'Join 50 dinners', '🏅', 'dinner', 'dinner_count', 50, 800, 'diamond', 8),

-- 发起者成就
('饭局发起人', 'Dinner Host', '发起第1次饭局', 'Host your first dinner', '🎉', 'dinner', 'host_count', 1, 50, 'bronze', 9),
('热情组织者', 'Active Organizer', '发起5次饭局', 'Host 5 dinners', '🎊', 'dinner', 'host_count', 5, 150, 'silver', 10),
('超级东道主', 'Super Host', '发起20次饭局', 'Host 20 dinners', '🎁', 'dinner', 'host_count', 20, 400, 'gold', 11),

-- 社交成就
('热门人气', 'Popular', '被10人加入过饭局', 'Have 10 people join your dinners', '❤️', 'social', 'join_received', 10, 200, 'silver', 12),
('社交明星', 'Social Star', '被50人加入过饭局', 'Have 50 people join your dinners', '💖', 'social', 'join_received', 50, 600, 'gold', 13),

-- 里程碑成就
('积分新手', 'Points Starter', '累计获得100积分', 'Earn 100 total points', '🔰', 'milestone', 'total_points', 100, 0, 'bronze', 14),
('积分达人', 'Points Pro', '累计获得1000积分', 'Earn 1000 total points', '💎', 'milestone', 'total_points', 1000, 0, 'gold', 15);

-- 生成邀请码的函数
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- 创建用户邀请码（注册时调用）
CREATE OR REPLACE FUNCTION public.create_user_invite_code(target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  -- 检查是否已有邀请码
  SELECT invite_code INTO new_code FROM user_invite_codes WHERE user_id = target_user_id;
  IF new_code IS NOT NULL THEN
    RETURN new_code;
  END IF;
  
  -- 生成唯一邀请码
  LOOP
    new_code := generate_invite_code();
    BEGIN
      INSERT INTO user_invite_codes (user_id, invite_code) VALUES (target_user_id, new_code);
      RETURN new_code;
    EXCEPTION WHEN unique_violation THEN
      attempts := attempts + 1;
      IF attempts > 10 THEN
        RAISE EXCEPTION 'Failed to generate unique invite code';
      END IF;
    END;
  END LOOP;
END;
$$;

-- 处理邀请注册
CREATE OR REPLACE FUNCTION public.process_invite_registration(
  invitee_user_id UUID,
  used_invite_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inviter_user_id UUID;
  inviter_reward INTEGER := 100;
  invitee_reward INTEGER := 50;
  result JSONB;
BEGIN
  -- 查找邀请码对应的用户
  SELECT user_id INTO inviter_user_id 
  FROM user_invite_codes 
  WHERE invite_code = used_invite_code AND is_active = true;
  
  IF inviter_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '无效的邀请码');
  END IF;
  
  -- 不能自己邀请自己
  IF inviter_user_id = invitee_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', '不能使用自己的邀请码');
  END IF;
  
  -- 检查是否已被邀请过
  IF EXISTS (SELECT 1 FROM invite_records WHERE invitee_id = invitee_user_id) THEN
    RETURN jsonb_build_object('success', false, 'message', '已经使用过邀请码');
  END IF;
  
  -- 创建邀请记录
  INSERT INTO invite_records (inviter_id, invitee_id, invite_code, status, completed_at)
  VALUES (inviter_user_id, invitee_user_id, used_invite_code, 'completed', now());
  
  -- 更新邀请码统计
  UPDATE user_invite_codes 
  SET successful_invites = successful_invites + 1,
      total_invites = total_invites + 1,
      updated_at = now()
  WHERE invite_code = used_invite_code;
  
  -- 给邀请者奖励积分
  INSERT INTO user_rewards (user_id, total_points, invite_points)
  VALUES (inviter_user_id, inviter_reward, inviter_reward)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_rewards.total_points + inviter_reward,
    invite_points = user_rewards.invite_points + inviter_reward,
    updated_at = now();
  
  -- 记录邀请者积分交易
  INSERT INTO point_transactions (user_id, points, transaction_type, description, related_id)
  VALUES (inviter_user_id, inviter_reward, 'invite', '邀请好友注册奖励', invitee_user_id);
  
  -- 给被邀请者奖励积分
  INSERT INTO user_rewards (user_id, total_points, invite_points)
  VALUES (invitee_user_id, invitee_reward, invitee_reward)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_rewards.total_points + invitee_reward,
    invite_points = user_rewards.invite_points + invitee_reward,
    updated_at = now();
  
  -- 记录被邀请者积分交易
  INSERT INTO point_transactions (user_id, points, transaction_type, description, related_id)
  VALUES (invitee_user_id, invitee_reward, 'invite', '受邀注册奖励', inviter_user_id);
  
  -- 更新邀请记录
  UPDATE invite_records 
  SET inviter_rewarded = true, invitee_rewarded = true
  WHERE invitee_id = invitee_user_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', '邀请奖励已发放',
    'inviter_reward', inviter_reward,
    'invitee_reward', invitee_reward
  );
END;
$$;

-- 获取排行榜
CREATE OR REPLACE FUNCTION public.get_invite_leaderboard(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  nickname TEXT,
  avatar_url TEXT,
  invite_count INTEGER,
  total_points INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY uic.successful_invites DESC, ur.total_points DESC) as rank,
    uic.user_id,
    p.nickname,
    p.avatar_url,
    uic.successful_invites as invite_count,
    COALESCE(ur.total_points, 0) as total_points
  FROM user_invite_codes uic
  JOIN profiles p ON p.user_id = uic.user_id
  LEFT JOIN user_rewards ur ON ur.user_id = uic.user_id
  WHERE uic.successful_invites > 0
  ORDER BY uic.successful_invites DESC, ur.total_points DESC
  LIMIT limit_count;
END;
$$;

-- 更新时间戳触发器
CREATE TRIGGER update_user_invite_codes_updated_at
  BEFORE UPDATE ON public.user_invite_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_rewards_updated_at
  BEFORE UPDATE ON public.user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();