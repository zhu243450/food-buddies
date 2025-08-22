import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dinner } from "@/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, AlertCircle, Shield, ArrowLeft, Search, Crown, UserCog, Eye, Ban, UserX, MessageSquareOff, Image as ImageIcon } from "lucide-react";
import { EvidenceImageViewer } from '@/components/EvidenceImageViewer';
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { AdminChatInvestigation } from "./AdminChatInvestigation";

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
  is_banned?: boolean;
  ban_reason?: string;
  banned_at?: string;
  banned_until?: string;
  banned_by?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  // 饭局管理相关状态
  const [dinners, setDinners] = useState<Dinner[]>([]);
  const [dinnersLoading, setDinnersLoading] = useState(false);
  const [dinnerSearch, setDinnerSearch] = useState("");
  const [dinnerStatus, setDinnerStatus] = useState<string>("all");
  const [creatorMap, setCreatorMap] = useState<Record<string, Profile>>({});
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  // 详情弹窗相关
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDinner, setSelectedDinner] = useState<Dinner | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailParticipants, setDetailParticipants] = useState<Array<{ user_id: string; joined_at: string; profile?: Profile }>>([]);
  const [detailCreator, setDetailCreator] = useState<Profile | null>(null);

  // 权限管理相关状态
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<string>('');
  const [banLoading, setBanLoading] = useState(false);

  // 举报/反馈管理相关状态
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState("");
  const [reportType, setReportType] = useState<string>('all');
  const [reportStatus, setReportStatus] = useState<string>('all');
  const [pendingReports, setPendingReports] = useState<number>(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // 聊天记录审查相关状态
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedChatSession, setSelectedChatSession] = useState<any>(null);
  const [accessJustification, setAccessJustification] = useState('');

  // 审计日志查看状态
  const [auditLogOpen, setAuditLogOpen] = useState(false);

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
      await Promise.all([loadStats(), loadUsers(), loadReports()]);
      await loadDinners();
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

  const loadDinners = async () => {
    setDinnersLoading(true);
    try {
      const { data: dinnersData, error } = await supabase
        .from('dinners')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDinners(dinnersData || []);

      const creatorIds = Array.from(new Set((dinnersData || []).map((d: any) => d.created_by)));
      const dinnerIds = (dinnersData || []).map((d: any) => d.id);

      const [profilesRes, partsRes] = await Promise.all([
        creatorIds.length
          ? supabase.from('profiles').select('user_id,nickname,avatar_url').in('user_id', creatorIds)
          : Promise.resolve({ data: [], error: null } as any),
        dinnerIds.length
          ? supabase.from('dinner_participants').select('dinner_id,user_id').in('dinner_id', dinnerIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if ((profilesRes as any).error) throw (profilesRes as any).error;
      if ((partsRes as any).error) throw (partsRes as any).error;

      const cMap: Record<string, Profile> = {};
      ((profilesRes as any).data || []).forEach((p: any) => {
        cMap[p.user_id] = p as Profile;
      });
      setCreatorMap(cMap);

      const counts: Record<string, number> = {};
      ((partsRes as any).data || []).forEach((row: any) => {
        counts[row.dinner_id] = (counts[row.dinner_id] || 0) + 1;
      });
      setParticipantCounts(counts);
    } catch (error) {
      console.error('Failed to load dinners:', error);
      toast.error('加载饭局列表失败');
    } finally {
      setDinnersLoading(false);
    }
  };

  // 举报/反馈：加载列表
  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReports(data || []);
      setPendingReports((data || []).filter((r: any) => r.status === 'pending').length);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('加载举报/反馈失败');
    } finally {
      setReportsLoading(false);
    }
  };

  // 举报/反馈：更新状态
  const updateReportStatus = async (reportId: string, newStatus: 'pending' | 'in_progress' | 'resolved') => {
    try {
      setStatusUpdating(true);
      const updates: any = { status: newStatus };
      if (newStatus === 'resolved') {
        updates.resolved_by = currentUser?.id;
        updates.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', reportId);
      if (error) throw error;
      toast.success('状态已更新');
      await loadReports();
    } catch (e) {
      console.error('更新举报状态失败:', e);
      toast.error('更新失败');
    } finally {
      setStatusUpdating(false);
    }
  };

  // 聊天记录审查相关方法
  const openChatInvestigation = async (report: any) => {
    if (!report.related_chat_session_id && !report.reported_user_id) {
      toast.error('该举报没有相关的聊天记录');
      return;
    }

    setChatLoading(true);
    setSelectedReport(report);
    setChatDialogOpen(true);
    setAccessJustification(`调查举报: ${report.title}`);

    try {
      // 获取相关聊天会话列表
      const { data: sessions, error } = await supabase.rpc('admin_get_reportable_chat_sessions', {
        report_id_param: report.id
      });

      if (error) throw error;
      setChatSessions(sessions || []);

      // 如果只有一个会话，自动加载消息
      if (sessions && sessions.length === 1) {
        await loadChatMessages(sessions[0].session_id, report.id);
      }
    } catch (error: any) {
      console.error('Failed to load chat sessions:', error);
      toast.error('加载聊天会话失败: ' + error.message);
    } finally {
      setChatLoading(false);
    }
  };

  const loadChatMessages = async (sessionId: string, reportId: string) => {
    setChatLoading(true);
    try {
      const { data: messages, error } = await supabase.rpc('admin_access_chat_messages', {
        session_id_param: sessionId,
        report_id_param: reportId,
        justification_param: accessJustification || '举报调查'
      });

      if (error) throw error;
      setChatMessages(messages || []);
      setSelectedChatSession(chatSessions.find(s => s.session_id === sessionId) || null);
    } catch (error: any) {
      console.error('Failed to load chat messages:', error);
      toast.error('加载聊天记录失败: ' + error.message);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('reports-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          setPendingReports((prev) => prev + 1);
          const r: any = payload.new;
          toast.message('收到新的反馈/举报', {
            description: `${r.report_type} · ${r.title}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const openDinner = async (d: Dinner) => {
    try {
      setSelectedDinner(d);
      setDetailsLoading(true);
      setDetailsOpen(true);

      const { data: parts, error: partsErr } = await supabase
        .from('dinner_participants')
        .select('user_id, joined_at')
        .eq('dinner_id', d.id);
      if (partsErr) throw partsErr;

      const ids = Array.from(new Set([d.created_by, ...((parts || []).map((p: any) => p.user_id))]));
      const { data: profs, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', ids);
      if (profErr) throw profErr;

      const pmap: Record<string, Profile> = {};
      (profs || []).forEach((p: any) => { pmap[p.user_id] = p as Profile; });
      setDetailCreator(pmap[d.created_by] || null);

      const enriched = (parts || []).map((p: any) => ({
        user_id: p.user_id,
        joined_at: p.joined_at,
        profile: pmap[p.user_id],
      }));
      setDetailParticipants(enriched);
    } catch (e) {
      console.error('加载详情失败', e);
      toast.error('加载详情失败');
    } finally {
      setDetailsLoading(false);
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

  // 权限管理方法
  const handleBanUser = (user: Profile) => {
    setSelectedUser(user);
    setBanReason('');
    setBanDuration('24');
    setBanDialogOpen(true);
  };

  const handleUnbanUser = async (user: Profile) => {
    try {
      setBanLoading(true);
      const { data, error } = await supabase.rpc('manage_user_permissions', {
        target_user_id: user.user_id,
        action: 'unban'
      });

      if (error) throw error;
      
      const result = data?.[0];
      if (result?.success) {
        toast.success(result.message);
        await loadUsers();
      } else {
        toast.error(result?.message || '解禁操作失败');
      }
    } catch (error: any) {
      console.error('Unban user failed:', error);
      toast.error('解禁用户失败: ' + error.message);
    } finally {
      setBanLoading(false);
    }
  };

  const confirmBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast.error('请填写禁言原因');
      return;
    }

    try {
      setBanLoading(true);
      const durationHours = banDuration === 'permanent' ? null : parseInt(banDuration);
      
      const { data, error } = await supabase.rpc('manage_user_permissions', {
        target_user_id: selectedUser.user_id,
        action: 'ban',
        reason: banReason.trim(),
        ban_duration_hours: durationHours
      });

      if (error) throw error;
      
      const result = data?.[0];
      if (result?.success) {
        toast.success(result.message);
        setBanDialogOpen(false);
        await loadUsers();
      } else {
        toast.error(result?.message || '禁言操作失败');
      }
    } catch (error: any) {
      console.error('Ban user failed:', error);
      toast.error('禁言用户失败: ' + error.message);
    } finally {
      setBanLoading(false);
    }
  };
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = user.nickname.toLowerCase().includes(term) ||
                          user.user_id.toLowerCase().includes(term);
    if (roleFilter === 'all') return matchesSearch;
    // 简化：角色过滤在界面展示时处理
    return matchesSearch;
  });

  const filteredDinners = dinners.filter((d) => {
    const keyword = dinnerSearch.trim().toLowerCase();
    const creatorName = creatorMap[d.created_by]?.nickname?.toLowerCase() || '';
    const matchesSearch =
      !keyword ||
      d.title.toLowerCase().includes(keyword) ||
      (d.location || '').toLowerCase().includes(keyword) ||
      creatorName.includes(keyword);
    const statusValue = (d as any).status || 'active';
    const statusOk = dinnerStatus === 'all' || statusValue === dinnerStatus;
    return matchesSearch && statusOk;
  });

  const filteredReports = reports.filter((r: any) => {
    const keyword = reportSearch.trim().toLowerCase();
    const matchesSearch =
      !keyword ||
      r.title.toLowerCase().includes(keyword) ||
      (r.description || '').toLowerCase().includes(keyword);
    const typeOk = reportType === 'all' || r.report_type === reportType;
    const statusOk = reportStatus === 'all' || r.status === reportStatus;
    return matchesSearch && typeOk && statusOk;
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
            {t('common.back')}
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('admin.dashboard')}
            </h1>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {t('admin.admin', '管理员')}
          </Badge>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 pb-20">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">数据概览</TabsTrigger>
            <TabsTrigger value="dinners">饭局管理</TabsTrigger>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="reports">
              举报/反馈
              {pendingReports > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingReports}</Badge>
              )}
            </TabsTrigger>
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
                  {t('admin.cancellationStats')}
                </CardTitle>
                <CardDescription>{t('admin.cancellationAnalysis')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-destructive">
                      {cancellationStats?.total_cancellations || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('admin.totalCancellations')}</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-orange-500">
                      {cancellationStats?.late_cancellations || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('admin.lateCancellations')}</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-red-500">
                      {cancellationStats?.cancellation_rate ? 
                        Math.round(cancellationStats.cancellation_rate * 100) / 100 : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">{t('admin.cancellationRate')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dinners" className="space-y-6">
            <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  饭局管理
                </CardTitle>
                <CardDescription>查看并管理平台上的饭局</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t('admin.searchDinners')}
                      value={dinnerSearch}
                      onChange={(e) => setDinnerSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={dinnerStatus} onValueChange={setDinnerStatus}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder={t('admin.filterByStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('admin.allStatuses')}</SelectItem>
                      <SelectItem value="active">{t('admin.active')}</SelectItem>
                      <SelectItem value="completed">{t('admin.completed')}</SelectItem>
                      <SelectItem value="cancelled">{t('admin.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={loadDinners}
                    variant="outline"
                    disabled={dinnersLoading}
                    className="w-full sm:w-auto"
                  >
                    {dinnersLoading ? "加载中..." : "刷新"}
                  </Button>
                </div>

                {/* 状态统计 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(() => {
                    const counts = dinners.reduce((acc: Record<string, number>, d) => {
                      const s = (d as any).status || 'active';
                      acc[s] = (acc[s] || 0) + 1;
                      return acc;
                    }, {});
                    const total = dinners.length;
                    return (
                      <>
                        <div className="text-center space-y-1">
                          <p className="text-2xl font-bold text-primary">{total}</p>
                          <p className="text-sm text-muted-foreground">总饭局</p>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-2xl font-bold text-accent">{counts['active'] || 0}</p>
                          <p className="text-sm text-muted-foreground">进行中</p>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-2xl font-bold text-secondary">{counts['completed'] || 0}</p>
                          <p className="text-sm text-muted-foreground">已完成</p>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-2xl font-bold text-destructive">{counts['cancelled'] || 0}</p>
                          <p className="text-sm text-muted-foreground">已取消</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* 饭局表格 */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>标题</TableHead>
                        <TableHead className="hidden md:table-cell">创建者</TableHead>
                        <TableHead>时间</TableHead>
                        <TableHead className="hidden md:table-cell">地点</TableHead>
                        <TableHead className="hidden sm:table-cell">人数</TableHead>
                        <TableHead className="hidden sm:table-cell">状态</TableHead>
                        <TableHead className="w-24">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dinnersLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-muted-foreground mt-2">加载中...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredDinners.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <p className="text-muted-foreground">暂无饭局数据</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDinners.map((d) => {
                          const count = participantCounts[d.id] || 0;
                          const statusValue = (d as any).status || 'active';
                          const creatorName = creatorMap[d.created_by]?.nickname || '—';
                          return (
                            <TableRow key={d.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{d.title}</span>
                                  <span className="text-xs text-muted-foreground truncate md:hidden">{(d.location || '').slice(0, 18)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{creatorName}</TableCell>
                              <TableCell>
                                {new Date(d.dinner_time).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{d.location}</TableCell>
                              <TableCell className="hidden sm:table-cell">{count} / {d.max_participants}</TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <Badge variant="secondary">
                                  {statusValue === 'active' ? '进行中' : statusValue === 'completed' ? '已完成' : statusValue === 'cancelled' ? '已取消' : statusValue}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="outline" onClick={() => openDinner(d)}>
                                  <Eye className="w-4 h-4 mr-1" /> 查看详情
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  举报/反馈
                </CardTitle>
                <CardDescription>查看并处理用户的意见反馈与举报信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="搜索标题或描述"
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue placeholder="按类型筛选" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      <SelectItem value="general_feedback">意见反馈</SelectItem>
                      <SelectItem value="user_report">用户举报</SelectItem>
                      <SelectItem value="dinner_report">饭局举报</SelectItem>
                      <SelectItem value="chat_report">聊天举报</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={reportStatus} onValueChange={setReportStatus}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="按状态筛选" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="pending">待处理</SelectItem>
                      <SelectItem value="in_progress">处理中</SelectItem>
                      <SelectItem value="resolved">已解决</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={loadReports} variant="outline" disabled={reportsLoading} className="w-full sm:w-auto">
                    {reportsLoading ? '加载中...' : '刷新'}
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>标题</TableHead>
                        <TableHead className="hidden md:table-cell">类型</TableHead>
                        <TableHead className="hidden sm:table-cell">分类</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="hidden md:table-cell">提交人</TableHead>
                        <TableHead className="hidden sm:table-cell">时间</TableHead>
                        <TableHead className="w-40">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-muted-foreground mt-2">加载中...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <p className="text-muted-foreground">暂无举报/反馈</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredReports.map((r) => (
                          <TableRow key={r.id} className="hover:bg-muted/50">
                            <TableCell className="max-w-[220px]">
                              <div className="flex flex-col">
                                <span className="font-medium truncate" title={r.title}>{r.title}</span>
                                <span className="text-xs text-muted-foreground truncate md:hidden">{r.report_type}</span>
                                {r.evidence_urls && r.evidence_urls.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                                    <ImageIcon className="h-3 w-3" />
                                    <span>{r.evidence_urls.length} 张图片</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{r.report_type}</TableCell>
                            <TableCell className="hidden sm:table-cell">{r.category}</TableCell>
                            <TableCell>
                              <Badge variant={r.status === 'pending' ? 'destructive' : r.status === 'resolved' ? 'secondary' : 'outline'}>
                                {r.status === 'pending' ? '待处理' : r.status === 'in_progress' ? '处理中' : '已解决'}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{(r.reporter_id || '').slice(0,8)}...</TableCell>
                            <TableCell className="hidden sm:table-cell">{new Date(r.created_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => { setSelectedReport(r); setReportDialogOpen(true); }}>查看</Button>
                                {r.status !== 'in_progress' && (
                                  <Button size="sm" variant="outline" onClick={() => updateReportStatus(r.id, 'in_progress')}>标记处理中</Button>
                                )}
                                {r.status !== 'resolved' && (
                                  <Button size="sm" onClick={() => updateReportStatus(r.id, 'resolved')} disabled={statusUpdating}>
                                    {statusUpdating ? '处理中...' : '标记已解决'}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>举报/反馈详情</DialogTitle>
                      <DialogDescription>查看并添加处理备注</DialogDescription>
                    </DialogHeader>
                    {selectedReport && (
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-muted-foreground">标题</div>
                          <div className="font-medium">{selectedReport.title}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">类型 / 分类</div>
                          <div className="font-medium">{selectedReport.report_type} / {selectedReport.category}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">描述</div>
                          <div className="whitespace-pre-wrap text-sm">{selectedReport.description}</div>
                        </div>
                        {selectedReport.evidence_urls && selectedReport.evidence_urls.length > 0 && (
                          <div>
                            <div className="text-sm text-muted-foreground mb-2">相关图片 ({selectedReport.evidence_urls.length})</div>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                               {selectedReport.evidence_urls.map((url: string, index: number) => (
                                 <EvidenceImageViewer
                                   key={index}
                                   url={url}
                                   alt={`证据图片 ${index + 1}`}
                                   className="group"
                                   onClick={() => window.open(url, '_blank')}
                                   bucketName="feedback-evidence"
                                 />
                               ))}
                             </div>
                             <p className="text-xs text-muted-foreground mt-1">点击图片可查看大图</p>
                           </div>
                         )}
                         {/* 聊天记录审查按钮 */}
                         {(selectedReport.related_chat_session_id || selectedReport.reported_user_id) && (
                           <div>
                             <div className="text-sm text-muted-foreground mb-2">聊天记录审查</div>
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => openChatInvestigation(selectedReport)}
                               className="w-full"
                             >
                               <MessageSquareOff className="w-4 h-4 mr-2" />
                               查看相关聊天记录
                             </Button>
                           </div>
                        )}
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">处理备注</div>
                          <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="填写处理说明..." className="resize-none" rows={4} />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setReportDialogOpen(false)}>关闭</Button>
                          <Button onClick={async () => {
                            if (!selectedReport) return;
                            const { error } = await supabase
                              .from('reports')
                              .update({ admin_notes: adminNotes, updated_at: new Date().toISOString() })
                              .eq('id', selectedReport.id);
                            if (error) {
                              toast.error('保存备注失败');
                            } else {
                              toast.success('备注已保存');
                              setReportDialogOpen(false);
                              setAdminNotes('');
                              await loadReports();
                            }
                          }}>保存备注</Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                {/* 聊天记录审查弹窗 */}
                <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>聊天记录审查</DialogTitle>
                      <DialogDescription>
                        基于举报调查的聊天记录访问 - 所有访问行为均已记录
                      </DialogDescription>
                    </DialogHeader>
                    
                    {selectedReport && (
                      <div className="space-y-4">
                        {/* 举报信息摘要 */}
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <div className="text-sm font-medium">举报信息: {selectedReport.title}</div>
                          <div className="text-xs text-muted-foreground">
                            类型: {selectedReport.report_type} | 状态: {selectedReport.status}
                          </div>
                        </div>

                        {/* 访问理由 */}
                        <div>
                          <label className="text-sm font-medium">访问理由</label>
                          <Input
                            value={accessJustification}
                            onChange={(e) => setAccessJustification(e.target.value)}
                            placeholder="请输入查看聊天记录的具体理由..."
                            className="mt-1"
                          />
                        </div>

                        {/* 聊天会话列表 */}
                        <div>
                          <div className="text-sm font-medium mb-2">相关聊天会话</div>
                          {chatLoading ? (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                              <p className="text-sm text-muted-foreground mt-2">加载中...</p>
                            </div>
                          ) : chatSessions.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                              无相关聊天记录
                            </div>
                          ) : (
                            <div className="grid gap-2">
                              {chatSessions.map((session) => (
                                <div
                                  key={session.session_id}
                                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                    selectedChatSession?.session_id === session.session_id
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                  onClick={() => {
                                    if (!accessJustification.trim()) {
                                      toast.error('请先填写访问理由');
                                      return;
                                    }
                                    loadChatMessages(session.session_id, selectedReport.id);
                                  }}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium text-sm">
                                        {session.participant1_nickname} ↔ {session.participant2_nickname}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        饭局: {session.dinner_title || '未知'}
                                      </div>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground">
                                      <div>{session.message_count} 条消息</div>
                                      <div>
                                        {session.last_message_at 
                                          ? new Date(session.last_message_at).toLocaleDateString()
                                          : '无消息'
                                        }
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 聊天消息显示 */}
                        {selectedChatSession && (
                          <div>
                            <div className="text-sm font-medium mb-2">
                              聊天记录: {selectedChatSession.participant1_nickname} ↔ {selectedChatSession.participant2_nickname}
                            </div>
                            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto bg-muted/20">
                              {chatMessages.length === 0 ? (
                                <div className="text-center text-muted-foreground">无聊天记录</div>
                              ) : (
                                <div className="space-y-3">
                                  {chatMessages.map((message) => (
                                    <div key={message.message_id} className="flex gap-3">
                                      <div className="text-xs text-muted-foreground min-w-0 flex-shrink-0">
                                        {new Date(message.created_at).toLocaleString()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-primary">
                                          {message.sender_nickname}
                                        </div>
                                        {message.message_type === 'image' ? (
                                          <div className="mt-1">
                                            <EvidenceImageViewer
                                              url={message.content}
                                              alt="聊天图片"
                                              className="max-w-32 h-auto"
                                              bucketName="chat-images"
                                            />
                                          </div>
                                        ) : (
                                          <div className="text-sm whitespace-pre-wrap break-words">
                                            {message.content}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* 访问记录提醒 */}
                            <div className="mt-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                              ⚠️ 此次访问已记录到审计日志中，包含访问时间、理由和数据摘要
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                          <Button variant="outline" onClick={() => {
                            setChatDialogOpen(false);
                            setChatSessions([]);
                            setChatMessages([]);
                            setSelectedChatSession(null);
                            setAccessJustification('');
                          }}>
                            关闭
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
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
                      placeholder={t('admin.searchUsers')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder={t('admin.filterByRole')} />
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
                        <TableHead className="hidden sm:table-cell">状态</TableHead>
                        <TableHead className="hidden sm:table-cell">注册时间</TableHead>
                        <TableHead className="w-32">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-muted-foreground mt-2">加载中...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <p className="text-muted-foreground">暂无用户数据</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((profile) => (
                          <UserRow 
                            key={profile.id} 
                            profile={profile} 
                            onRoleChange={handleRoleChange}
                            onBanUser={handleBanUser}
                            onUnbanUser={handleUnbanUser}
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
              <CardContent className="space-y-4">
                {/* 合规与审计功能 */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">合规与审计</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            访问审计日志
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">
                            查看管理员访问用户数据的完整记录，确保合规性
                          </p>
                          <Button 
                            onClick={() => setAuditLogOpen(true)}
                            className="w-full"
                            variant="outline"
                          >
                            查看审计日志
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            合规状态
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>GDPR 合规</span>
                              <Badge variant="secondary">✓ 已启用</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>数据审计</span>
                              <Badge variant="secondary">✓ 已启用</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>举报调查机制</span>
                              <Badge variant="secondary">✓ 已启用</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      🛡️ 隐私保护与合规说明
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                      <div>• 本系统严格遵循 GDPR、CCPA、《个人信息保护法》等法律法规</div>
                      <div>• 聊天记录仅在收到举报时基于合法利益进行访问，所有访问均记录审计日志</div>
                      <div>• 实施数据最小化原则，已解决举报的相关数据会在90天后自动清理</div>
                      <div>• 用户享有数据查看、修改、删除等权利，可通过客服申请</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* 详情弹窗 */}
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{selectedDinner?.title || '饭局详情'}</DialogTitle>
                <DialogDescription>饭局详细信息</DialogDescription>
              </DialogHeader>
              {selectedDinner ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">创建者</div>
                      <div className="font-medium">{detailCreator?.nickname || selectedDinner.created_by.slice(0,8)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">状态</div>
                      <div className="font-medium">{((selectedDinner as any).status || 'active') === 'active' ? '进行中' : ((selectedDinner as any).status === 'completed' ? '已完成' : ((selectedDinner as any).status === 'cancelled' ? '已取消' : (selectedDinner as any).status))}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">时间</div>
                      <div className="font-medium">{new Date(selectedDinner.dinner_time).toLocaleString('zh-CN')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">地点</div>
                      <div className="font-medium">{selectedDinner.location}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">备注</div>
                    <div className="font-medium whitespace-pre-wrap">{selectedDinner.description || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">参与人员（{detailParticipants.length}/{selectedDinner.max_participants}）</div>
                    <div className="mt-2 space-y-2">
                      {detailsLoading ? (
                        <div className="text-sm text-muted-foreground">加载中...</div>
                      ) : detailParticipants.length === 0 ? (
                        <div className="text-sm text-muted-foreground">暂无参与者</div>
                      ) : (
                        detailParticipants.map((p) => (
                          <div key={p.user_id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
                              {p.profile?.avatar_url ? (
                                <img src={p.profile.avatar_url} alt={p.profile.nickname} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs text-primary">{p.profile?.nickname?.[0] || '?'}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{p.profile?.nickname || p.user_id.slice(0,8)}</div>
                              <div className="text-xs text-muted-foreground">加入时间：{new Date(p.joined_at).toLocaleString('zh-CN')}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>

          {/* 禁言对话框 */}
          <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-destructive" />
                  禁言用户
                </DialogTitle>
                <DialogDescription>
                  对用户 "{selectedUser?.nickname}" 进行禁言处理
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">禁言时长</label>
                  <Select value={banDuration} onValueChange={setBanDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1小时</SelectItem>
                      <SelectItem value="24">24小时</SelectItem>
                      <SelectItem value="72">3天</SelectItem>
                      <SelectItem value="168">7天</SelectItem>
                      <SelectItem value="720">30天</SelectItem>
                      <SelectItem value="permanent">永久禁言</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">禁言原因</label>
                  <Textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="请输入禁言原因..."
                    className="resize-none"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setBanDialogOpen(false)}
                    disabled={banLoading}
                  >
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmBanUser}
                    disabled={banLoading || !banReason.trim()}
                  >
                    {banLoading ? "处理中..." : "确认禁言"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Tabs>

        {/* 审计日志查看弹窗 */}
        <AdminChatInvestigation 
          open={auditLogOpen} 
          onOpenChange={setAuditLogOpen}
        />
      </div>
    </div>
  );
};

// 用户行组件
interface UserRowProps {
  profile: Profile;
  onRoleChange: (userId: string, newRole: string) => void;
  onBanUser: (user: Profile) => void;
  onUnbanUser: (user: Profile) => void;
}

const UserRow: React.FC<UserRowProps> = ({ profile, onRoleChange, onBanUser, onUnbanUser }) => {
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

  const getBanStatus = () => {
    if (!profile.is_banned) return null;
    
    if (profile.banned_until) {
      const banUntil = new Date(profile.banned_until);
      if (banUntil > new Date()) {
        return `禁言至 ${banUntil.toLocaleDateString('zh-CN')}`;
      }
    }
    return '永久禁言';
  };

  const banStatus = getBanStatus();

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
        {profile.is_banned ? (
          <Badge variant="destructive" className="text-xs">
            <MessageSquareOff className="w-3 h-3 mr-1" />
            {banStatus}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            正常
          </Badge>
        )}
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {formatDate(profile.created_at)}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Select 
            value={currentRole} 
            onValueChange={handleRoleChange}
            disabled={roleLoading}
          >
            <SelectTrigger className="w-16 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">用户</SelectItem>
              <SelectItem value="admin">管理员</SelectItem>
            </SelectContent>
          </Select>
          
          {profile.is_banned ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUnbanUser(profile)}
              className="h-7 px-2 text-xs"
            >
              <UserX className="w-3 h-3" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBanUser(profile)}
              className="h-7 px-2 text-xs text-destructive hover:text-destructive-foreground"
            >
              <Ban className="w-3 h-3" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default Admin;