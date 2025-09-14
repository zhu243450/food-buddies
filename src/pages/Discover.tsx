import { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, MapPin, Users, Search, Sparkles, Zap, Clock, Users2, Filter } from "lucide-react";
import Navigation from "@/components/Navigation";
import DinnerFiltersComponent, { DinnerFilters } from "@/components/DinnerFilters";
import ShareDinner from "@/components/ShareDinner";
import CancelDinnerDialog from "@/components/CancelDinnerDialog";
import { SEO } from "@/components/SEO";
import { useSEO } from "@/hooks/useSEO";
import { CampaignBanner } from "@/components/CampaignBanner";
import { OptimizedCampaignBanner } from "@/components/OptimizedCampaignBanner";
import { FastSkeletonCard } from "@/components/FastSkeletonCard";
import { OptimizedMyDinnersCard } from "@/components/OptimizedMyDinnersCard";
import { useOptimizedDinners } from "@/hooks/useOptimizedDinners";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import type { User } from '@supabase/supabase-js';
import type { Dinner } from '@/types/database';

interface DinnerCardProps {
  dinner: Dinner;
  participantCount: number;
  isJoined: boolean;
  userId?: string;
  onJoin: (dinnerId: string) => void;
  onLeave: (dinnerId: string) => void;
  onClick: () => void;
}

const DinnerCard: React.FC<DinnerCardProps> = memo(({ dinner, participantCount, isJoined, userId, onJoin, onLeave, onClick }) => {
  const { t } = useTranslation();

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onJoin(dinner.id);
  };

  const handleLeaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onLeave(dinner.id);
  };

  const isFull = participantCount >= dinner.max_participants;
  const isFriendsOnly = dinner.friends_only;
  const sameGenderPref = dinner.gender_preference === 'same_gender';
  const oppositeGenderPref = dinner.gender_preference === 'opposite_gender';
  const dinnerTime = new Date(dinner.dinner_time).toLocaleString();

  return (
    <Card
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          {dinner.title}
          {dinner.dinner_mode === 'instant' && (
            <Badge variant="secondary" className="ml-2">
              <Zap className="w-4 h-4 mr-1" />
              {t('dinner.instant')}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-gray-500">
          <div className="flex items-center gap-1">
            <CalendarDays className="w-4 h-4 mr-1" />
            {dinnerTime}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 mr-1" />
            {dinner.location}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-4">{dinner.description}</p>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {participantCount} / {dinner.max_participants} {t('dinnerDetail.people')}
          </div>
          {isFull && <Badge variant="destructive">{t('dinner.full')}</Badge>}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {isFriendsOnly && <Badge variant="outline">{t('dinner.friendsOnly')}</Badge>}
          {sameGenderPref && <Badge variant="outline">{t('filter.sameGender')}</Badge>}
          {oppositeGenderPref && <Badge variant="outline">{t('filter.oppositeGender')}</Badge>}
        </div>
        <div className="flex justify-end">
          {userId && (
            isJoined ? (
              <Button variant="destructive" size="sm" onClick={handleLeaveClick} disabled={isFull}>
                {t('dinner.leave')}
              </Button>
            ) : (
              <Button size="sm" onClick={handleJoinClick} disabled={isFull}>
                {t('dinner.join')}
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
});

const Discover = () => {
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab state management
  const activeTab = searchParams.get('tab') || 'discover';
  
  // Discover tab states
  const [allDinners, setAllDinners] = useState<Dinner[]>([]);
  const [filteredDinners, setFilteredDinners] = useState<Dinner[]>([]);
  const [joinedDinnerIds, setJoinedDinnerIds] = useState<string[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DinnerFilters>({
    genderPreference: "all",
    timeRange: "all", 
    timeOfDay: [],
    location: "",
    radius: 10,
    foodPreferences: [],
    dietaryRestrictions: [],
    dinnerMode: [],
    urgencyLevel: [],
    maxParticipants: [2, 20],
    showExpired: false
  });

  // My Dinners tab states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedDinner, setSelectedDinner] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  
  // 使用优化的hook for My Dinners
  const { joinedDinners, createdDinners, participantCounts: myDinnersParticipantCounts, loading: myDinnersLoading, refetch } = useOptimizedDinners(user);

  const seoData = getPageSEO('discover');

  // Handle tab change
  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'discover') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', value);
    }
    setSearchParams(newParams);
  };

  // Authentication check
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleJoinDinner = async (dinnerId: string) => {
    if (!user) {
      toast({
        title: t('common.pleaseLogin'),
        description: t('dinnerDetail.loginToJoin'),
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('dinner_participants')
        .insert([{ dinner_id: dinnerId, user_id: user.id }]);

      if (error) {
        console.error("Error joining dinner:", error);
        toast({
          title: t('dinnerDetail.joinFailed'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t('dinnerDetail.joinSuccess'),
          description: t('dinnerDetail.joinSuccessDesc'),
        });
        setJoinedDinnerIds(prev => [...prev, dinnerId]);
        setParticipantCounts(prev => ({
          ...prev,
          [dinnerId]: (prev[dinnerId] || 0) + 1,
        }));
      }
    } catch (error: any) {
      console.error("Error joining dinner:", error);
      toast({
        title: t('dinnerDetail.joinFailed'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLeaveDinner = async (dinnerId: string) => {
    if (!user) {
      toast({
        title: t('common.pleaseLogin'),
        description: t('dinnerDetail.loginToJoin'),
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('dinner_participants')
        .delete()
        .eq('dinner_id', dinnerId)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error leaving dinner:", error);
        toast({
          title: t('dinnerDetail.joinFailed'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t('dinnerDetail.joinSuccess'),
          description: t('dinnerDetail.joinSuccessDesc'),
        });
        setJoinedDinnerIds(prev => prev.filter(id => id !== dinnerId));
        setParticipantCounts(prev => {
          const newCounts = { ...prev };
          newCounts[dinnerId] = Math.max((newCounts[dinnerId] || 1) - 1, 0);
          return newCounts;
        });
      }
    } catch (error: any) {
      console.error("Error leaving dinner:", error);
      toast({
        title: t('dinnerDetail.joinFailed'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 强制重置函数 for My Dinners
  const forceReset = useCallback(() => {
    setShowCancelDialog(false);
    setSelectedDinner(null);
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
  }, []);

  // My Dinners functionality
  const handleCancelDinner = async (reason?: string) => {
    if (!user || !selectedDinner) return;

    console.log('开始删除饭局:', selectedDinner.id, '用户ID:', user.id);
    setCancelling(true);

    try {
      const { data, error } = await supabase.rpc('cancel_dinner', {
        dinner_id_param: selectedDinner.id,
        user_id_param: user.id,
        cancellation_reason_param: reason || ''
      });

      console.log('删除操作结果:', { data, error });

      if (error) {
        console.error('删除操作错误:', error);
        throw error;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('函数返回数据格式错误:', data);
        throw new Error('函数返回数据格式错误');
      }

      const result = data[0];
      console.log('删除结果详情:', JSON.stringify(result, null, 2));

      if (result.success || result.f1) {
        const isCreator = selectedDinner.created_by === user.id;
        const message = result.message || result.f2 || (isCreator ? t('admin.dinnerCancelled') : t('admin.leftDinner'));
        const isLate = result.is_late_cancellation || result.f4 || false;

        toast({
          title: isCreator ? t('admin.dinnerCancelled') : t('admin.leftDinner'),
          description: message,
          variant: isLate ? "destructive" : "default",
        });

        // 立即更新数据
        refetch();
      } else {
        const message = result.message || result.f2 || "操作失败";
        console.error('删除失败:', message);
        toast({
          title: "删除失败",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error.message || t('admin.cancelOperationError'),
        variant: "destructive",
      });
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

  // 优化渲染函数 for My Dinners
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
      if (!user) return;

      const { data, error } = await supabase
        .from("dinners")
        .select("*")
        .order("dinner_time", { ascending: true });

      if (error) {
        console.error("Error fetching dinners:", error);
      } else {
        const activeDinners = data?.filter(dinner => 
          (dinner as any).status === 'active' || !(dinner as any).status
        ) || [];
        
        setAllDinners(activeDinners);
        setFilteredDinners(activeDinners);
      }

      // Fetch joined dinner IDs
      const { data: joinedData, error: joinedError } = await supabase
        .from("dinner_participants")
        .select("dinner_id")
        .eq("user_id", user.id);

      if (joinedError) {
        console.error("Error fetching joined dinners:", joinedError);
      } else {
        setJoinedDinnerIds(joinedData?.map(item => item.dinner_id) || []);
      }

      // Fetch participant counts
      if (data && data.length > 0) {
        const activeDinners = data?.filter(dinner => 
          (dinner as any).status === 'active' || !(dinner as any).status
        ) || [];
        
        const dinnerIds = activeDinners.map(dinner => dinner.id);
        const { data: participantData, error: participantError } = await supabase
          .from("dinner_participants")
          .select("dinner_id")
          .in("dinner_id", dinnerIds);

        if (participantError) {
          console.error("Error fetching participant counts:", participantError);
        } else {
          const counts: Record<string, number> = {};
          participantData?.forEach(participant => {
            counts[participant.dinner_id] = (counts[participant.dinner_id] || 0) + 1;
          });

          // Add creator count for each dinner
          activeDinners.forEach(dinner => {
            counts[dinner.id] = (counts[dinner.id] || 0) + 1;
          });

          setParticipantCounts(counts);
        }
      }

      setLoading(false);
    };

    fetchDinners();
  }, [user]);

  // Apply filters
  useEffect(() => {
    if (!allDinners.length) return;

    let filtered = [...allDinners];

    if (filters.genderPreference !== "all") {
      filtered = filtered.filter(dinner => dinner.gender_preference === filters.genderPreference);
    }

    if (filters.timeRange !== "all") {
      const now = new Date();
      switch (filters.timeRange) {
        case "today":
          filtered = filtered.filter(dinner => {
            const dinnerDate = new Date(dinner.dinner_time);
            return dinnerDate.getDate() === now.getDate() &&
              dinnerDate.getMonth() === now.getMonth() &&
              dinnerDate.getFullYear() === now.getFullYear();
          });
          break;
        case "tomorrow":
          filtered = filtered.filter(dinner => {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            const dinnerDate = new Date(dinner.dinner_time);
            return dinnerDate.getDate() === tomorrow.getDate() &&
              dinnerDate.getMonth() === tomorrow.getMonth() &&
              dinnerDate.getFullYear() === tomorrow.getFullYear();
          });
          break;
        case "thisWeek":
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          const endOfWeek = new Date(now);
          endOfWeek.setDate(now.getDate() + (6 - now.getDay()));

          filtered = filtered.filter(dinner => {
            const dinnerDate = new Date(dinner.dinner_time);
            return dinnerDate >= startOfWeek && dinnerDate <= endOfWeek;
          });
          break;
        case "weekend":
          filtered = filtered.filter(dinner => {
            const dinnerDate = new Date(dinner.dinner_time);
            return dinnerDate.getDay() === 0 || dinnerDate.getDay() === 6;
          });
          break;
        default:
          break;
      }
    }

    if (filters.timeOfDay && filters.timeOfDay.length > 0) {
      filtered = filtered.filter(dinner => {
        const dinnerTime = new Date(dinner.dinner_time);
        const hour = dinnerTime.getHours();
        return filters.timeOfDay?.some(time => {
          switch (time) {
            case "lunch":
              return hour >= 11 && hour < 14;
            case "dinnerTime":
              return hour >= 17 && hour < 21;
            case "supper":
              return hour >= 21 || hour < 2;
            default:
              return false;
          }
        });
      });
    }

    if (filters.location) {
      filtered = filtered.filter(dinner =>
        dinner.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.foodPreferences && filters.foodPreferences.length > 0) {
      filtered = filtered.filter(dinner =>
        filters.foodPreferences?.every(pref => (dinner as any).food_preferences?.includes(pref))
      );
    }

    if (filters.dietaryRestrictions && filters.dietaryRestrictions.length > 0) {
      filtered = filtered.filter(dinner =>
        filters.dietaryRestrictions?.every(restrict => (dinner as any).dietary_restrictions?.includes(restrict))
      );
    }

    if (filters.dinnerMode && filters.dinnerMode.length > 0) {
      filtered = filtered.filter(dinner =>
        filters.dinnerMode?.includes(dinner.dinner_mode)
      );
    }

    if (filters.urgencyLevel && filters.urgencyLevel.length > 0) {
      filtered = filtered.filter(dinner =>
        filters.urgencyLevel?.includes(dinner.urgency_level)
      );
    }

    filtered = filtered.filter(dinner =>
      participantCounts[dinner.id] ? participantCounts[dinner.id] + 1 >= filters.maxParticipants[0] && participantCounts[dinner.id] + 1 <= filters.maxParticipants[1] : 1 >= filters.maxParticipants[0] && 1 <= filters.maxParticipants[1]
    );

    if (!filters.showExpired) {
      filtered = filtered.filter(dinner => new Date(dinner.dinner_time) > new Date());
    }

    setFilteredDinners(filtered);
  }, [allDinners, filters]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <CampaignBanner className="mb-6" />
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              {t('nav.dinners')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('dinner.description')}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger 
              value="discover" 
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Search className="w-4 h-4" />
              {t('dinnerTabs.discover')}
            </TabsTrigger>
            <TabsTrigger 
              value="myDinners" 
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Users className="w-4 h-4" />
              {t('dinnerTabs.myDinners')}
              {(joinedDinners.length + createdDinners.length) > 0 && (
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center">
                  {joinedDinners.length + createdDinners.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Filters */}
            <div className="mb-6">
              <DinnerFiltersComponent 
                filters={filters} 
                onFiltersChange={setFilters}
                activeFilterCount={Object.values(filters).filter(v => 
                  Array.isArray(v) ? v.length > 0 : 
                  v !== "all" && v !== "" && v !== false && v !== 10 && !Array.isArray(v)
                ).length}
              />
            </div>
            
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
                  const isCreator = user && dinner.created_by === user.id;
                  const hasExpired = new Date(dinner.dinner_time) < new Date();

                  return (
                    <Card 
                      key={dinner.id} 
                      className="hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
                      onClick={() => navigate(`/dinner/${dinner.id}`)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                            {dinner.title}
                          </CardTitle>
                          <div className="flex gap-1 ml-2 flex-shrink-0">
                            {hasExpired && (
                              <Badge variant="secondary" className="text-xs">
                                {t('dinner.expiredBadge')}
                              </Badge>
                            )}
                            {isJoined && (
                              <Badge variant="default" className="text-xs">
                                {t('dinner.joined')}
                              </Badge>
                            )}
                            {isFull && (
                              <Badge variant="destructive" className="text-xs">
                                {t('dinner.full')}
                              </Badge>
                            )}
                            {isCreator && (
                              <Badge variant="outline" className="text-xs">
                                发起人
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {dinner.description && (
                          <CardDescription className="line-clamp-2 text-sm">
                            {dinner.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      
                      <CardContent className="pt-0 space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              {new Date(dinner.dinner_time).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{dinner.location}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>{participantCount}/{dinner.max_participants} {t('dinnerDetail.people')}</span>
                          </div>
                        </div>

                        {/* Food Preferences */}
                        {dinner.food_preferences && dinner.food_preferences.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {dinner.food_preferences.slice(0, 3).map((pref, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {pref}
                              </Badge>
                            ))}
                            {dinner.food_preferences.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{dinner.food_preferences.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Dinner Mode & Urgency */}
                        <div className="flex gap-2 items-center">
                          {(dinner as any).dinner_mode && (
                            <div className="flex items-center gap-1">
                              {(dinner as any).dinner_mode === 'instant' && <Zap className="w-3 h-3" />}
                              {(dinner as any).dinner_mode === 'scheduled' && <Clock className="w-3 h-3" />}
                              {(dinner as any).dinner_mode === 'group' && <Users2 className="w-3 h-3" />}
                              <span className="text-xs text-muted-foreground capitalize">
                                {t(`dinner.${(dinner as any).dinner_mode}`)}
                              </span>
                            </div>
                          )}
                          
                          {(dinner as any).urgency_level && (dinner as any).urgency_level !== 'normal' && (
                            <Badge 
                              variant={(dinner as any).urgency_level === 'urgent' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {t(`dinner.${(dinner as any).urgency_level}`)}
                            </Badge>
                          )}
                        </div>

                        {/* Share Button */}
                        <div className="flex justify-end">
                          <ShareDinner 
                            dinner={dinner}
                            participantCount={participantCount}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-2">{t('dinner.noDinners')}</h3>
                <p className="text-muted-foreground mb-6">{t('dinner.noFilterResults')}</p>
                <Button onClick={() => navigate('/create-dinner')}>
                  {t('dinner.create')}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="myDinners" className="space-y-6">
            {/* Combined My Dinners View */}
            <div className="space-y-8">
              {/* Joined Dinners Section */}
              {joinedDinners.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-bold text-foreground">❤️ 参与的饭局</h2>
                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center">
                      {joinedDinners.length}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {joinedDinners.map((dinner, index) => renderMyDinnerCard(dinner, index))}
                  </div>
                </section>
              )}

              {/* Created Dinners Section */}
              {createdDinners.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-bold text-foreground">✨ 创建的饭局</h2>
                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center">
                      {createdDinners.length}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {createdDinners.map((dinner, index) => renderMyDinnerCard(dinner, index))}
                  </div>
                </section>
              )}

              {/* Loading State */}
              {myDinnersLoading && (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <FastSkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!myDinnersLoading && joinedDinners.length === 0 && createdDinners.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🍽️</div>
                  <h3 className="text-2xl font-bold mb-2">还没有饭局</h3>
                  <p className="text-muted-foreground mb-6">创建你的第一个饭局或者浏览其他饭局加入吧！</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => navigate('/create-dinner')}>
                      创建饭局
                    </Button>
                    <Button variant="outline" onClick={() => handleTabChange('discover')}>
                      浏览饭局
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
