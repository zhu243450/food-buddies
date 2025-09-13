import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface NavigationCache {
  sessionIds: string[];
  unreadCount: number;
  lastFetch: number;
}

const CACHE_DURATION = 30000; // 30秒缓存
const navigationCache = new Map<string, NavigationCache>();

export const useNavigationData = (user: User | null) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdsRef = useRef<string[]>([]);
  const fetchTimeoutRef = useRef<number>();
  const isInitializedRef = useRef(false);

  const userId = user?.id;
  
  // 稳定的缓存键
  const cacheKey = useMemo(() => userId || 'anonymous', [userId]);

  // 从缓存获取数据
  const getCachedData = (): NavigationCache | null => {
    if (!userId) return null;
    const cached = navigationCache.get(cacheKey);
    if (cached && (Date.now() - cached.lastFetch) < CACHE_DURATION) {
      return cached;
    }
    return null;
  };

  // 设置缓存数据
  const setCachedData = (sessionIds: string[], unreadCount: number) => {
    if (!userId) return;
    navigationCache.set(cacheKey, {
      sessionIds,
      unreadCount,
      lastFetch: Date.now()
    });
  };

  // 获取会话ID
  const fetchSessions = async (): Promise<string[]> => {
    if (!userId) return [];

    try {
      const { data: sessions, error } = await supabase
        .from("chat_sessions")
        .select("id")
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`);
        
      if (error) throw error;
      return (sessions || []).map((s) => s.id);
    } catch (error) {
      console.error("Error loading sessions:", error);
      return [];
    }
  };

  // 获取未读消息数量
  const fetchUnreadCount = async (sessionIds: string[]): Promise<number> => {
    if (!userId || sessionIds.length === 0) return 0;

    try {
      const { count, error } = await supabase
        .from("chat_messages")
        .select("*", { count: 'exact', head: true })
        .in("session_id", sessionIds)
        .eq("is_read", false)
        .neq("sender_id", userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  };

  // 初始化数据
  useEffect(() => {
    if (isInitializedRef.current) return;
    if (!userId) {
      sessionIdsRef.current = [];
      setUnreadCount(0);
      isInitializedRef.current = false;
      return;
    }

    const initializeData = async () => {
      setIsLoading(true);
      
      // 先尝试使用缓存
      const cached = getCachedData();
      if (cached) {
        sessionIdsRef.current = cached.sessionIds;
        setUnreadCount(cached.unreadCount);
        setIsLoading(false);
        isInitializedRef.current = true;
        return;
      }

      try {
        // 获取新数据
        const sessionIds = await fetchSessions();
        const unreadCount = await fetchUnreadCount(sessionIds);
        
        sessionIdsRef.current = sessionIds;
        setUnreadCount(unreadCount);
        setCachedData(sessionIds, unreadCount);
        isInitializedRef.current = true;
      } catch (error) {
        console.error("Error initializing navigation data:", error);
        sessionIdsRef.current = [];
        setUnreadCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [userId, cacheKey]);

  // 实时监听 - 只在初始化完成后设置
  useEffect(() => {
    if (!userId || !isInitializedRef.current || sessionIdsRef.current.length === 0) {
      return;
    }

    const channel = supabase
      .channel(`navigation_${userId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages', 
          filter: `sender_id=neq.${userId}` 
        },
        (payload: any) => {
          if (sessionIdsRef.current.includes(payload.new.session_id)) {
            if (fetchTimeoutRef.current) {
              clearTimeout(fetchTimeoutRef.current);
            }
            fetchTimeoutRef.current = window.setTimeout(async () => {
              const newCount = await fetchUnreadCount(sessionIdsRef.current);
              setUnreadCount(newCount);
              setCachedData(sessionIdsRef.current, newCount);
            }, 1000); // 增加防抖时间到1秒
          }
        }
      )
      .subscribe();

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [userId, isInitializedRef.current]);

  // 重置初始化状态当用户变化时
  useEffect(() => {
    isInitializedRef.current = false;
  }, [userId]);

  return {
    unreadCount,
    isLoading
  };
};