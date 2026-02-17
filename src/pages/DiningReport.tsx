import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Users, Heart, Utensils, TrendingUp, Award, ChefHat, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const DiningReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  const { data: report, isLoading } = useQuery({
    queryKey: ['dining-report', user?.id, period],
    queryFn: async () => {
      if (!user) return null;

      const now = new Date();
      const start = period === 'month' ? startOfMonth(now) : startOfMonth(subMonths(now, 11));
      const end = endOfMonth(now);

      // Dinners created
      const { data: created } = await supabase
        .from('dinners')
        .select('id, title, food_preferences, dinner_time, location')
        .eq('created_by', user.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Dinners participated
      const { data: participated } = await supabase
        .from('dinner_participants')
        .select('dinner_id, joined_at')
        .eq('user_id', user.id)
        .gte('joined_at', start.toISOString())
        .lte('joined_at', end.toISOString());

      const allDinnerIds = [
        ...(created || []).map(d => d.id),
        ...(participated || []).map(p => p.dinner_id),
      ];
      const uniqueDinnerIds = [...new Set(allDinnerIds)];

      // Get all dinners details for cuisine stats
      let dinnerDetails: any[] = created || [];
      if (participated?.length) {
        const { data: joinedDinners } = await supabase
          .from('dinners')
          .select('id, title, food_preferences, dinner_time, location')
          .in('id', participated.map(p => p.dinner_id));
        dinnerDetails = [...dinnerDetails, ...(joinedDinners || [])];
      }

      // Unique people met
      const { data: coParticipants } = await supabase
        .from('dinner_participants')
        .select('user_id')
        .in('dinner_id', uniqueDinnerIds)
        .neq('user_id', user.id);
      const uniquePeople = new Set((coParticipants || []).map(p => p.user_id));

      // Cuisine frequency
      const cuisineCount = new Map<string, number>();
      dinnerDetails.forEach(d => {
        (d.food_preferences || []).forEach((cuisine: string) => {
          cuisineCount.set(cuisine, (cuisineCount.get(cuisine) || 0) + 1);
        });
      });
      const topCuisines = [...cuisineCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Location frequency
      const locationCount = new Map<string, number>();
      dinnerDetails.forEach(d => {
        const loc = d.location?.split(/[,，]/)[0]?.trim() || '未知';
        locationCount.set(loc, (locationCount.get(loc) || 0) + 1);
      });
      const topLocations = [...locationCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      // Points earned
      const { data: points } = await supabase
        .from('point_transactions')
        .select('points')
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString())
        .gt('points', 0);

      const totalPointsEarned = (points || []).reduce((sum, p) => sum + p.points, 0);

      // Posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString());

      return {
        dinnersCreated: (created || []).length,
        dinnersJoined: (participated || []).length,
        totalDinners: uniqueDinnerIds.length,
        peopleMet: uniquePeople.size,
        topCuisines,
        topLocations,
        totalPointsEarned,
        postsCount: postsCount || 0,
        period,
      };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/40">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground flex-1">饮食报告</h1>
          <div className="flex items-center bg-muted rounded-full p-0.5">
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                period === 'month' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              本月
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                period === 'year' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              年度
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : report ? (
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-4 text-center">
                <Utensils className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{report.totalDinners}</p>
                <p className="text-xs text-muted-foreground">总饭局数</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-pink-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{report.peopleMet}</p>
                <p className="text-xs text-muted-foreground">认识新朋友</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
              <CardContent className="p-4 text-center">
                <Award className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{report.totalPointsEarned}</p>
                <p className="text-xs text-muted-foreground">获得积分</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <CardContent className="p-4 text-center">
                <Heart className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{report.postsCount}</p>
                <p className="text-xs text-muted-foreground">发布动态</p>
              </CardContent>
            </Card>
          </div>

          {/* Dinner breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                饭局参与
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">发起饭局</span>
                <span className="font-semibold">{report.dinnersCreated} 次</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">参加饭局</span>
                <span className="font-semibold">{report.dinnersJoined} 次</span>
              </div>
            </CardContent>
          </Card>

          {/* Top cuisines */}
          {report.topCuisines.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-primary" />
                  最爱菜系 TOP {report.topCuisines.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.topCuisines.map(([cuisine, count], i) => {
                  const maxCount = report.topCuisines[0][1];
                  return (
                    <div key={cuisine} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
                          {cuisine}
                        </span>
                        <span className="text-muted-foreground">{count}次</span>
                      </div>
                      <Progress value={(count / maxCount) * 100} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Top locations */}
          {report.topLocations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  常去地点
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {report.topLocations.map(([loc, count]) => (
                    <Badge key={loc} variant="secondary" className="text-xs">
                      📍 {loc} ({count}次)
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DiningReport;
