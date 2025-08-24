import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, Search, Sparkles, Zap, Clock, Users2, Filter } from "lucide-react";
import Navigation from "@/components/Navigation";
import DinnerFiltersComponent, { DinnerFilters } from "@/components/DinnerFilters";
import ShareDinner from "@/components/ShareDinner";
import { SEO } from "@/components/SEO";
import { useSEO } from "@/hooks/useSEO";
import { CampaignBanner } from "@/components/CampaignBanner";
import type { User } from '@supabase/supabase-js';
import type { Dinner } from '@/types/database';

const Discover = () => {
  const { t } = useTranslation();
  const { getPageSEO } = useSEO();
  const [user, setUser] = useState<User | null>(null);
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
    showExpired: false  // 默认不显示过期饭局
  });
  const navigate = useNavigate();

  const seoData = getPageSEO('discover');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
    };

    getUser();
  }, [navigate]);

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
        // 获取所有活跃饭局，默认过滤掉已过期的
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

      // Fetch participant counts for all dinners (including creators)
      if (data && data.length > 0) {
        // Filter active dinners for participant count calculation
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
          
          // First, add creator count for each active dinner (creator always counts as 1 participant)
          activeDinners.forEach(dinner => {
            counts[dinner.id] = 1; // Creator counts as 1
          });
          
          // Then add other participants
          participantData?.forEach(participant => {
            counts[participant.dinner_id] = (counts[participant.dinner_id] || 1) + 1;
          });
          
          setParticipantCounts(counts);
        }
      }

      setLoading(false);
    };

    if (user) {
      fetchDinners();
      
      // 设置实时监听饭局状态变化
      const channel = supabase
        .channel('dinners-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'dinners'
          },
          () => {
            // 当饭局状态发生变化时重新获取数据
            fetchDinners();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // 筛选逻辑
  useEffect(() => {
    if (!allDinners.length) return;

    let filtered = [...allDinners];

    // 性别偏好筛选
    if (filters.genderPreference !== "all") {
      filtered = filtered.filter(dinner => {
        if (filters.genderPreference === "no_preference") {
          return !dinner.gender_preference || dinner.gender_preference === "no_preference";
        }
        return dinner.gender_preference === filters.genderPreference;
      });
    }

    // 默认过滤掉已过期的饭局（除非用户选择显示）
    if (!filters.showExpired) {
      const now = new Date();
      filtered = filtered.filter(dinner => new Date(dinner.dinner_time) >= now);
    }

    // 性别偏好筛选
    if (filters.timeRange !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(dinner => {
        const dinnerDate = new Date(dinner.dinner_time);
        
        switch (filters.timeRange) {
          case "today":
            return dinnerDate >= today && dinnerDate < tomorrow;
          case "tomorrow":
            const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
            return dinnerDate >= tomorrow && dinnerDate < dayAfterTomorrow;
          case "this_week":
            return dinnerDate >= today && dinnerDate <= weekEnd;
          case "weekend":
            const dayOfWeek = dinnerDate.getDay();
            return dayOfWeek === 0 || dayOfWeek === 6; // 周日=0, 周六=6
          default:
            return true;
        }
      });
    }

    // 时间段筛选
    if (filters.timeOfDay.length > 0) {
      filtered = filtered.filter(dinner => {
        const dinnerDate = new Date(dinner.dinner_time);
        const hour = dinnerDate.getHours();
        
        return filters.timeOfDay.some(timeSlot => {
          switch (timeSlot) {
            case "lunch":
              return hour >= 11 && hour < 14;
            case "dinner":
              return hour >= 17 && hour < 21;
            case "supper":
              return hour >= 21 && hour <= 24;
            default:
              return false;
          }
        });
      });
    }

    // 地点筛选
    if (filters.location) {
      const locationKeyword = filters.location.toLowerCase();
      filtered = filtered.filter(dinner => 
        dinner.location.toLowerCase().includes(locationKeyword)
      );
    }

    // 饮食偏好筛选
    if (filters.foodPreferences.length > 0) {
      filtered = filtered.filter(dinner => {
        if (!dinner.food_preferences) return false;
        return filters.foodPreferences.some(pref => 
          dinner.food_preferences!.includes(pref)
        );
      });
    }

    // 饮食禁忌筛选（排除有冲突禁忌的饭局）
    if (filters.dietaryRestrictions.length > 0) {
      filtered = filtered.filter(dinner => {
        if (!dinner.dietary_restrictions) return true; // 无禁忌的饭局通过
        return !filters.dietaryRestrictions.some(restriction => 
          dinner.dietary_restrictions!.includes(restriction)
        );
      });
    }

    // 饭局模式筛选
    if (filters.dinnerMode.length > 0) {
      filtered = filtered.filter(dinner => 
        filters.dinnerMode.includes(dinner.dinner_mode || "instant")
      );
    }

    // 紧急程度筛选
    if (filters.urgencyLevel.length > 0) {
      filtered = filtered.filter(dinner => 
        filters.urgencyLevel.includes(dinner.urgency_level || "normal")
      );
    }

    // 人数上限筛选
    filtered = filtered.filter(dinner => 
      dinner.max_participants >= filters.maxParticipants[0] && 
      dinner.max_participants <= filters.maxParticipants[1]
    );

    setFilteredDinners(filtered);
  }, [allDinners, filters]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.genderPreference !== "all") count++;
    if (filters.timeRange !== "all") count++;
    if (filters.timeOfDay.length > 0) count++;
    if (filters.location) count++;
    if (filters.foodPreferences.length > 0) count++;
    if (filters.dietaryRestrictions.length > 0) count++;
    if (filters.dinnerMode.length > 0) count++;
    if (filters.urgencyLevel.length > 0) count++;
    if (filters.maxParticipants[0] !== 2 || filters.maxParticipants[1] !== 20) count++;
    if (filters.showExpired) count++;
    return count;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const locale = localStorage.getItem('i18nextLng') === 'en' ? 'en-US' : 'zh-CN';
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const truncateDescription = (description: string, maxLength: number = 50) => {
    if (!description) return "";
    return description.length > maxLength 
      ? description.substring(0, maxLength) + "..."
      : description;
  };

  const getModeIcon = (mode: string | undefined) => {
    switch (mode) {
      case 'instant': return '🔥';
      case 'scheduled': return '📅';
      case 'group': return '👥';
      default: return '🔥';
    }
  };

  const getModeLabel = (mode: string | undefined) => {
    switch (mode) {
      case 'instant': return t('dinner.instant');
      case 'scheduled': return t('dinner.scheduled');
      case 'group': return t('dinner.group');
      default: return t('dinner.instant');
    }
  };

  const getUrgencyColor = (urgency: string | undefined) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'flexible': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">{t('nav.discover')}</h1>
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO {...seoData} />
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Campaign Banner */}
        <CampaignBanner className="mb-6" />
        
        {/* 标题区域 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Search className="w-8 h-8 text-primary" />
            {t('nav.discover')}
          </h1>
        </div>

        {/* 居中的按钮区域 */}
        <div className="flex justify-center gap-3 mb-6">
          <DinnerFiltersComponent 
            filters={filters}
            onFiltersChange={setFilters}
            activeFilterCount={getActiveFilterCount()}
          />
          <Button 
            onClick={() => navigate("/create-dinner")}
            className="bg-accent text-black hover:bg-accent/90 hover:text-black shadow-lg hover:shadow-xl transition-all duration-300 font-semibold border-2 border-accent/30"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t('dinner.create')}
          </Button>
        </div>

        {filteredDinners.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg mb-4">
              {allDinners.length === 0 ? t('dinner.noDinners') : t('dinner.noFilterResults')}
            </p>
            <div className="flex gap-2 justify-center">
              {allDinners.length > 0 && (
                <Button 
                  onClick={() => setFilters({
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
                  })}
                  variant="outline"
                  className="font-semibold px-6 py-3 text-base"
                >
                  {t('common.clear')}
                </Button>
              )}
              <Button 
                onClick={() => navigate("/create-dinner")}
                className="bg-primary text-black hover:bg-primary/90 hover:text-black font-semibold px-6 py-3 text-base shadow-lg"
                size="default"
              >
                {t('dinner.publishNow')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {getActiveFilterCount() > 0 && (
              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary font-medium">
                  {t('dinner.filtersApplied', { count: getActiveFilterCount(), found: filteredDinners.length })}
                </p>
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDinners.map((dinner) => {
              const isJoined = joinedDinnerIds.includes(dinner.id);
              const participantCount = participantCounts[dinner.id] || 0;
              const expired = isExpired(dinner.dinner_time);
              return (
              <Card 
                key={dinner.id} 
                className={`cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg relative ${
                  expired 
                    ? 'opacity-50 bg-muted/50 border-2 border-muted'
                    : isJoined 
                      ? 'bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30' 
                      : 'bg-gradient-to-br from-card to-accent/5'
                }`}
                onClick={() => {
                  if (expired) {
                    // 显示提示
                    const message = t('dinner.expired');
                    alert(message);
                    return;
                  }
                  navigate(`/dinner/${dinner.id}`);
                }}
              >
                {expired && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant="destructive" className="text-xs">
                      {t('dinner.expiredBadge')}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                   <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                        {getModeIcon(dinner.dinner_mode)} {getModeLabel(dinner.dinner_mode)}
                      </Badge>
                      {dinner.urgency_level && dinner.urgency_level !== 'normal' && (
                        <Badge className={`text-xs ${getUrgencyColor(dinner.urgency_level)}`}>
                          {dinner.urgency_level === 'urgent' ? `🚨 ${t('dinner.urgent')}` : `🌊 ${t('dinner.flexible')}`}
                        </Badge>
                      )}
                      <ShareDinner 
                        dinner={dinner} 
                        participantCount={participantCount}
                      />
                    </div>
                    {isJoined && (
                      <Badge className="bg-primary text-black border-primary/30 text-xs font-bold">
                        ✓ {t('dinner.joined')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-foreground">{dinner.title}</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    {truncateDescription(dinner.description)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/10 p-2 rounded-lg">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span className="font-medium">{formatDateTime(dinner.dinner_time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/10 p-2 rounded-lg">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-medium">{dinner.location}</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg ${
                    participantCount > 0 ? 'bg-primary/20 border border-primary/30' : 'bg-primary/10'
                  }`}>
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-bold text-primary">{participantCount} / {dinner.max_participants} {t('dinnerDetail.people')}</span>
                    {participantCount >= dinner.max_participants && (
                      <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive ml-auto">
                        {t('dinner.full')}
                      </Badge>
                    )}
                  </div>

                  {dinner.food_preferences && dinner.food_preferences.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {dinner.food_preferences.map((preference) => (
                        <Badge 
                          key={preference} 
                          variant="secondary" 
                          className="text-xs bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30"
                        >
                          {preference}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 新增个性标签和饮食禁忌显示 */}
                  {dinner.personality_tags && dinner.personality_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {dinner.personality_tags.slice(0, 3).map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="text-xs bg-accent/10 text-accent border-accent/30"
                        >
                          #{tag}
                        </Badge>
                      ))}
                      {dinner.personality_tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{dinner.personality_tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {dinner.gender_preference && dinner.gender_preference !== 'no_preference' && (
                    <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                      <Users2 className="w-3 h-3 mr-1" />
                      {dinner.gender_preference === 'same_gender' ? t('filter.sameGender') : t('filter.oppositeGender')}
                    </Badge>
                  )}

                  {dinner.friends_only && (
                    <Badge variant="outline" className="text-xs border-accent text-accent">
                      🔒 {t('dinnerDetail.friendsOnly')}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
            })}
            </div>
          </>
        )}
      </div>
      <Navigation />
    </div>
    </>
  );
};

export default Discover;