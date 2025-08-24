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
  const { t } = useTranslation();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasParticipated, setHasParticipated] = useState(false);

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
        toast.error('活动不存在');
        navigate('/');
        return;
      }

      setCampaign(data);
      
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
      toast.error('加载活动详情失败');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleParticipate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('请先登录');
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
          toast.error('您已经参与过此活动');
        } else {
          throw error;
        }
      } else {
        setHasParticipated(true);
        toast.success('成功参与活动！');
      }
    } catch (error) {
      console.error('Failed to participate:', error);
      toast.error('参与活动失败');
    }
  };

  const handleGoBack = () => {
    // 尝试使用浏览器历史记录返回
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // 如果没有历史记录，默认返回首页
      navigate('/');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCampaignTypeName = (type: string) => {
    switch (type) {
      case 'promotion':
        return '优惠活动';
      case 'event':
        return '活动公告';
      case 'announcement':
        return '系统通知';
      default:
        return '活动';
    }
  };

  const isActive = campaign ? 
    new Date() >= new Date(campaign.start_date) && new Date() <= new Date(campaign.end_date) : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4">活动不存在</div>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={campaign.title}
        description={campaign.description}
        keywords="活动,优惠,饭约社,美食社交"
      />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>

        <Card className="overflow-hidden">
          {campaign.image_url && (
            <div className="relative h-64 bg-gradient-to-r from-primary/10 to-accent/10">
              <img 
                src={campaign.image_url} 
                alt={campaign.title}
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
                {isActive ? '进行中' : '已结束'}
              </Badge>
            </div>
            
            <CardTitle className="text-2xl mb-2">{campaign.title}</CardTitle>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                开始：{formatDate(campaign.start_date)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                结束：{formatDate(campaign.end_date)}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                浏览：{campaign.view_count}
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                点击：{campaign.click_count}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">活动详情</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {campaign.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-2">{paragraph}</p>
                ))}
              </div>
            </div>

            {campaign.rules && (
              <div>
                <h3 className="font-semibold text-lg mb-3">活动规则</h3>
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
              <div className="flex gap-3">
                <Button 
                  onClick={handleParticipate}
                  disabled={hasParticipated}
                  className="flex-1"
                  size="lg"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  {hasParticipated ? '已参与' : '参与活动'}
                </Button>
              </div>
            )}

            {!isActive && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">此活动已结束</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};