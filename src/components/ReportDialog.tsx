import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: 'user' | 'chat' | 'dinner';
  reportedUserId?: string;
  relatedDinnerId?: string;
  relatedChatSessionId?: string;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onOpenChange,
  reportType,
  reportedUserId,
  relatedDinnerId,
  relatedChatSessionId
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: ''
  });

  const getCategories = () => {
    switch (reportType) {
      case 'user':
        return [
          { value: 'harassment', label: '骚扰或恶意行为' },
          { value: 'inappropriate_content', label: '不当内容或言论' },
          { value: 'fake_profile', label: '虚假资料' },
          { value: 'spam', label: '垃圾信息' },
          { value: 'other', label: '其他' }
        ];
      case 'chat':
        return [
          { value: 'inappropriate_message', label: '不当消息内容' },
          { value: 'harassment', label: '骚扰行为' },
          { value: 'spam', label: '垃圾消息' },
          { value: 'threatening', label: '威胁或恐吓' },
          { value: 'other', label: '其他' }
        ];
      case 'dinner':
        return [
          { value: 'inappropriate_content', label: '不当饭局内容' },
          { value: 'misleading_info', label: '误导性信息' },
          { value: 'safety_concern', label: '安全隐患' },
          { value: 'spam', label: '垃圾信息' },
          { value: 'other', label: '其他' }
        ];
      default:
        return [];
    }
  };

  const getTitle = () => {
    switch (reportType) {
      case 'user':
        return '举报用户';
      case 'chat':
        return '举报聊天内容';
      case 'dinner':
        return '举报饭局';
      default:
        return '举报';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.title || !formData.description) {
      toast({
        title: '请填写完整信息',
        description: '请确保所有必填项都已填写',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('请先登录');

      const reportData: any = {
        reporter_id: user.id,
        report_type: reportType,
        category: formData.category,
        title: formData.title,
        description: formData.description
      };

      // 根据举报类型添加相关字段
      if (reportedUserId) {
        reportData.reported_user_id = reportedUserId;
      }
      if (relatedDinnerId) {
        reportData.related_dinner_id = relatedDinnerId;
      }
      if (relatedChatSessionId) {
        reportData.related_chat_session_id = relatedChatSessionId;
      }

      const { error } = await supabase
        .from('reports')
        .insert(reportData);

      if (error) throw error;

      toast({
        title: '举报提交成功',
        description: '我们已收到您的举报，会尽快处理'
      });

      // 重置表单并关闭对话框
      setFormData({
        category: '',
        title: '',
        description: ''
      });
      onOpenChange(false);

    } catch (error) {
      console.error('提交举报失败:', error);
      toast({
        title: '提交失败',
        description: '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            请提供详细信息，帮助我们更好地处理您的举报
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 举报类型 */}
          <div className="space-y-2">
            <Label htmlFor="category">举报类型 *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择举报类型" />
              </SelectTrigger>
              <SelectContent>
                {getCategories().map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 举报标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">举报标题 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="请简要描述问题"
              maxLength={100}
            />
          </div>

          {/* 详细描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">详细描述 *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请详细描述具体情况，提供更多信息有助于我们处理..."
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/500
            </p>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading}
              className="flex-1"
            >
              {loading ? '提交中...' : '提交举报'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};