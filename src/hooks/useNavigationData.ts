import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const useNavigationData = (user: User | null) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdsRef = useRef<string[]>([]);
  const fetchTimeoutRef = useRef<number>();

  // 获取会话ID - 只在用户变化时执行
  useEffect(() => {
    if (!user) {
      sessionIdsRef.current = [];
      setUnreadCount(0);
      return;
    }

    let cancelled = false;
    
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const { data: sessions, error } = await supabase
          .from("chat_sessions")
          .select("id")
          .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);
          
        if (error) throw error;
        if (cancelled) return;
        
        const ids = (sessions || []).map((s) => s.id);
        sessionIdsRef.current = ids;
        
        // 获取初始未读数量
        if (ids.length > 0) {
          fetchUnreadCount(ids);
        } else {
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("Error loading sessions:", error);
        if (!cancelled) {
          sessionIdsRef.current = [];
          setUnreadCount(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchSessions();
    
    return () => {
      cancelled = true;
      setIsLoading(false);
    };
  }, [user?.id]); // 只依赖user.id

  // 获取未读消息数量
  const fetchUnreadCount = async (sessionIds?: string[]) => {
    const ids = sessionIds || sessionIdsRef.current;
    if (!user || !ids || ids.length === 0) {
      setUnreadCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from("chat_messages")
        .select("*", { count: 'exact', head: true })
        .in("session_id", ids)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // 实时监听 - 只在必要时设置
  useEffect(() => {
    if (!user || sessionIdsRef.current.length === 0) return;

    const channel = supabase
      .channel('navigation_messages')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages', 
          filter: `sender_id=neq.${user.id}` 
        },
        (payload: any) => {
          if (sessionIdsRef.current.includes(payload.new.session_id)) {
            // 使用防抖来避免频繁请求
            if (fetchTimeoutRef.current) {
              clearTimeout(fetchTimeoutRef.current);
            }
            fetchTimeoutRef.current = window.setTimeout(() => {
              fetchUnreadCount();
            }, 500); // 增加防抖时间
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chat_messages', 
          filter: `sender_id=neq.${user.id}` 
        },
        (payload: any) => {
          if (sessionIdsRef.current.includes(payload.new.session_id)) {
            if (fetchTimeoutRef.current) {
              clearTimeout(fetchTimeoutRef.current);
            }
            fetchTimeoutRef.current = window.setTimeout(() => {
              fetchUnreadCount();
            }, 500);
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
  }, [user?.id]); // 只依赖user.id

  return {
    unreadCount,
    isLoading
  };
};