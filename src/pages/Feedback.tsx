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
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';


export default function Feedback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
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
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const categories = [
    { value: 'bug', label: t('feedback.categoryBug') },
    { value: 'feature', label: t('feedback.categoryFeature') },
    { value: 'user_experience', label: t('feedback.categoryUX') },
    { value: 'content', label: t('feedback.categoryContent') },
    { value: 'other', label: t('feedback.categoryOther') }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.title || !formData.description) {
      toast({
        title: t('feedback.incompleteTitle'),
        description: t('feedback.incompleteDesc'),
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
        title: t('feedback.submitSuccess'),
        description: t('feedback.submitSuccessDesc')
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
        title: t('feedback.submitFailed'),
        description: t('feedback.submitFailedDesc'),
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

  if (!user || authLoading) return null;

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
            <h1 className="text-2xl font-bold">{t('feedback.title')}</h1>
          </div>

          {/* 反馈表单 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('feedback.submitFeedback')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('feedback.subtitle')}
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 反馈类型 */}
                <div className="space-y-2">
                  <Label htmlFor="category">{t('feedback.categoryLabel')} *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('feedback.categoryPlaceholder')} />
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
                  <Label htmlFor="title">{t('feedback.titleLabel')} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder={t('feedback.titlePlaceholder')}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.title.length}/100
                  </p>
                </div>

                {/* 详细描述 */}
                <div className="space-y-2">
                  <Label htmlFor="description">{t('feedback.descriptionLabel')} *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={t('feedback.descriptionPlaceholder')}
                    className="min-h-[120px] resize-none"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/1000
                  </p>
                </div>

                {/* 图片上传 */}
                <div className="space-y-2">
                  <Label>{t('feedback.imagesLabel')}</Label>
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
                  {loading ? t('feedback.submitting') : t('feedback.submitBtn')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 联系提示 */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-medium">{t('feedback.otherContact')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('feedback.otherContactDesc')}
                </p>
                <div className="text-sm space-y-1">
                  <p>{t('footer.email')}: weishang99@gmail.com</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      
    </>
  );
}