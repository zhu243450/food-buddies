import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
import { logger } from "@/lib/logger";

interface Dinner {
  id: string;
  created_by: string;
  title: string;
  description?: string;
  dinner_time: string;
  location: string;
  max_participants: number;
  food_preferences?: string[];
  friends_only?: boolean;
  dinner_mode?: string;
  urgency_level?: string;
  gender_preference?: string;
  personality_tags?: string[];
  dietary_restrictions?: string[];
  created_at: string;
  updated_at: string;
  status?: string;
}

export const useOptimizedDinners = (user: User | null) => {
  const [joinedDinners, setJoinedDinners] = useState<Dinner[]>([]);
  const [createdDinners, setCreatedDinners] = useState<Dinner[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // 优化数据获取函数
  const fetchMyDinners = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // 批量获取数据，减少网络请求
      const [joinedResponse, createdResponse, participantCountsResponse] = await Promise.all([
        supabase
          .from("dinner_participants")
          .select(`
            dinners!fk_dinner_participants_dinner_id (
              id, title, description, dinner_time, location, max_participants,
              food_preferences, friends_only, dinner_mode, urgency_level,
              gender_preference, personality_tags, dietary_restrictions,
              created_by, created_at, updated_at, status
            )
          `)
          .eq("user_id", user.id),
        
        supabase
          .from("dinners")
          .select("*")
          .eq("created_by", user.id)
          .order("dinner_time", { ascending: true }),
          
        supabase
          .from("dinner_participants")
          .select("dinner_id")
      ]);

      // 优化数据处理
      if (!joinedResponse.error && joinedResponse.data) {
        const joinedData = joinedResponse.data
          ?.map(item => (item as any).dinners)
          .filter((dinner: any) => dinner && (dinner.status === 'active' || !dinner.status)) || [];
        setJoinedDinners(joinedData);
      }

      if (!createdResponse.error && createdResponse.data) {
        const createdData = createdResponse.data
          .filter(dinner => (dinner as any).status === 'active' || !(dinner as any).status);
        setCreatedDinners(createdData);
      }

      // 优化参与者数量计算
      if (!participantCountsResponse.error && participantCountsResponse.data) {
        const counts: Record<string, number> = {};
        participantCountsResponse.data.forEach(participant => {
          counts[participant.dinner_id] = (counts[participant.dinner_id] || 0) + 1;
        });
        setParticipantCounts(counts);
      }

    } catch (error) {
      logger.error("Error fetching dinners:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 优化实时监听 - 监听dinners表的变化
  useEffect(() => {
    fetchMyDinners();

    // 监听饭局和参与者变化
    const channel = supabase
      .channel('optimized-dinner-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dinner_participants'
        },
        () => {
          fetchMyDinners();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dinners'
        },
        () => {
          fetchMyDinners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMyDinners]);

  // 记忆化计算
  const memoizedData = useMemo(() => ({
    joinedDinners,
    createdDinners,
    participantCounts,
    loading
  }), [joinedDinners, createdDinners, participantCounts, loading]);

  return {
    ...memoizedData,
    refetch: fetchMyDinners
  };
};