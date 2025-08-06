import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, MapPin, Users, LogOut, Heart, Sparkles } from "lucide-react";
import Navigation from "@/components/Navigation";
import type { User } from '@supabase/supabase-js';
import type { Dinner } from '@/types/database';

const MyDinners = () => {
  const [user, setUser] = useState<User | null>(null);
  const [joinedDinners, setJoinedDinners] = useState<Dinner[]>([]);
  const [createdDinners, setCreatedDinners] = useState<Dinner[]>([]);
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
    const fetchMyDinners = async () => {
      if (!user) return;

      // 获取我参与的饭局
      const { data: joinedData, error: joinedError } = await supabase
        .from("dinner_participants")
        .select(`
          dinners!inner (
            id,
            title,
            description,
            dinner_time,
            location,
            max_participants,
            food_preferences,
            friends_only,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq("user_id", user.id);

      if (joinedError) {
        console.error("Error fetching joined dinners:", joinedError);
      } else {
        const joinedDinnersData = joinedData?.map(item => (item as any).dinners) || [];
        setJoinedDinners(joinedDinnersData);
      }

      // 获取我创建的饭局
      const { data: createdData, error: createdError } = await supabase
        .from("dinners")
        .select("*")
        .eq("created_by", user.id)
        .order("dinner_time", { ascending: true });

      if (createdError) {
        console.error("Error fetching created dinners:", createdError);
      } else {
        setCreatedDinners(createdData || []);
      }

      setLoading(false);
    };

    fetchMyDinners();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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

  const DinnerCard = ({ dinner }: { dinner: Dinner }) => (
    <Card 
      className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-card to-accent/5"
      onClick={() => navigate(`/dinner/${dinner.id}`)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground">{dinner.title}</CardTitle>
        {dinner.description && (
          <CardDescription className="text-muted-foreground">
            {dinner.description.length > 50 
              ? dinner.description.substring(0, 50) + "..."
              : dinner.description}
          </CardDescription>
        )}
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

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">我的饭搭子</h1>
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
            <Heart className="w-8 h-8 text-primary" />
            我的饭搭子
          </h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/discover")} variant="outline" className="border-4 border-primary bg-primary text-black hover:bg-primary/90 hover:text-black font-bold text-base px-6 py-3 shadow-lg">
              发现饭局
            </Button>
            <Button onClick={() => navigate("/profile")} variant="outline" className="border-4 border-accent bg-accent text-black hover:bg-accent/90 hover:text-black font-bold text-base px-6 py-3 shadow-lg">
              完善资料
            </Button>
            <Button onClick={handleSignOut} variant="ghost" size="icon" className="text-destructive bg-destructive/10 hover:text-black hover:bg-destructive border-4 border-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="joined" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card p-1 rounded-xl">
            <TabsTrigger value="joined" className="rounded-lg bg-background text-foreground data-[state=active]:bg-primary data-[state=active]:text-black font-bold">
              我参与的饭局
            </TabsTrigger>
            <TabsTrigger value="created" className="rounded-lg bg-background text-foreground data-[state=active]:bg-accent data-[state=active]:text-black font-bold">
              我发布的饭局
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="joined" className="mt-6">
            {joinedDinners.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                  <Heart className="w-12 h-12 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg mb-4">您还没有参与任何饭局</p>
                <Button 
                  onClick={() => navigate("/discover")}
                  className="bg-primary text-yellow-400 hover:bg-primary/80 hover:text-yellow-300 font-semibold px-6 py-3 text-base shadow-lg border-2 border-primary/40"
                  size="default"
                >
                  去发现饭局
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {joinedDinners.map((dinner) => (
                  <DinnerCard key={dinner.id} dinner={dinner} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="created" className="mt-6">
            {createdDinners.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg mb-4">您还没有发布任何饭局</p>
                <Button 
                  onClick={() => navigate("/create-dinner")}
                  className="bg-accent text-white hover:bg-accent/80 hover:text-white font-semibold px-6 py-3 text-base shadow-lg border-2 border-accent/40"
                  size="default"
                >
                  发布饭局
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {createdDinners.map((dinner) => (
                  <DinnerCard key={dinner.id} dinner={dinner} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Navigation />
    </div>
  );
};

export default MyDinners;