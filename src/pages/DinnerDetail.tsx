import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from '@supabase/supabase-js';

interface Dinner {
  id: string;
  title: string;
  description: string;
  dinner_time: string;
  location: string;
  max_participants: number;
  food_preferences: string[];
  friends_only: boolean;
  created_by: string;
}

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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/discover")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{dinner.title}</CardTitle>
            {dinner.description && (
              <CardDescription className="text-base">
                {dinner.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-lg">
                <CalendarDays className="w-5 h-5 text-primary" />
                {formatDateTime(dinner.dinner_time)}
              </div>
              
              <div className="flex items-center gap-3 text-lg">
                <MapPin className="w-5 h-5 text-primary" />
                {dinner.location}
              </div>
              
              <div className="flex items-center gap-3 text-lg">
                <Users className="w-5 h-5 text-primary" />
                {participants.length} / {dinner.max_participants} 人
                {isFull && <Badge variant="secondary">已满员</Badge>}
              </div>
            </div>

            {dinner.food_preferences && dinner.food_preferences.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">饮食偏好</h3>
                <div className="flex flex-wrap gap-2">
                  {dinner.food_preferences.map((preference) => (
                    <Badge key={preference} variant="secondary">
                      {preference}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {dinner.friends_only && (
              <Badge variant="outline">
                仅限熟人参与
              </Badge>
            )}

            {participants.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">参与者</h3>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                      {participant.profiles?.avatar_url ? (
                        <img 
                          src={participant.profiles.avatar_url} 
                          alt={participant.profiles?.nickname}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {participant.profiles?.nickname?.charAt(0) || "?"}
                        </div>
                      )}
                      <span>{participant.profiles?.nickname || "匿名用户"}</span>
                      {participant.user_id === dinner.created_by && (
                        <Badge variant="default" className="text-xs">发起人</Badge>
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
                className="w-full"
                size="lg"
              >
                {joining ? "加入中..." : "加入饭局"}
              </Button>
            )}

            {isParticipant && (
              <div className="text-center text-green-600 font-semibold">
                ✓ 您已参与此饭局
              </div>
            )}

            {dinner.created_by === user.id && (
              <div className="text-center text-blue-600 font-semibold">
                这是您发起的饭局
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DinnerDetail;