import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Gift, Trophy, Users, Ticket, Image, Wallet } from 'lucide-react';
import { InviteCard } from '@/components/growth/InviteCard';
import { LeaderboardCard } from '@/components/growth/LeaderboardCard';
import { AchievementsCard } from '@/components/growth/AchievementsCard';
import { PointsDisplay } from '@/components/growth/PointsDisplay';
import { CouponCard } from '@/components/growth/CouponCard';
import { InvitePoster } from '@/components/growth/InvitePoster';
import { WithdrawalCard } from '@/components/growth/WithdrawalCard';
const GrowthCenter = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const userId = user?.id;

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
          <TabsList className="grid w-full grid-cols-6 bg-gradient-primary shadow-lg">
            <TabsTrigger 
              value="invite" 
              className="data-[state=active]:bg-background text-primary-foreground data-[state=active]:text-primary gap-1 text-xs px-1"
            >
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">{i18n.language === 'zh' ? '邀请' : 'Invite'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="withdrawal"
              className="data-[state=active]:bg-background text-primary-foreground data-[state=active]:text-primary gap-1 text-xs px-1"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">{i18n.language === 'zh' ? '提现' : 'Cash'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="poster"
              className="data-[state=active]:bg-background text-primary-foreground data-[state=active]:text-primary gap-1 text-xs px-1"
            >
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">{i18n.language === 'zh' ? '海报' : 'Poster'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="coupons"
              className="data-[state=active]:bg-background text-primary-foreground data-[state=active]:text-primary gap-1 text-xs px-1"
            >
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">{i18n.language === 'zh' ? '优惠券' : 'Coupons'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard"
              className="data-[state=active]:bg-background text-primary-foreground data-[state=active]:text-primary gap-1 text-xs px-1"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">{i18n.language === 'zh' ? '排行' : 'Rank'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="achievements"
              className="data-[state=active]:bg-background text-primary-foreground data-[state=active]:text-primary gap-1 text-xs px-1"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{i18n.language === 'zh' ? '成就' : 'Badge'}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invite" className="mt-4 space-y-4">
            <InviteCard userId={userId!} />
          </TabsContent>

          <TabsContent value="withdrawal" className="mt-4">
            <WithdrawalCard userId={userId} />
          </TabsContent>

          <TabsContent value="poster" className="mt-4">
            <InvitePoster />
          </TabsContent>

          <TabsContent value="coupons" className="mt-4">
            <CouponCard />
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
