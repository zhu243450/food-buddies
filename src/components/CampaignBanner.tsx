import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Clock, Gift, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
}

interface CampaignBannerProps {
  className?: string;
}

export const CampaignBanner = ({ className = "" }: CampaignBannerProps) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    loadActiveCampaigns();
    console.log('CampaignBanner: Loading campaigns...', { currentLanguage: i18n.language });
    
    // 自动轮播
    if (campaigns.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % campaigns.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [campaigns.length, i18n.language]);

  const loadActiveCampaigns = async () => {
    try {
      console.log('CampaignBanner: Fetching campaigns from Supabase...', { language: i18n.language });
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('display_priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('CampaignBanner: Error fetching campaigns:', error);
        throw error;
      }
      
      console.log('CampaignBanner: Campaigns fetched:', data?.length || 0, data);
      setCampaigns(data || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const handleCampaignClick = async (campaign: Campaign) => {
    try {
      // 增加点击计数
      await supabase
        .from('campaigns')
        .update({ click_count: campaign.click_count + 1 })
        .eq('id', campaign.id);

      // 导航到活动详情页
      navigate(`/campaign/${campaign.id}`);
    } catch (error) {
      console.error('Failed to track campaign click:', error);
      toast.error(t('campaign.openFailed'));
    }
  };

  const handleView = async (campaign: Campaign) => {
    try {
      // 增加浏览计数（每个会话只计算一次）
      const viewedKey = `campaign_viewed_${campaign.id}`;
      const hasViewed = sessionStorage.getItem(viewedKey);
      
      if (!hasViewed) {
        await supabase
          .from('campaigns')
          .update({ view_count: campaign.view_count + 1 })
          .eq('id', campaign.id);
        
        sessionStorage.setItem(viewedKey, 'true');
      }
    } catch (error) {
      console.error('Failed to track campaign view:', error);
    }
  };

  useEffect(() => {
    if (campaigns.length > 0 && campaigns[currentIndex]) {
      handleView(campaigns[currentIndex]);
    }
  }, [currentIndex, campaigns]);

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'promotion':
        return <Gift className="h-5 w-5" />;
      case 'event':
        return <Clock className="h-5 w-5" />;
      default:
        return <Megaphone className="h-5 w-5" />;
    }
  };

  const getCampaignTypeName = (type: string) => {
    return t(`campaign.types.${type}`, t('campaign.types.default'));
  };

  if (!isVisible || campaigns.length === 0) {
    return null;
  }

  const currentCampaign = campaigns[currentIndex];

  return (
    <div className={`relative ${className}`}>
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getCampaignIcon(currentCampaign.campaign_type)}
                <Badge variant="secondary" className="text-xs">
                  {getCampaignTypeName(currentCampaign.campaign_type)}
                </Badge>
                {campaigns.length > 1 && (
                  <Badge variant="outline" className="text-xs">
                    {currentIndex + 1}/{campaigns.length}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-bold text-lg mb-2 text-foreground">
                {(() => {
                  const useEnglish = i18n.language === 'en' && currentCampaign.title_en;
                  console.log('CampaignBanner title display:', {
                    language: i18n.language,
                    hasEnglishTitle: !!currentCampaign.title_en,
                    useEnglish,
                    title: useEnglish ? currentCampaign.title_en : currentCampaign.title
                  });
                  return useEnglish ? currentCampaign.title_en : currentCampaign.title;
                })()}
              </h3>
              
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {(() => {
                  const useEnglish = i18n.language === 'en' && currentCampaign.description_en;
                  return useEnglish ? currentCampaign.description_en : currentCampaign.description;
                })()}
              </p>
              
              <div className="flex items-center justify-between">
                <Button 
                  onClick={() => handleCampaignClick(currentCampaign)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {t('campaign.viewDetails')}
                </Button>
                
                {campaigns.length > 1 && (
                  <div className="flex gap-1">
                    {campaigns.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentIndex ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {currentCampaign.image_url && (
              <div className="ml-4 flex-shrink-0">
                <img 
                  src={currentCampaign.image_url} 
                  alt={currentCampaign.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </CardContent>
      </Card>
    </div>
  );
};