import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users } from "lucide-react";

import ShareDinner from "@/components/ShareDinner";
import CancelDinnerDialog from "@/components/CancelDinnerDialog";
import { SEO } from "@/components/SEO";
import { useSEO } from "@/hooks/useSEO";
import { CampaignBanner } from "@/components/CampaignBanner";
import { FastSkeletonCard } from "@/components/FastSkeletonCard";
import { OptimizedMyDinnersCard } from "@/components/OptimizedMyDinnersCard";
import { useOptimizedDinners } from "@/hooks/useOptimizedDinners";
import { useAuth } from '@/contexts/AuthContext';
import { SmartMatchButton } from "@/components/SmartMatchButton";
import { GuestBrowsePrompt } from "@/components/GuestBrowsePrompt";
import { useToast } from "@/hooks/use-toast";
import { EnhancedDinnerCard } from "@/components/EnhancedDinnerCard";
import { DinnerSearchFilter } from "@/components/DinnerSearchFilter";
import { useRecommendation } from "@/hooks/useRecommendation";
import type { Dinner } from '@/types/database';

interface CreatorProfile {
  nickname: string;
  avatar_url: string | null;
}

const Discover = () => {
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTab = searchParams.get('tab') || 'discover';
  
  // Discover tab states
  const [allDinners, setAllDinners] = useState<Dinner[]>([]);
  const [joinedDinnerIds, setJoinedDinnerIds] = useState<string[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [creatorProfiles, setCreatorProfiles] = useState<Record<string, CreatorProfile>>({});
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Search & filter state
  const [filters, setFilters] = useState({
    searchQuery: '',
    mode: null as string | null,
    timeRange: null as string | null,
    category: null as string | null,
  });

  // My Dinners tab states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedDinner, setSelectedDinner] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  
  const { joinedDinners, createdDinners, participantCounts: myDinnersParticipantCounts, loading: myDinnersLoading, refetch } = useOptimizedDinners(user);
  const seoData = getPageSEO('discover');

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'discover') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', value);
    }
    setSearchParams(newParams);
  };

  const showGuestPrompt = !user;

  // Recommendation engine
  const { matchScores, matchReasons, isReady: recommendationReady } = useRecommendation(user, allDinners);

  // Filtered dinners with search + mode + time filters + recommendation sorting
  const filteredDinners = useMemo(() => {
    let result = allDinners.filter(d => new Date(d.dinner_time) > new Date());

    // Filter friends_only dinners: only show if user is creator or friend of creator
    if (user) {
      result = result.filter(d => {
        if (!d.friends_only) return true;
        if (d.created_by === user.id) return true;
        return friendIds.has(d.created_by);
      });
    } else {
      // Guests can't see friends_only dinners
      result = result.filter(d => !d.friends_only);
    }
    // Text search
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(d => 
        d.title.toLowerCase().includes(q) || 
        d.location?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.food_preferences?.some(p => p.toLowerCase().includes(q))
      );
    }

    // Mode filter
    if (filters.mode) {
      result = result.filter(d => d.dinner_mode === filters.mode);
    }

    // Category filter
    if (filters.category) {
      result = result.filter(d => (d as any).dinner_category === filters.category);
    }

    // Time filter
    if (filters.timeRange) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const dayAfterTomorrow = new Date(today); dayAfterTomorrow.setDate(today.getDate() + 2);
      
      switch (filters.timeRange) {
        case 'today':
          result = result.filter(d => {
            const t = new Date(d.dinner_time);
            return t >= now && t < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          });
          break;
        case 'tomorrow':
          result = result.filter(d => {
            const t = new Date(d.dinner_time);
            return t >= tomorrow && t < dayAfterTomorrow;
          });
          break;
        case 'weekend': {
          const dayOfWeek = now.getDay();
          const satStart = new Date(today);
          satStart.setDate(today.getDate() + (6 - dayOfWeek));
          const monStart = new Date(satStart);
          monStart.setDate(satStart.getDate() + 2);
          result = result.filter(d => {
            const t = new Date(d.dinner_time);
            return t >= satStart && t < monStart;
          });
          break;
        }
        case 'thisWeek': {
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
          result = result.filter(d => {
            const t = new Date(d.dinner_time);
            return t >= now && t < endOfWeek;
          });
          break;
        }
      }
    }

    // Sort by match score (descending) when user is logged in, then by time
    if (user && Object.keys(matchScores).length > 0) {
      result.sort((a, b) => {
        const scoreA = matchScores[a.id] || 0;
        const scoreB = matchScores[b.id] || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(a.dinner_time).getTime() - new Date(b.dinner_time).getTime();
      });
    }

    return result;
  }, [allDinners, filters, matchScores, user, friendIds]);

  const handleJoinDinner = async (dinnerId: string) => {
    if (!user) {
      toast({ title: t('common.pleaseLogin'), description: t('dinnerDetail.loginToJoin') });
      return;
    }
    try {
      const { error } = await supabase.from('dinner_participants').insert([{ dinner_id: dinnerId, user_id: user.id }]);
      if (error) {
        toast({ title: t('dinnerDetail.joinFailed'), description: error.message, variant: "destructive" });
      } else {
        toast({ title: t('dinnerDetail.joinSuccess'), description: t('dinnerDetail.joinSuccessDesc') });
        setJoinedDinnerIds(prev => [...prev, dinnerId]);
        setParticipantCounts(prev => ({ ...prev, [dinnerId]: (prev[dinnerId] || 0) + 1 }));
      }
    } catch (error: any) {
      toast({ title: t('dinnerDetail.joinFailed'), description: error.message, variant: "destructive" });
    }
  };

  const handleLeaveDinner = async (dinnerId: string) => {
    if (!user) {
      toast({ title: t('common.pleaseLogin'), description: t('dinnerDetail.loginToJoin') });
      return;
    }
    try {
      const { error } = await supabase.from('dinner_participants').delete().eq('dinner_id', dinnerId).eq('user_id', user.id);
      if (error) {
        toast({ title: t('dinnerDetail.joinFailed'), description: error.message, variant: "destructive" });
      } else {
        toast({ title: t('dinner.leaveSuccess', '已退出饭局'), description: t('dinner.leaveSuccessDesc', '你已成功退出该饭局') });
        setJoinedDinnerIds(prev => prev.filter(id => id !== dinnerId));
        setParticipantCounts(prev => ({ ...prev, [dinnerId]: Math.max((prev[dinnerId] || 1) - 1, 0) }));
      }
    } catch (error: any) {
      toast({ title: t('dinnerDetail.joinFailed'), description: error.message, variant: "destructive" });
    }
  };

  const forceReset = useCallback(() => {
    setShowCancelDialog(false);
    setSelectedDinner(null);
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
  }, []);

  const handleCancelDinner = async (reason?: string) => {
    if (!user || !selectedDinner) return;
    setCancelling(true);
    try {
      const { data, error } = await supabase.rpc('cancel_dinner', {
        dinner_id_param: selectedDinner.id,
        user_id_param: user.id,
        cancellation_reason_param: reason || ''
      });
      if (error) throw error;
      if (!data || !Array.isArray(data) || data.length === 0) throw new Error('函数返回数据格式错误');
      const result = data[0];
      if (result.success || result.f1) {
        const isCreator = selectedDinner.created_by === user.id;
        const message = result.message || result.f2 || (isCreator ? t('admin.dinnerCancelled') : t('admin.leftDinner'));
        const isLate = result.is_late_cancellation || result.f4 || false;
        toast({
          title: isCreator ? t('admin.dinnerCancelled') : t('admin.leftDinner'),
          description: message,
          variant: isLate ? "destructive" : "default",
        });
        refetch();
      } else {
        toast({ title: t('dinnerDetail.operationFailed'), description: result.message || result.f2 || t('dinnerDetail.operationFailed'), variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: t('dinnerDetail.operationFailed'), description: error.message || t('admin.cancelOperationError'), variant: "destructive" });
    } finally {
      setCancelling(false);
      setShowCancelDialog(false);
      setSelectedDinner(null);
    }
  };

  const handleCancelClick = useCallback((dinner: any, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setSelectedDinner(dinner);
    setShowCancelDialog(true);
  }, []);

  const handleCardClick = useCallback((dinnerId: string) => {
    navigate(`/dinner/${dinnerId}`);
  }, [navigate]);

  const renderMyDinnerCard = useCallback((dinner: any, index: number) => (
    <OptimizedMyDinnersCard
      key={`${dinner.id}-${dinner.updated_at}`}
      dinner={dinner}
      participantCount={myDinnersParticipantCounts[dinner.id] || 0}
      userId={user?.id}
      onCancel={handleCancelClick}
      onClick={() => handleCardClick(dinner.id)}
    />
  ), [myDinnersParticipantCounts, user?.id, handleCancelClick, handleCardClick]);

  useEffect(() => {
    const fetchDinners = async () => {
      const { data, error } = await supabase
        .from("dinners")
        .select("*")
        .gte("dinner_time", new Date().toISOString())
        .order("dinner_time", { ascending: true });

      if (error) {
        console.error("Error fetching dinners:", error);
      } else {
        const activeDinners = data?.filter(dinner => 
          (dinner as any).status === 'active' || !(dinner as any).status
        ) || [];
        
        setAllDinners(activeDinners);

        // Fetch creator profiles
        const creatorIds = [...new Set(activeDinners.map(d => d.created_by))];
        if (creatorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, nickname, avatar_url')
            .in('user_id', creatorIds);
          
          if (profiles) {
            const profileMap: Record<string, CreatorProfile> = {};
            profiles.forEach(p => {
              profileMap[p.user_id] = { nickname: p.nickname, avatar_url: p.avatar_url };
            });
            setCreatorProfiles(profileMap);
          }
        }

        // Fetch participant counts
        if (activeDinners.length > 0) {
          const dinnerIds = activeDinners.map(dinner => dinner.id);
          const { data: participantData, error: participantError } = await supabase
            .from("dinner_participants")
            .select("dinner_id")
            .in("dinner_id", dinnerIds);

          if (!participantError && participantData) {
            const counts: Record<string, number> = {};
            participantData.forEach(p => {
              counts[p.dinner_id] = (counts[p.dinner_id] || 0) + 1;
            });
            activeDinners.forEach(dinner => {
              counts[dinner.id] = (counts[dinner.id] || 0) + 1;
            });
            setParticipantCounts(counts);
          }
        }
      }

      if (user) {
        // Fetch joined dinner IDs and friend IDs in parallel
        const [joinedRes, friendsRes] = await Promise.all([
          supabase
            .from("dinner_participants")
            .select("dinner_id")
            .eq("user_id", user.id),
          supabase
            .from("friendships")
            .select("requester_id, addressee_id")
            .eq("status", "accepted")
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        ]);

        if (!joinedRes.error) {
          setJoinedDinnerIds(joinedRes.data?.map(item => item.dinner_id) || []);
        }

        if (!friendsRes.error && friendsRes.data) {
          const fIds = new Set<string>();
          friendsRes.data.forEach(f => {
            if (f.requester_id === user.id) fIds.add(f.addressee_id);
            else fIds.add(f.requester_id);
          });
          setFriendIds(fIds);
        }
      }

      setLoading(false);
    };

    fetchDinners();
  }, [user]);


  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <CampaignBanner className="mb-6" />
          
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              {t('nav.dinners')}
            </h1>
          </div>
          
          <GuestBrowsePrompt show={showGuestPrompt} />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-14 p-1 bg-gradient-primary rounded-xl shadow-lg">
            <TabsTrigger 
              value="discover" 
              className="flex items-center gap-2 text-lg font-semibold h-full rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md text-primary-foreground transition-all"
            >
              <Search className="w-4 h-4" />
              {t('dinnerTabs.discover')}
            </TabsTrigger>
            <TabsTrigger 
              value="myDinners" 
              className="flex items-center gap-2 text-lg font-semibold h-full rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md text-primary-foreground transition-all"
            >
              <Users className="w-4 h-4" />
              {t('dinnerTabs.myDinners')}
              {(joinedDinners.length + createdDinners.length) > 0 && (
                <span className="bg-background text-primary px-2 py-1 rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center font-bold">
                  {joinedDinners.length + createdDinners.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4">
            {/* Smart Match Button - always render to preserve dialog state */}
            <SmartMatchButton />

            {/* Search & Filter */}
            <DinnerSearchFilter
              filters={filters}
              onFiltersChange={setFilters}
              resultCount={filteredDinners.length}
            />
            
            {/* Dinner Cards */}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <FastSkeletonCard key={i} />
                ))}
              </div>
            ) : filteredDinners.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDinners.map((dinner) => {
                  const participantCount = participantCounts[dinner.id] || 1;
                  const isJoined = joinedDinnerIds.includes(dinner.id);
                  const isFull = participantCount >= dinner.max_participants;
                  const isCreator = !!(user && dinner.created_by === user.id);
                  const hasExpired = new Date(dinner.dinner_time) < new Date();

                  return (
                    <EnhancedDinnerCard
                      key={dinner.id}
                      dinner={dinner}
                      participantCount={participantCount}
                      isJoined={isJoined}
                      isCreator={isCreator}
                      isFull={isFull}
                      hasExpired={hasExpired}
                      creatorProfile={creatorProfiles[dinner.created_by]}
                      matchScore={user ? matchScores[dinner.id] : undefined}
                      matchReasons={user ? matchReasons[dinner.id] : undefined}
                      onJoin={handleJoinDinner}
                      onLeave={handleLeaveDinner}
                      onClick={() => navigate(`/dinner/${dinner.id}`)}
                      userId={user?.id}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-2">{t('dinner.noDinners')}</h3>
                <p className="text-muted-foreground mb-6">{t('dinner.noFilterResults')}</p>
                <Button
                  onClick={() => navigate('/create-dinner')}
                  size="lg"
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all h-14 px-8"
                >
                  {t('dinner.create')}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="myDinners" className="space-y-6">
            <div className="space-y-8">
              {joinedDinners.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-bold text-foreground">❤️ {t('myDinners.joined', '参与的饭局')}</h2>
                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center">
                      {joinedDinners.length}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {joinedDinners.map((dinner, index) => renderMyDinnerCard(dinner, index))}
                  </div>
                </section>
              )}

              {createdDinners.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-bold text-foreground">✨ {t('myDinners.created', '创建的饭局')}</h2>
                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center">
                      {createdDinners.length}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {createdDinners.map((dinner, index) => renderMyDinnerCard(dinner, index))}
                  </div>
                </section>
              )}

              {myDinnersLoading && (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <FastSkeletonCard key={i} />
                  ))}
                </div>
              )}

              {!myDinnersLoading && joinedDinners.length === 0 && createdDinners.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🍽️</div>
                  <h3 className="text-2xl font-bold mb-2">{t('myDinners.empty', '还没有饭局')}</h3>
                  <p className="text-muted-foreground mb-6">{t('myDinners.emptyDesc', '创建你的第一个饭局或者浏览其他饭局加入吧！')}</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => navigate('/create-dinner')} className="bg-gradient-primary text-primary-foreground">
                      {t('dinner.create')}
                    </Button>
                    <Button variant="outline" onClick={() => handleTabChange('discover')}>
                      {t('dinnerTabs.discover')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CancelDinnerDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelDinner}
        loading={cancelling}
        dinnerTitle={selectedDinner?.title || ''}
        dinnerTime={selectedDinner?.dinner_time || ''}
        isCreator={selectedDinner?.created_by === user?.id}
      />
    </div>
  );
};

export default Discover;
