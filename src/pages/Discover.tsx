import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, Search, Sparkles, Zap, Clock, Users2, Filter } from "lucide-react";
import Navigation from "@/components/Navigation";
import DinnerFiltersComponent, { DinnerFilters } from "@/components/DinnerFilters";
import type { User } from '@supabase/supabase-js';
import type { Dinner } from '@/types/database';

const Discover = () => {
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
    maxParticipants: [2, 20]
  });
  const navigate = useNavigate();

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

      // Fetch all dinners
      const { data, error } = await supabase
        .from("dinners")
        .select("*")
        .gt("dinner_time", new Date().toISOString())
        .order("dinner_time", { ascending: true });

      if (error) {
        console.error("Error fetching dinners:", error);
      } else {
        setAllDinners(data || []);
        setFilteredDinners(data || []);
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
        const dinnerIds = data.map(dinner => dinner.id);
        const { data: participantData, error: participantError } = await supabase
          .from("dinner_participants")
          .select("dinner_id")
          .in("dinner_id", dinnerIds);

        if (participantError) {
          console.error("Error fetching participant counts:", participantError);
        } else {
          const counts: Record<string, number> = {};
          
          // First, add creator count for each dinner (creator always counts as 1 participant)
          data.forEach(dinner => {
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

    // 时间范围筛选
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
    return count;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      case 'instant': return '闪约';
      case 'scheduled': return '预约';
      case 'group': return '团饭';
      default: return '闪约';
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
          <h1 className="text-2xl font-bold mb-6">发现饭局</h1>
          <div className="text-center">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
            <Search className="w-8 h-8 text-primary" />
            发现饭局
          </h1>
          <div className="flex gap-2">
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
              发布饭局
            </Button>
          </div>
        </div>

        {filteredDinners.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg mb-4">
              {allDinners.length === 0 ? '暂无饭局，快来发布第一个吧！' : '没有符合筛选条件的饭局，试试调整筛选条件'}
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
                    maxParticipants: [2, 20]
                  })}
                  variant="outline"
                  className="font-semibold px-6 py-3 text-base"
                >
                  清除筛选
                </Button>
              )}
              <Button 
                onClick={() => navigate("/create-dinner")}
                className="bg-primary text-black hover:bg-primary/90 hover:text-black font-semibold px-6 py-3 text-base shadow-lg"
                size="default"
              >
                立即发布
              </Button>
            </div>
          </div>
        ) : (
          <>
            {getActiveFilterCount() > 0 && (
              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary font-medium">
                  已应用 {getActiveFilterCount()} 个筛选条件，找到 {filteredDinners.length} 个饭局
                </p>
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDinners.map((dinner) => {
              const isJoined = joinedDinnerIds.includes(dinner.id);
              const participantCount = participantCounts[dinner.id] || 0;
              return (
              <Card 
                key={dinner.id} 
                className={`cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg relative ${
                  isJoined 
                    ? 'bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30' 
                    : 'bg-gradient-to-br from-card to-accent/5'
                }`}
                onClick={() => navigate(`/dinner/${dinner.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                        {getModeIcon(dinner.dinner_mode)} {getModeLabel(dinner.dinner_mode)}
                      </Badge>
                      {dinner.urgency_level && dinner.urgency_level !== 'normal' && (
                        <Badge className={`text-xs ${getUrgencyColor(dinner.urgency_level)}`}>
                          {dinner.urgency_level === 'urgent' ? '🚨 紧急' : '🌊 灵活'}
                        </Badge>
                      )}
                    </div>
                    {isJoined && (
                      <Badge className="bg-primary text-black border-primary/30 text-xs font-bold">
                        ✓ 已参与
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
                    <span className="font-bold text-primary">{participantCount} / {dinner.max_participants} 人</span>
                    {participantCount >= dinner.max_participants && (
                      <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive ml-auto">
                        已满员
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
                      {dinner.gender_preference === 'same_gender' ? '同性优先' : '异性优先'}
                    </Badge>
                  )}

                  {dinner.friends_only && (
                    <Badge variant="outline" className="text-xs border-accent text-accent">
                      🔒 仅限熟人
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
  );
};

export default Discover;