import { ArrowLeft, Users, Utensils, MessageCircle, UserPlus, Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface DiningBuddy {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  dinner_count: number;
  last_dinner_time: string;
  is_friend: boolean;
}

const DiningBuddies = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: buddies, isLoading } = useQuery({
    queryKey: ['dining-buddies', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all dinners user participated in (as creator or participant)
      const { data: myParticipations } = await supabase
        .from('dinner_participants')
        .select('dinner_id')
        .eq('user_id', user.id);

      const { data: myCreated } = await supabase
        .from('dinners')
        .select('id')
        .eq('created_by', user.id);

      const allDinnerIds = [
        ...(myParticipations || []).map(p => p.dinner_id),
        ...(myCreated || []).map(d => d.id),
      ];
      const uniqueDinnerIds = [...new Set(allDinnerIds)];

      if (uniqueDinnerIds.length === 0) return [];

      // Get all co-participants
      const { data: coParticipants } = await supabase
        .from('dinner_participants')
        .select('user_id, dinner_id, joined_at')
        .in('dinner_id', uniqueDinnerIds)
        .neq('user_id', user.id);

      // Also get dinner creators
      const { data: dinnerCreators } = await supabase
        .from('dinners')
        .select('id, created_by, dinner_time')
        .in('id', uniqueDinnerIds)
        .neq('created_by', user.id);

      // Count frequency per user
      const buddyMap = new Map<string, { count: number; lastTime: string }>();

      (coParticipants || []).forEach(p => {
        const existing = buddyMap.get(p.user_id);
        if (existing) {
          existing.count += 1;
          if (p.joined_at > existing.lastTime) existing.lastTime = p.joined_at;
        } else {
          buddyMap.set(p.user_id, { count: 1, lastTime: p.joined_at });
        }
      });

      (dinnerCreators || []).forEach(d => {
        const existing = buddyMap.get(d.created_by);
        if (existing) {
          existing.count += 1;
          if (d.dinner_time > existing.lastTime) existing.lastTime = d.dinner_time;
        } else {
          buddyMap.set(d.created_by, { count: 1, lastTime: d.dinner_time });
        }
      });

      // Sort by frequency
      const sortedBuddyIds = [...buddyMap.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 20)
        .map(([id]) => id);

      if (sortedBuddyIds.length === 0) return [];

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', sortedBuddyIds);

      // Get friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const friendIds = new Set(
        (friendships || []).map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id)
      );

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      return sortedBuddyIds.map(id => {
        const profile = profileMap.get(id);
        const buddy = buddyMap.get(id)!;
        return {
          user_id: id,
          nickname: profile?.nickname || '用户',
          avatar_url: profile?.avatar_url || null,
          dinner_count: buddy.count,
          last_dinner_time: buddy.lastTime,
          is_friend: friendIds.has(id),
        } as DiningBuddy;
      });
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/40">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground flex-1">我的饭搭子</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dining-report')} className="text-xs text-muted-foreground">
            饮食报告 →
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Description */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">常一起吃饭的人</p>
              <p className="text-xs text-muted-foreground">根据你的约饭历史，这些是你最常一起吃饭的伙伴</p>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !buddies?.length ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-4xl">👥</div>
            <p className="text-muted-foreground">还没有饭搭子</p>
            <p className="text-xs text-muted-foreground">多参加饭局，就能找到志同道合的饭友啦！</p>
            <Button variant="outline" onClick={() => navigate('/discover')}>
              去发现饭局
            </Button>
          </div>
        ) : (
          buddies.map((buddy, i) => (
            <Card
              key={buddy.user_id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/user/${buddy.user_id}`)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={buddy.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {buddy.nickname.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {i < 3 && (
                    <span className="absolute -top-1 -left-1 text-sm">
                      {['🥇', '🥈', '🥉'][i]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground truncate">{buddy.nickname}</p>
                    {buddy.is_friend && (
                      <Badge variant="secondary" className="text-xs shrink-0">好友</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Utensils className="w-3 h-3" />
                    一起吃过 {buddy.dinner_count} 次饭
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user/${buddy.user_id}`);
                }}>
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DiningBuddies;
