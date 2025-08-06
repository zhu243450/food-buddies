import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, ArrowLeft, Heart, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import type { User } from '@supabase/supabase-js';
import type { Dinner } from '@/types/database';

interface Participant {
  id: string;
  user_id: string;
  joined_at: string;
  profiles: {
    nickname: string;
    avatar_url: string;
  };
}

const DinnerDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [dinner, setDinner] = useState<Dinner | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    const fetchDinnerDetails = async () => {
      if (!id || !user) return;

      // 获取饭局详情
      const { data: dinnerData, error: dinnerError } = await supabase
        .from("dinners")
        .select("*")
        .eq("id", id)
        .single();

      if (dinnerError) {
        console.error("Error fetching dinner:", dinnerError);
        navigate("/discover");
        return;
      }

      setDinner(dinnerData);

      // 获取参与者列表
      const { data: participantData, error: participantError } = await supabase
        .from("dinner_participants")
        .select(`
          *,
          profiles (
            nickname,
            avatar_url
          )
        `)
        .eq("dinner_id", id);

      if (participantError) {
        console.error("Error fetching participants:", participantError);
      } else {
        setParticipants(participantData || []);
        setIsParticipant(participantData?.some(p => p.user_id === user.id) || false);
      }

      setLoading(false);
    };

    fetchDinnerDetails();
  }, [id, user, navigate]);

  const handleJoinDinner = async () => {
    if (!user || !dinner) return;

    setJoining(true);

    const { error } = await supabase
      .from("dinner_participants")
      .insert({
        dinner_id: dinner.id,
        user_id: user.id,
      });

    if (error) {
      if (error.code === "23505") { // Unique constraint violation
        toast({
          title: "已经报名",
          description: "您已经报名了这个饭局",
          variant: "destructive",
        });
      } else {
        toast({
          title: "报名失败",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "报名成功",
        description: "您已成功加入这个饭局",
      });
      setIsParticipant(true);
      // 重新获取参与者列表
      const { data } = await supabase
        .from("dinner_participants")
        .select(`
          *,
          profiles (
            nickname,
            avatar_url
          )
        `)
        .eq("dinner_id", dinner.id);
      setParticipants(data || []);
    }

    setJoining(false);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "long",
    });
  };

  if (!user || loading) return null;

  if (!dinner) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto text-center">
          <p>饭局不存在</p>
          <Button onClick={() => navigate("/discover")} className="mt-4">
            返回发现页
          </Button>
        </div>
      </div>
    );
  }

  const isFull = participants.length >= dinner.max_participants;
  const canJoin = !isParticipant && !isFull && dinner.created_by !== user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/discover")}
          className="mb-4 hover:bg-accent/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-accent/10">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-t-lg">
            <CardTitle className="text-2xl">{dinner.title}</CardTitle>
            {dinner.description && (
              <CardDescription className="text-primary-foreground/90 text-base">
                {dinner.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-lg p-3 rounded-lg bg-accent/10">
                <CalendarDays className="w-5 h-5 text-primary" />
                <span className="font-medium">{formatDateTime(dinner.dinner_time)}</span>
              </div>
              
              <div className="flex items-center gap-3 text-lg p-3 rounded-lg bg-accent/10">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">{dinner.location}</span>
              </div>
              
              <div className="flex items-center gap-3 text-lg p-3 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-bold text-primary">{participants.length} / {dinner.max_participants} 人</span>
                {isFull && <Badge variant="secondary" className="bg-destructive/20 text-destructive border-destructive">已满员</Badge>}
              </div>
            </div>

            {dinner.food_preferences && dinner.food_preferences.length > 0 && (
              <div className="p-4 rounded-lg bg-accent/10">
                <h3 className="font-semibold mb-3 text-foreground">🍽️ 饮食偏好</h3>
                <div className="flex flex-wrap gap-2">
                  {dinner.food_preferences.map((preference) => (
                    <Badge 
                      key={preference} 
                      variant="secondary" 
                      className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30"
                    >
                      {preference}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {dinner.friends_only && (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                <Badge variant="outline" className="border-accent text-accent">
                  🔒 仅限熟人参与
                </Badge>
              </div>
            )}

            {participants.length > 0 && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
                <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  参与者
                </h3>
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 rounded-lg bg-card shadow-sm border border-accent/20">
                      {participant.profiles?.avatar_url ? (
                        <img 
                          src={participant.profiles.avatar_url} 
                          alt={participant.profiles?.nickname}
                          className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold">
                          {participant.profiles?.nickname?.charAt(0) || "?"}
                        </div>
                      )}
                      <span className="font-medium">{participant.profiles?.nickname || "匿名用户"}</span>
                      {participant.user_id === dinner.created_by && (
                        <Badge variant="default" className="text-xs bg-gradient-to-r from-primary to-accent">
                          👑 发起人
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {canJoin && (
              <Button 
                onClick={handleJoinDinner} 
                disabled={joining}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                size="lg"
              >
                {joining ? "加入中..." : "🎉 加入饭局"}
              </Button>
            )}

            {isParticipant && (
              <div className="text-center p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center justify-center gap-2 text-green-700 font-semibold text-lg">
                  <Heart className="w-5 h-5" />
                  您已参与此饭局
                </div>
              </div>
            )}

            {dinner.created_by === user.id && (
              <div className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200">
                <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-lg">
                  <UserCheck className="w-5 h-5" />
                  这是您发起的饭局
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Navigation />
    </div>
  );
};

export default DinnerDetail;