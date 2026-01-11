import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserRewards {
  totalPoints: number;
  invitePoints: number;
  dinnerPoints: number;
  achievementPoints: number;
  level: number;
  loading: boolean;
}

interface Achievement {
  id: string;
  name: string;
  name_en: string | null;
  description: string;
  description_en: string | null;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points_reward: number;
  badge_color: string;
  unlocked?: boolean;
  unlocked_at?: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  invite_count: number;
  total_points: number;
}

export function useUserRewards(userId: string | undefined) {
  const [rewards, setRewards] = useState<UserRewards>({
    totalPoints: 0,
    invitePoints: 0,
    dinnerPoints: 0,
    achievementPoints: 0,
    level: 1,
    loading: true
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!userId) {
      setRewards(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchRewardsData = async () => {
      try {
        // 获取用户积分
        const { data: rewardsData, error: rewardsError } = await supabase
          .from('user_rewards')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!rewardsError && rewardsData) {
          setRewards({
            totalPoints: rewardsData.total_points,
            invitePoints: rewardsData.invite_points,
            dinnerPoints: rewardsData.dinner_points,
            achievementPoints: rewardsData.achievement_points,
            level: rewardsData.level,
            loading: false
          });
        } else {
          setRewards(prev => ({ ...prev, loading: false }));
        }

        // 获取所有成就
        const { data: allAchievements, error: achievementsError } = await supabase
          .from('achievements')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (!achievementsError && allAchievements) {
          setAchievements(allAchievements);
        }

        // 获取用户已解锁的成就
        const { data: userAchievementsData, error: userAchievementsError } = await supabase
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', userId);

        if (!userAchievementsError && userAchievementsData) {
          setUserAchievements(userAchievementsData.map(ua => ua.achievement_id));
        }

        // 获取排行榜
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .rpc('get_invite_leaderboard', { limit_count: 20 });

        if (!leaderboardError && leaderboardData) {
          setLeaderboard(leaderboardData);
        }

      } catch (error) {
        console.error('获取积分数据失败:', error);
        setRewards(prev => ({ ...prev, loading: false }));
      }
    };

    fetchRewardsData();
  }, [userId]);

  // 合并成就和解锁状态
  const achievementsWithStatus = achievements.map(a => ({
    ...a,
    unlocked: userAchievements.includes(a.id)
  }));

  return {
    rewards,
    achievements: achievementsWithStatus,
    leaderboard
  };
}
