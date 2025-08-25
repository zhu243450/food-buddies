import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, Gift, Calendar, Star } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";

interface Campaign {
  id: string;
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  campaign_type: string;
  rules?: any;
  view_count: number;
  click_count: number;
  created_at: string;
}

export const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    if (id) {
      loadCampaign(id);
    }
  }, [id]);

  const loadCampaign = async (campaignId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      
      if (!data) {
        toast.error(t('campaign.notFound', '活动不存在'));
        navigate('/');
        return;
      }

      setCampaign(data);
      
      // 从campaigns表直接读取参与人数(已通过触发器维护)
      setParticipantCount(data.participant_count);
      
      // 检查用户是否已参与
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: participation } = await supabase
          .from('campaign_participations')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('user_id', user.id)
          .single();
        
        setHasParticipated(!!participation);
      }
    } catch (error) {
      console.error('Failed to load campaign:', error);
      toast.error(t('campaign.loadFailed', '加载活动详情失败'));
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleParticipate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('auth.pleaseLogin', '请先登录'));
        navigate('/auth');
        return;
      }

      if (!campaign) return;

      const { error } = await supabase
        .from('campaign_participations')
        .insert({
          campaign_id: campaign.id,
          user_id: user.id,
          participation_data: { joined_at: new Date().toISOString() }
        });

      if (error) {
        if (error.code === '23505') { // 唯一约束违反
          toast.error(t('campaign.alreadyParticipated', '您已经参与过此活动'));
        } else {
          throw error;
        }
      } else {
        setHasParticipated(true);
        setParticipantCount((c) => c + 1);
        toast.success(t('campaign.participateSuccess', '成功参与活动！'));
      }
    } catch (error) {
      console.error('Failed to participate:', error);
      toast.error(t('campaign.participateFailed', '参与活动失败'));
    }
  };

  const handleGoBack = () => {
    console.log('返回按钮被点击');
    try {
      navigate('/');
    } catch (error) {
      console.error('导航失败:', error);
      window.location.href = '/';
    }
  };

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'en' ? 'en-US' : 'zh-CN';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisplayTitle = () => {
    if (!campaign) return '';
    return i18n.language === 'en' && campaign.title_en ? campaign.title_en : campaign.title;
  };

  const getDisplayDescription = () => {
    if (!campaign) return '';
    return i18n.language === 'en' && campaign.description_en ? campaign.description_en : campaign.description;
  };

  const getCampaignTypeName = (type: string) => {
    return t(`campaign.types.${type}`, t('campaign.types.default'));
  };

  const isActive = campaign ? 
    new Date() >= new Date(campaign.start_date) && new Date() <= new Date(campaign.end_date) : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4">{t('campaign.notFound', '活动不存在')}</div>
          <Button onClick={() => navigate('/')}>{t('common.backToHome', '返回首页')}</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={getDisplayTitle()}
        description={getDisplayDescription()}
        keywords={t('campaign.keywords', '活动,优惠,饭约社,美食社交')}
      />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>

        <Card className="overflow-hidden">
          {campaign.image_url && (
            <div className="relative h-64 bg-gradient-to-r from-primary/10 to-accent/10">
              <img 
                src={campaign.image_url} 
                alt={getDisplayTitle()}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          )}
          
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Badge variant={isActive ? "default" : "secondary"}>
                {getCampaignTypeName(campaign.campaign_type)}
              </Badge>
              <Badge variant={isActive ? "default" : "outline"}>
                {isActive ? t('campaign.active', '进行中') : t('campaign.ended', '已结束')}
              </Badge>
            </div>
            
            <CardTitle className="text-2xl mb-2">{getDisplayTitle()}</CardTitle>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {t('campaign.startTime', '开始')}：{formatDate(campaign.start_date)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {t('campaign.endTime', '结束')}：{formatDate(campaign.end_date)}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {t('campaign.views', '浏览')}：{campaign.view_count}
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {t('campaign.clicks', '点击')}：{campaign.click_count}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">{t('campaign.details', '活动详情')}</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {getDisplayDescription().split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-2">{paragraph}</p>
                ))}
              </div>
            </div>

            {campaign.rules && (
              <div>
                <h3 className="font-semibold text-lg mb-3">{t('campaign.rules', '活动规则')}</h3>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="prose prose-sm max-w-none">
                      {typeof campaign.rules === 'object' ? (
                        <div className="space-y-2">
                          {Object.entries(campaign.rules).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-medium min-w-fit">{key}:</span>
                              <span className="text-muted-foreground">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">{String(campaign.rules)}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {isActive && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {t('campaign.participantCount', '已参与人数')}：{participantCount}
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleParticipate}
                    disabled={hasParticipated}
                    className="flex-1"
                    size="lg"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    {hasParticipated ? t('campaign.participated', '已参与') : t('campaign.participate', '参与活动')}
                  </Button>
                </div>
              </div>
            )}

            {!isActive && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">{t('campaign.ended', '此活动已结束')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};