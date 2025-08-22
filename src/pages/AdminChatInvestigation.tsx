import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EvidenceImageViewer } from '@/components/EvidenceImageViewer';
import { AlertTriangle, Clock, MessageSquare, User } from 'lucide-react';
import { toast } from 'sonner';

interface AdminAccessLog {
  id: string;
  admin_user_id: string;
  access_type: string;
  target_resource_id: string;
  target_resource_type: string;
  justification: string;
  related_report_id?: string;
  accessed_data_summary: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

interface AdminChatInvestigationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminChatInvestigation({ open, onOpenChange }: AdminChatInvestigationProps) {
  const [accessLogs, setAccessLogs] = useState<AdminAccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAccessLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAccessLogs(data || []);
    } catch (error: any) {
      console.error('Failed to load access logs:', error);
      toast.error('加载访问日志失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      loadAccessLogs();
    }
  }, [open]);

  const filteredLogs = accessLogs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.justification.toLowerCase().includes(searchLower) ||
      log.access_type.toLowerCase().includes(searchLower) ||
      log.accessed_data_summary.toLowerCase().includes(searchLower)
    );
  });

  const getAccessTypeIcon = (type: string) => {
    switch (type) {
      case 'chat_review':
        return <MessageSquare className="w-4 h-4" />;
      case 'user_profile':
        return <User className="w-4 h-4" />;
      case 'report_investigation':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getAccessTypeName = (type: string) => {
    switch (type) {
      case 'chat_review':
        return '聊天记录审查';
      case 'user_profile':
        return '用户资料访问';
      case 'report_investigation':
        return '举报调查';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            管理员访问审计日志
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* 搜索栏 */}
          <div className="flex gap-3">
            <Input
              placeholder="搜索访问理由、类型或数据摘要..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={loadAccessLogs} disabled={loading}>
              {loading ? '加载中...' : '刷新'}
            </Button>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">总访问次数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{accessLogs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">聊天记录访问</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">
                  {accessLogs.filter(log => log.access_type === 'chat_review').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">今日访问</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {accessLogs.filter(log => 
                    new Date(log.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 访问日志列表 */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                {searchTerm ? '无匹配的访问记录' : '暂无访问记录'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getAccessTypeIcon(log.access_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">
                              {getAccessTypeName(log.access_type)}
                            </Badge>
                            <span className="text-sm font-medium">
                              {log.target_resource_type}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            <strong>访问理由:</strong> {log.justification}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <strong>数据摘要:</strong> {log.accessed_data_summary}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <strong>资源ID:</strong> {log.target_resource_id}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground ml-4">
                        <div>{new Date(log.created_at).toLocaleString()}</div>
                        <div className="mt-1">
                          管理员: {log.admin_user_id.slice(0, 8)}...
                        </div>
                        {log.related_report_id && (
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-xs">
                              举报: {log.related_report_id.slice(0, 8)}...
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 合规提醒 */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              🛡️ 隐私保护与合规说明
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <div>• 所有管理员访问用户数据的行为均已记录，符合GDPR、CCPA等法规要求</div>
              <div>• 聊天记录仅在收到举报时基于合法利益进行访问</div>
              <div>• 访问日志保留90天，已解决举报的相关日志将自动清理</div>
              <div>• 用户有权了解其数据的访问情况，可通过隐私政策查询</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}