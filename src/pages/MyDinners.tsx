import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, MapPin, Users, LogOut } from "lucide-react";
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
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/dinner/${dinner.id}`)}
    >
      <CardHeader>
        <CardTitle className="text-lg">{dinner.title}</CardTitle>
        {dinner.description && (
          <CardDescription>
            {dinner.description.length > 50 
              ? dinner.description.substring(0, 50) + "..."
              : dinner.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          {formatDateTime(dinner.dinner_time)}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          {dinner.location}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          0 / {dinner.max_participants} 人
        </div>

        {dinner.food_preferences && dinner.food_preferences.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dinner.food_preferences.map((preference) => (
              <Badge key={preference} variant="secondary" className="text-xs">
                {preference}
              </Badge>
            ))}
          </div>
        )}

        {dinner.friends_only && (
          <Badge variant="outline" className="text-xs">
            仅限熟人
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">我的饭搭子</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/discover")} variant="outline">
              发现饭局
            </Button>
            <Button onClick={() => navigate("/profile")} variant="outline">
              完善资料
            </Button>
            <Button onClick={handleSignOut} variant="ghost" size="icon">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="joined" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="joined">我参与的饭局</TabsTrigger>
            <TabsTrigger value="created">我发布的饭局</TabsTrigger>
          </TabsList>
          
          <TabsContent value="joined" className="mt-6">
            {joinedDinners.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">您还没有参与任何饭局</p>
                <Button onClick={() => navigate("/discover")}>
                  去发现饭局
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {joinedDinners.map((dinner) => (
                  <DinnerCard key={dinner.id} dinner={dinner} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="created" className="mt-6">
            {createdDinners.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">您还没有发布任何饭局</p>
                <Button onClick={() => navigate("/create-dinner")}>
                  发布饭局
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {createdDinners.map((dinner) => (
                  <DinnerCard key={dinner.id} dinner={dinner} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyDinners;