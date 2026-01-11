import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Gift, Trophy, Users } from 'lucide-react';
import { InviteCard } from '@/components/growth/InviteCard';
import { LeaderboardCard } from '@/components/growth/LeaderboardCard';
import { AchievementsCard } from '@/components/growth/AchievementsCard';
import { PointsDisplay } from '@/components/growth/PointsDisplay';

const GrowthCenter = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUserId(user.id);
      setLoading(false);
    };
    getUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">
            {i18n.language === 'zh' ? '增长中心' : 'Growth Center'}
          </h1>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 积分显示 */}
        <PointsDisplay userId={userId} />

        {/* 标签页 */}
        <Tabs defaultValue="invite" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-primary shadow-lg">
            <TabsTrigger 
              value="invite" 
              className="data-[state=active]:bg-background text-primary-foreground data-[state=active]:text-primary gap-1.5"
            >
              <Gift className="h-4 w-4" />
              {i18n.language === 'zh' ? '邀请' : 'Invite'}
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard"
              className="data-[state=active]:bg-background text-primary-foreground data-[state=active]:text-primary gap-1.5"
            >
              <Trophy className="h-4 w-4" />
              {i18n.language === 'zh' ? '排行榜' : 'Rank'}
            </TabsTrigger>
            <TabsTrigger 
              value="achievements"
              className="data-[state=active]:bg-background text-primary-foreground data-[state=active]:text-primary gap-1.5"
            >
              <Users className="h-4 w-4" />
              {i18n.language === 'zh' ? '成就' : 'Badges'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invite" className="mt-4 space-y-4">
            <InviteCard userId={userId!} />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4">
            <LeaderboardCard userId={userId} />
          </TabsContent>

          <TabsContent value="achievements" className="mt-4">
            <AchievementsCard userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GrowthCenter;
