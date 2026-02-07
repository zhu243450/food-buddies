import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
}

interface FriendProfile {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
}

export const useFriendship = (targetUserId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<(Friendship & { profile: FriendProfile })[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Check friendship status with a specific user
  const checkFriendshipStatus = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
      .maybeSingle();

    if (data) {
      setFriendshipStatus(data.status);
      setFriendshipId(data.id);
    } else {
      setFriendshipStatus(null);
      setFriendshipId(null);
    }
  }, [user, targetUserId]);

  // Send friend request
  const sendFriendRequest = useCallback(async () => {
    if (!user || !targetUserId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: user.id, addressee_id: targetUserId });

      if (error) throw error;
      
      setFriendshipStatus('pending');
      toast({ title: t('friends.requestSent', '好友请求已发送') });
    } catch (error: any) {
      if (error.code === '23505') {
        toast({ title: t('friends.alreadySent', '已发送过好友请求'), variant: 'destructive' });
      } else {
        toast({ title: t('friends.requestFailed', '发送失败'), description: error.message, variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId, t, toast]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;
      
      setFriendshipStatus('accepted');
      toast({ title: t('friends.accepted', '已接受好友请求') });
      // Refresh pending requests
      fetchPendingRequests();
      fetchFriends();
    } catch (error: any) {
      toast({ title: t('friends.acceptFailed', '操作失败'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  // Reject friend request
  const rejectFriendRequest = useCallback(async (requestId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      
      setFriendshipStatus('rejected');
      toast({ title: t('friends.rejected', '已拒绝好友请求') });
      fetchPendingRequests();
    } catch (error: any) {
      toast({ title: t('friends.rejectFailed', '操作失败'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  // Remove friend
  const removeFriend = useCallback(async (friendshipIdToRemove?: string) => {
    const idToRemove = friendshipIdToRemove || friendshipId;
    if (!idToRemove) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', idToRemove);

      if (error) throw error;
      
      setFriendshipStatus(null);
      setFriendshipId(null);
      toast({ title: t('friends.removed', '已删除好友') });
      fetchFriends();
    } catch (error: any) {
      toast({ title: t('friends.removeFailed', '操作失败'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [friendshipId, t, toast]);

  // Fetch friends list
  const fetchFriends = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (data && data.length > 0) {
      const friendUserIds = data.map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', friendUserIds);

      setFriends(profiles || []);
      setFriendCount(data.length);
    } else {
      setFriends([]);
      setFriendCount(0);
    }
  }, [user]);

  // Fetch pending requests (incoming)
  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('friendships')
      .select('*')
      .eq('addressee_id', user.id)
      .eq('status', 'pending');

    if (data && data.length > 0) {
      const requesterIds = data.map(f => f.requester_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', requesterIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const requestsWithProfiles = data.map(f => ({
        ...f,
        profile: profileMap.get(f.requester_id) || { user_id: f.requester_id, nickname: '?', avatar_url: null }
      }));

      setPendingRequests(requestsWithProfiles);
    } else {
      setPendingRequests([]);
    }
  }, [user]);

  // Check if a specific user is a friend
  const isFriend = useCallback((userId: string) => {
    return friends.some(f => f.user_id === userId);
  }, [friends]);

  useEffect(() => {
    if (targetUserId) {
      checkFriendshipStatus();
    }
  }, [checkFriendshipStatus, targetUserId]);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [user, fetchFriends, fetchPendingRequests]);

  return {
    friendshipStatus,
    friendshipId,
    friends,
    pendingRequests,
    friendCount,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    isFriend,
    fetchFriends,
    fetchPendingRequests,
    checkFriendshipStatus,
  };
};
