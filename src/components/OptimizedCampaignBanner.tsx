import { memo, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { requestDeduplicator } from '@/hooks/useQueryCache';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface OptimizedCampaignBannerProps {
  className?: string;
}

const OptimizedCampaignBanner = memo(({ className = "" }: OptimizedCampaignBannerProps) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [isOpen, setIsOpen] = useState(false);

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', 'active'],
    queryFn: () => requestDeduplicator.deduplicate('campaigns-active', async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true)
        .order('display_priority', { ascending: true });

      if (error) throw error;
      return data as Campaign[];
    }),
    staleTime: 1000 * 60 * 30, // 30 minutes for campaigns
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const activeCampaign = useMemo(() => {
    if (!campaigns?.length) return null;
    
    const now = new Date();
    return campaigns.find(campaign => {
      const startDate = new Date(campaign.start_date);
      const endDate = new Date(campaign.end_date);
      return now >= startDate && now <= endDate;
    });
  }, [campaigns]);

  const displayTitle = useMemo(() => {
    if (!activeCampaign) return '';
    
    const useEnglish = currentLanguage === 'en' && activeCampaign.title_en;
    return useEnglish ? activeCampaign.title_en! : activeCampaign.title;
  }, [activeCampaign, currentLanguage]);

  const displayDescription = useMemo(() => {
    if (!activeCampaign) return '';
    
    const useEnglish = currentLanguage === 'en' && activeCampaign.description_en;
    return useEnglish ? activeCampaign.description_en! : activeCampaign.description;
  }, [activeCampaign, currentLanguage]);

  if (!activeCampaign) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`campaign-banner-container mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg ${className}`}>
        <div className="max-w-4xl mx-auto">
          <CollapsibleTrigger className="w-full p-4 text-left hover:bg-primary/5 transition-colors rounded-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary leading-tight pr-4">
                {displayTitle}
              </h2>
              <ChevronDown className={`h-5 w-5 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-line">
              {displayDescription}
            </div>
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  );
});

OptimizedCampaignBanner.displayName = 'OptimizedCampaignBanner';

export { OptimizedCampaignBanner };