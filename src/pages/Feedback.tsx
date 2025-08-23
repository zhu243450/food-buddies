import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send } from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import Navigation from '@/components/Navigation';

export default function Feedback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: ''
  });
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);

  const { getPageSEO } = useSEO();
  const seoData = getPageSEO('feedback');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
    };

    getUser();
  }, [navigate]);

  const categories = [
    { value: 'bug', label: '问题反馈' },
    { value: 'feature', label: '功能建议' },
    { value: 'user_experience', label: '用户体验' },
    { value: 'content', label: '内容问题' },
    { value: 'other', label: '其他' }
  ];

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
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          report_type: 'general_feedback',
          category: formData.category,
          title: formData.title,
          description: formData.description,
          evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : null
        });

      if (error) throw error;

      toast({
        title: '反馈提交成功',
        description: '感谢您的反馈，我们会认真处理您的建议'
      });

      // 重置表单
      setFormData({
        category: '',
        title: '',
        description: ''
      });
      setEvidenceUrls([]);

    } catch (error) {
      console.error('提交反馈失败:', error);
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

  if (!user) return null;

  return (
    <>
      <SEO 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
      />
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* 头部 */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                try {
                  if (document.referrer && document.referrer !== window.location.href) {
                    navigate(-1);
                  } else {
                    navigate('/my-dinners');
                  }
                } catch {
                  navigate('/my-dinners');
                }
              }}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">意见反馈</h1>
          </div>

          {/* 反馈表单 */}
          <Card>
            <CardHeader>
              <CardTitle>提交反馈</CardTitle>
              <p className="text-sm text-muted-foreground">
                您的反馈对我们很重要，帮助我们改善产品体验
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 反馈类型 */}
                <div className="space-y-2">
                  <Label htmlFor="category">反馈类型 *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择反馈类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 标题 */}
                <div className="space-y-2">
                  <Label htmlFor="title">反馈标题 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="请简要描述您的反馈"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.title.length}/100
                  </p>
                </div>

                {/* 详细描述 */}
                <div className="space-y-2">
                  <Label htmlFor="description">详细描述 *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="请详细描述您遇到的问题或建议..."
                    className="min-h-[120px] resize-none"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/1000
                  </p>
                </div>

                {/* 图片上传 */}
                <div className="space-y-2">
                  <Label>相关图片（可选）</Label>
                  <ImageUploader
                    userId={user.id}
                    onImagesChange={setEvidenceUrls}
                    maxImages={5}
                    maxSizePerImage={10}
                  />
                </div>

                {/* 提交按钮 */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? '提交中...' : '提交反馈'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 联系提示 */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-medium">其他联系方式</h3>
                <p className="text-sm text-muted-foreground">
                  如果您遇到紧急问题，可以通过以下方式联系我们：
                </p>
                <div className="text-sm space-y-1">
                  <p>邮箱：support@dinnerapp.com</p>
                  <p>微信客服：dinnerapp_service</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Navigation />
    </>
  );
}