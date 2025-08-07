import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, AlertCircle, Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface UserStats {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
}

interface DinnerStats {
  total_dinners: number;
  active_dinners: number;
  completed_dinners: number;
  cancelled_dinners: number;
}

interface CancellationStats {
  total_cancellations: number;
  late_cancellations: number;
  cancellation_rate: number;
}

interface UserRole {
  role: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [dinnerStats, setDinnerStats] = useState<DinnerStats | null>(null);
  const [cancellationStats, setCancellationStats] = useState<CancellationStats | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // 检查用户角色
      const { data: roles, error } = await supabase.rpc('get_user_roles', { 
        _user_id: user.id 
      });

      if (error) throw error;

      const isUserAdmin = roles?.some((role: UserRole) => role.role === 'admin');
      
      if (!isUserAdmin) {
        toast.error('无权限访问管理页面');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setUserRoles(roles || []);
      await loadStats();
    } catch (error) {
      console.error('Admin access check failed:', error);
      toast.error('权限检查失败');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // 加载用户统计
      const { data: userStatsData, error: userStatsError } = await supabase.rpc('get_admin_user_stats');
      if (userStatsError) throw userStatsError;
      if (userStatsData && userStatsData.length > 0) {
        setUserStats(userStatsData[0]);
      }

      // 加载饭局统计
      const { data: dinnerStatsData, error: dinnerStatsError } = await supabase.rpc('get_admin_dinner_stats');
      if (dinnerStatsError) throw dinnerStatsError;
      if (dinnerStatsData && dinnerStatsData.length > 0) {
        setDinnerStats(dinnerStatsData[0]);
      }

      // 加载取消统计
      const { data: cancellationStatsData, error: cancellationStatsError } = await supabase.rpc('get_admin_cancellation_stats');
      if (cancellationStatsError) throw cancellationStatsError;
      if (cancellationStatsData && cancellationStatsData.length > 0) {
        setCancellationStats(cancellationStatsData[0]);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('加载统计数据失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border/40 sticky top-0 z-40 backdrop-blur-lg bg-card/95">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              管理后台
            </h1>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            管理员
          </Badge>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 pb-20">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">数据概览</TabsTrigger>
            <TabsTrigger value="management">用户管理</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* 用户统计 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总用户数</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {userStats?.total_users || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    活跃用户: {userStats?.active_users || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-accent/20 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">本月新用户</CardTitle>
                  <Users className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    {userStats?.new_users_this_month || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    较上月增长
                  </p>
                </CardContent>
              </Card>

              <Card className="border-secondary/20 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">活跃度</CardTitle>
                  <Calendar className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">
                    {userStats?.total_users && userStats.total_users > 0 
                      ? Math.round((userStats.active_users / userStats.total_users) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    30天活跃率
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 饭局统计 */}
            <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  饭局统计
                </CardTitle>
                <CardDescription>平台饭局数据概览</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-primary">
                      {dinnerStats?.total_dinners || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">总饭局</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-accent">
                      {dinnerStats?.active_dinners || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">进行中</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-secondary">
                      {dinnerStats?.completed_dinners || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">已完成</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-destructive">
                      {dinnerStats?.cancelled_dinners || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">已取消</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 取消统计 */}
            <Card className="border-destructive/20 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  取消统计
                </CardTitle>
                <CardDescription>用户取消行为分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-destructive">
                      {cancellationStats?.total_cancellations || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">总取消次数</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-orange-500">
                      {cancellationStats?.late_cancellations || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">迟到取消</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-red-500">
                      {cancellationStats?.cancellation_rate ? 
                        Math.round(cancellationStats.cancellation_rate * 100) / 100 : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">取消率</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>用户管理</CardTitle>
                <CardDescription>管理用户权限和角色</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">用户管理功能正在开发中...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    将支持用户角色管理、权限设置等功能
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;