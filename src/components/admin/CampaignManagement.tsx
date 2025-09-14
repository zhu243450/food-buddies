import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Eye, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  display_priority: number;
  target_audience: string;
  campaign_type: string;
  rules?: any;
  view_count: number;
  click_count: number;
  created_at: string;
}

interface CampaignFormData {
  title: string;
  description: string;
  image_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  display_priority: number;
  target_audience: string;
  campaign_type: string;
  rules: string;
}

export const CampaignManagement = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    image_url: '',
    start_date: '',
    end_date: '',
    is_active: true,
    display_priority: 0,
    target_audience: 'all',
    campaign_type: 'promotion',
    rules: ''
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('display_priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast.error('加载活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingCampaign(null);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      start_date: '',
      end_date: '',
      is_active: true,
      display_priority: 0,
      target_audience: 'all',
      campaign_type: 'promotion',
      rules: ''
    });
    setDialogOpen(true);
  };

  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      description: campaign.description,
      image_url: campaign.image_url || '',
      start_date: campaign.start_date.slice(0, 16), // Format for datetime-local input
      end_date: campaign.end_date.slice(0, 16),
      is_active: campaign.is_active,
      display_priority: campaign.display_priority,
      target_audience: campaign.target_audience,
      campaign_type: campaign.campaign_type,
      rules: JSON.stringify(campaign.rules || {}, null, 2)
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.title.trim() || !formData.description.trim()) {
        toast.error('请填写标题和描述');
        return;
      }

      const saveData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        image_url: formData.image_url.trim() || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
        display_priority: formData.display_priority,
        target_audience: formData.target_audience,
        campaign_type: formData.campaign_type,
        rules: formData.rules.trim() ? JSON.parse(formData.rules) : null
      };

      if (editingCampaign) {
        // 更新活动
        const { error } = await supabase
          .from('campaigns')
          .update(saveData)
          .eq('id', editingCampaign.id);

        if (error) throw error;
        toast.success('活动更新成功');
      } else {
        // 创建新活动
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('未登录');

        const { error } = await supabase
          .from('campaigns')
          .insert({ ...saveData, created_by: user.id });

        if (error) throw error;
        toast.success('活动创建成功');
      }

      setDialogOpen(false);
      await loadCampaigns();
    } catch (error: any) {
      console.error('Save campaign failed:', error);
      toast.error('保存失败: ' + error.message);
    }
  };

  const handleDelete = async (campaign: Campaign) => {
    if (!confirm(`确定要删除活动"${campaign.title}"吗？`)) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaign.id);

      if (error) throw error;
      toast.success('活动已删除');
      await loadCampaigns();
    } catch (error: any) {
      console.error('Delete campaign failed:', error);
      toast.error('删除失败: ' + error.message);
    }
  };

  const handleToggleActive = async (campaign: Campaign) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ is_active: !campaign.is_active })
        .eq('id', campaign.id);

      if (error) throw error;
      toast.success(campaign.is_active ? '活动已停用' : '活动已启用');
      await loadCampaigns();
    } catch (error: any) {
      console.error('Toggle active failed:', error);
      toast.error('状态更新失败: ' + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (campaign: Campaign) => {
    const now = new Date();
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);

    if (!campaign.is_active) {
      return <Badge variant="secondary">已停用</Badge>;
    }
    if (now < start) {
      return <Badge variant="outline">未开始</Badge>;
    }
    if (now > end) {
      return <Badge variant="secondary">已结束</Badge>;
    }
    return <Badge variant="default">进行中</Badge>;
  };

  return (
    <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            活动管理
          </CardTitle>
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            新建活动
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">加载中...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            暂无活动
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>活动信息</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>数据</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {campaign.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          优先级: {campaign.display_priority}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {campaign.campaign_type === 'promotion' ? '优惠活动' :
                         campaign.campaign_type === 'event' ? '活动公告' : '系统通知'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>开始: {formatDate(campaign.start_date)}</div>
                        <div>结束: {formatDate(campaign.end_date)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {campaign.view_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.click_count}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(campaign)}
                        >
                          {campaign.is_active ? '停用' : '启用'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(campaign)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(campaign)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 创建/编辑活动对话框 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? '编辑活动' : '新建活动'}</DialogTitle>
              <DialogDescription>
                {editingCampaign ? '修改现有活动的详细信息' : '创建新的活动来吸引用户参与'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">活动标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="输入活动标题"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">活动描述 *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="输入活动描述"
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="image_url">活动图片 URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="输入图片 URL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_date">开始时间 *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end_date">结束时间 *</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="campaign_type">活动类型</Label>
                  <Select
                    value={formData.campaign_type}
                    onValueChange={(value) => setFormData({ ...formData, campaign_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotion">优惠活动</SelectItem>
                      <SelectItem value="event">活动公告</SelectItem>
                      <SelectItem value="announcement">系统通知</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="target_audience">目标用户</Label>
                  <Select
                    value={formData.target_audience}
                    onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有用户</SelectItem>
                      <SelectItem value="new_users">新用户</SelectItem>
                      <SelectItem value="existing_users">老用户</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="display_priority">显示优先级</Label>
                <Input
                  id="display_priority"
                  type="number"
                  value={formData.display_priority}
                  onChange={(e) => setFormData({ ...formData, display_priority: parseInt(e.target.value) || 0 })}
                  placeholder="数字越大优先级越高"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rules">活动规则 (JSON格式)</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  placeholder='{"最高奖励": "5000元", "点赞单价": "1元", "活动条件": "上传饭局照片获得点赞"}'
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">立即启用活动</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>
                {editingCampaign ? '更新' : '创建'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};