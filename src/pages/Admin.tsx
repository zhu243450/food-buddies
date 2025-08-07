import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, AlertCircle, Shield, ArrowLeft, Search, Crown, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
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

interface Profile {
  id: string;
  user_id: string;
  nickname: string;
  gender?: string;
  birth_year?: number;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [dinnerStats, setDinnerStats] = useState<DinnerStats | null>(null);
  const [cancellationStats, setCancellationStats] = useState<CancellationStats | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentUser, setCurrentUser] = useState<any>(null);

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
      setCurrentUser(user);
      setUserRoles(roles || []);
      await loadStats();
      await loadUsers();
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

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(profilesData || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('加载用户列表失败');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // 获取当前用户的角色
      const { data: currentRoles } = await supabase.rpc('get_user_roles', { 
        _user_id: userId 
      });

      // 如果是设置为admin并且用户还不是admin
      if (newRole === 'admin' && !currentRoles?.some((r: UserRole) => r.role === 'admin')) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin', assigned_by: currentUser?.id });
        
        if (error) throw error;
        toast.success('用户已设置为管理员');
      } 
      // 如果是移除admin角色
      else if (newRole === 'user' && currentRoles?.some((r: UserRole) => r.role === 'admin')) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        
        if (error) throw error;
        toast.success('管理员权限已移除');
      }

      // 重新加载用户列表
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      toast.error('角色更新失败: ' + error.message);
    }
  };

  const getUserRole = async (userId: string): Promise<string> => {
    try {
      const { data: roles } = await supabase.rpc('get_user_roles', { 
        _user_id: userId 
      });
      return roles?.some((r: UserRole) => r.role === 'admin') ? 'admin' : 'user';
    } catch {
      return 'user';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (roleFilter === 'all') return matchesSearch;
    
    // 这里需要异步检查角色，但为了简化，我们暂时显示所有用户
    return matchesSearch;
  });

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">数据概览</TabsTrigger>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="management">系统管理</TabsTrigger>
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

          <TabsContent value="users" className="space-y-6">
            {/* 搜索和筛选 */}
            <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-primary" />
                  用户管理
                </CardTitle>
                <CardDescription>管理平台用户和权限</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="搜索用户昵称或ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="筛选角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有用户</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="user">普通用户</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={loadUsers}
                    variant="outline"
                    disabled={usersLoading}
                    className="w-full sm:w-auto"
                  >
                    {usersLoading ? "加载中..." : "刷新"}
                  </Button>
                </div>

                {/* 用户表格 */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-16">头像</TableHead>
                        <TableHead>昵称</TableHead>
                        <TableHead className="hidden md:table-cell">性别</TableHead>
                        <TableHead className="hidden md:table-cell">年龄</TableHead>
                        <TableHead>角色</TableHead>
                        <TableHead className="hidden sm:table-cell">注册时间</TableHead>
                        <TableHead className="w-24">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-muted-foreground mt-2">加载中...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <p className="text-muted-foreground">暂无用户数据</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((profile) => (
                          <UserRow 
                            key={profile.id} 
                            profile={profile} 
                            onRoleChange={handleRoleChange}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>系统管理</CardTitle>
                <CardDescription>系统设置和高级管理功能</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">系统管理功能正在开发中...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    将支持系统设置、数据导出等功能
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

// 用户行组件
interface UserRowProps {
  profile: Profile;
  onRoleChange: (userId: string, newRole: string) => void;
}

const UserRow: React.FC<UserRowProps> = ({ profile, onRoleChange }) => {
  const [currentRole, setCurrentRole] = useState<string>('user');
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const { data: roles } = await supabase.rpc('get_user_roles', { 
          _user_id: profile.user_id 
        });
        setCurrentRole(roles?.some((r: UserRole) => r.role === 'admin') ? 'admin' : 'user');
      } catch (error) {
        console.error('Failed to load user role:', error);
      }
    };
    loadUserRole();
  }, [profile.user_id]);

  const handleRoleChange = async (newRole: string) => {
    setRoleLoading(true);
    await onRoleChange(profile.user_id, newRole);
    setCurrentRole(newRole);
    setRoleLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAge = (birthYear?: number) => {
    if (!birthYear) return '-';
    return new Date().getFullYear() - birthYear;
  };

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.nickname}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-primary">
              {profile.nickname[0]?.toUpperCase()}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{profile.nickname}</span>
          <span className="text-xs text-muted-foreground truncate">
            {profile.user_id.slice(0, 8)}...
          </span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {profile.gender || '-'}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {getAge(profile.birth_year)}
      </TableCell>
      <TableCell>
        <Badge 
          variant={currentRole === 'admin' ? 'default' : 'secondary'}
          className={currentRole === 'admin' ? 'bg-primary text-black' : ''}
        >
          {currentRole === 'admin' ? (
            <>
              <Crown className="w-3 h-3 mr-1" />
              管理员
            </>
          ) : (
            '普通用户'
          )}
        </Badge>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {formatDate(profile.created_at)}
      </TableCell>
      <TableCell>
        <Select 
          value={currentRole} 
          onValueChange={handleRoleChange}
          disabled={roleLoading}
        >
          <SelectTrigger className="w-20 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">用户</SelectItem>
            <SelectItem value="admin">管理员</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
};

export default Admin;