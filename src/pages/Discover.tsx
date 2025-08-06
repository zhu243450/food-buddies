import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, Search, Sparkles } from "lucide-react";
import Navigation from "@/components/Navigation";
import type { User } from '@supabase/supabase-js';
import type { Dinner } from '@/types/database';

const Discover = () => {
  const [user, setUser] = useState<User | null>(null);
  const [dinners, setDinners] = useState<Dinner[]>([]);
  const [joinedDinnerIds, setJoinedDinnerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
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
        setDinners(data || []);
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

      setLoading(false);
    };

    if (user) {
      fetchDinners();
    }
  }, [user]);

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
          <Button 
            onClick={() => navigate("/create-dinner")}
            className="bg-accent text-black hover:bg-accent/90 hover:text-black shadow-lg hover:shadow-xl transition-all duration-300 font-semibold border-2 border-accent/30"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            发布饭局
          </Button>
        </div>

        {dinners.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg mb-4">暂无饭局，快来发布第一个吧！</p>
            <Button 
              onClick={() => navigate("/create-dinner")}
              className="bg-primary text-black hover:bg-primary/90 hover:text-black font-semibold px-8 py-3 text-lg shadow-lg"
              size="lg"
            >
              立即发布
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dinners.map((dinner) => {
              const isJoined = joinedDinnerIds.includes(dinner.id);
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-foreground">{dinner.title}</CardTitle>
                    {isJoined && (
                      <Badge className="bg-primary text-black border-primary/30 text-xs font-bold">
                        ✓ 已参与
                      </Badge>
                    )}
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
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/10 p-2 rounded-lg">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-bold text-primary">0 / {dinner.max_participants} 人</span>
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
        )}
      </div>
      <Navigation />
    </div>
  );
};

export default Discover;