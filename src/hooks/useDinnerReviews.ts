import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Review {
  id: string;
  dinner_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_profile?: {
    nickname: string;
    avatar_url: string | null;
  };
  reviewed_profile?: {
    nickname: string;
    avatar_url: string | null;
  };
}

interface ReviewableUser {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
}

export const useDinnerReviews = (dinnerId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewableUsers, setReviewableUsers] = useState<ReviewableUser[]>([]);
  const [myReviews, setMyReviews] = useState<Record<string, Review>>({});
  const [loading, setLoading] = useState(false);
  const [dinnerCompleted, setDinnerCompleted] = useState(false);

  // Check if dinner is completed (time has passed)
  const checkDinnerCompleted = useCallback(async () => {
    if (!dinnerId) return;
    const { data } = await supabase
      .from('dinners')
      .select('dinner_time')
      .eq('id', dinnerId)
      .single();
    
    if (data) {
      setDinnerCompleted(new Date(data.dinner_time) < new Date());
    }
  }, [dinnerId]);

  // Fetch reviews for this dinner
  const fetchReviews = useCallback(async () => {
    if (!dinnerId || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dinner_reviews')
        .select('*')
        .eq('dinner_id', dinnerId);

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch profiles for reviewers and reviewed users
        const allUserIds = [...new Set([
          ...data.map(r => r.reviewer_id),
          ...data.map(r => r.reviewed_user_id)
        ])];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nickname, avatar_url')
          .in('user_id', allUserIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const enrichedReviews = data.map(r => ({
          ...r,
          reviewer_profile: profileMap.get(r.reviewer_id) || { nickname: '?', avatar_url: null },
          reviewed_profile: profileMap.get(r.reviewed_user_id) || { nickname: '?', avatar_url: null },
        }));

        setReviews(enrichedReviews);

        // Track which users I've already reviewed
        const myReviewMap: Record<string, Review> = {};
        enrichedReviews
          .filter(r => r.reviewer_id === user.id)
          .forEach(r => { myReviewMap[r.reviewed_user_id] = r; });
        setMyReviews(myReviewMap);
      } else {
        setReviews([]);
        setMyReviews({});
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [dinnerId, user]);

  // Fetch reviewable users (participants I haven't reviewed yet)
  const fetchReviewableUsers = useCallback(async () => {
    if (!dinnerId || !user) return;

    // Get all participants + creator
    const [participantsRes, dinnerRes] = await Promise.all([
      supabase
        .from('dinner_participants')
        .select('user_id')
        .eq('dinner_id', dinnerId),
      supabase
        .from('dinners')
        .select('created_by')
        .eq('id', dinnerId)
        .single()
    ]);

    const userIds = new Set<string>();
    participantsRes.data?.forEach(p => userIds.add(p.user_id));
    if (dinnerRes.data) userIds.add(dinnerRes.data.created_by);
    userIds.delete(user.id); // Can't review yourself

    if (userIds.size === 0) {
      setReviewableUsers([]);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, nickname, avatar_url')
      .in('user_id', Array.from(userIds));

    setReviewableUsers(profiles || []);
  }, [dinnerId, user]);

  // Submit a review
  const submitReview = useCallback(async (
    reviewedUserId: string,
    rating: number,
    comment?: string
  ) => {
    if (!user || !dinnerId) return false;

    try {
      const { error } = await supabase
        .from('dinner_reviews')
        .insert({
          dinner_id: dinnerId,
          reviewer_id: user.id,
          reviewed_user_id: reviewedUserId,
          rating,
          comment: comment || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast({ title: t('review.alreadyReviewed', '已评价过该用户'), variant: 'destructive' });
        } else {
          throw error;
        }
        return false;
      }

      toast({ title: t('review.submitted', '评价已提交') });
      fetchReviews();
      return true;
    } catch (error: any) {
      toast({
        title: t('review.submitFailed', '提交失败'),
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  }, [user, dinnerId, t, toast, fetchReviews]);

  useEffect(() => {
    checkDinnerCompleted();
    fetchReviews();
    fetchReviewableUsers();
  }, [checkDinnerCompleted, fetchReviews, fetchReviewableUsers]);

  return {
    reviews,
    reviewableUsers,
    myReviews,
    loading,
    dinnerCompleted,
    submitReview,
    fetchReviews,
  };
};
