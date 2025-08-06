import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { User } from '@supabase/supabase-js';
import type { Dinner } from '@/types/database';

const Discover = () => {
  const [user, setUser] = useState<User | null>(null);
  const [dinners, setDinners] = useState<Dinner[]>([]);
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">发现饭局</h1>
          <Button onClick={() => navigate("/create-dinner")}>
            发布饭局
          </Button>
        </div>

        {dinners.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">暂无饭局，快来发布第一个吧！</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dinners.map((dinner) => (
              <Card 
                key={dinner.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/dinner/${dinner.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{dinner.title}</CardTitle>
                  <CardDescription>
                    {truncateDescription(dinner.description)}
                  </CardDescription>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;