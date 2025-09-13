import { useState, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface NavigationCache {
  sessionIds: string[];
  unreadCount: number;
  lastFetch: number;
}

const CACHE_DURATION = 60000; // 1分钟缓存
const navigationCache = new Map<string, NavigationCache>();

export const useNavigationData = (user: User | null) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const isInitializedRef = useRef(false);

  const userId = user?.id;
  
  // 稳定的缓存键
  const cacheKey = useMemo(() => userId || 'anonymous', [userId]);

  // 简化的数据获取，不使用复杂的useEffect
  const refreshUnreadCount = async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    // 检查缓存
    const cached = navigationCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.lastFetch) < CACHE_DURATION) {
      setUnreadCount(cached.unreadCount);
      return;
    }

    try {
      // 获取会话ID
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("id")
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`);
        
      const sessionIds = (sessions || []).map((s) => s.id);
      
      if (sessionIds.length === 0) {
        const cacheData = { sessionIds: [], unreadCount: 0, lastFetch: now };
        navigationCache.set(cacheKey, cacheData);
        setUnreadCount(0);
        return;
      }

      // 获取未读消息数量
      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: 'exact', head: true })
        .in("session_id", sessionIds)
        .eq("is_read", false)
        .neq("sender_id", userId);

      const unreadCount = count || 0;
      
      // 更新缓存
      const cacheData = { sessionIds, unreadCount, lastFetch: now };
      navigationCache.set(cacheKey, cacheData);
      
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error("获取未读消息数量失败:", error);
    }
  };

  // 初始化时获取一次数据
  if (userId && !isInitializedRef.current) {
    isInitializedRef.current = true;
    refreshUnreadCount();
  }

  // 用户变化时重置状态
  if (!userId && isInitializedRef.current) {
    isInitializedRef.current = false;
    setUnreadCount(0);
  }

  return {
    unreadCount,
    refreshUnreadCount
  };
};