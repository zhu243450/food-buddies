import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Coupon {
  id: string;
  name: string;
  name_en: string | null;
  description: string;
  description_en: string | null;
  discount_type: string;
  discount_value: number;
  min_spend: number;
  points_required: number;
  valid_days: number;
  max_redemptions: number | null;
  current_redemptions: number;
  restaurant_id: string | null;
}

interface UserCoupon {
  id: string;
  coupon_id: string;
  redeemed_at: string;
  expires_at: string;
  used_at: string | null;
  status: string;
  coupon?: Coupon;
}

export const useCoupons = (userId?: string) => {
  const { i18n } = useTranslation();
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const fetchCoupons = async () => {
    try {
      // Fetch available coupons
      const { data: coupons, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (couponsError) throw couponsError;
      setAvailableCoupons(coupons || []);

      // Fetch user's coupons if logged in
      if (userId) {
        const { data: userCouponsData, error: userCouponsError } = await supabase
          .from('user_coupons')
          .select(`
            *,
            coupon:coupons(*)
          `)
          .eq('user_id', userId)
          .order('redeemed_at', { ascending: false });

        if (userCouponsError) throw userCouponsError;
        setUserCoupons(userCouponsData || []);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [userId]);

  const redeemCoupon = async (couponId: string) => {
    if (!userId) {
      toast.error(i18n.language === 'zh' ? '请先登录' : 'Please login first');
      return false;
    }

    setRedeeming(couponId);
    try {
      const { data, error } = await supabase.rpc('redeem_coupon', {
        coupon_id_param: couponId,
        user_id_param: userId,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast.success(i18n.language === 'zh' ? '兑换成功！' : 'Redeemed successfully!');
        await fetchCoupons();
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error: any) {
      console.error('Error redeeming coupon:', error);
      toast.error(error.message || (i18n.language === 'zh' ? '兑换失败' : 'Redemption failed'));
      return false;
    } finally {
      setRedeeming(null);
    }
  };

  const useCoupon = async (userCouponId: string) => {
    try {
      const { error } = await supabase
        .from('user_coupons')
        .update({ status: 'used', used_at: new Date().toISOString() })
        .eq('id', userCouponId);

      if (error) throw error;
      
      toast.success(i18n.language === 'zh' ? '优惠券已使用' : 'Coupon used');
      await fetchCoupons();
      return true;
    } catch (error: any) {
      console.error('Error using coupon:', error);
      toast.error(error.message);
      return false;
    }
  };

  const getCouponDisplayName = (coupon: Coupon) => {
    return i18n.language === 'zh' ? coupon.name : (coupon.name_en || coupon.name);
  };

  const getCouponDescription = (coupon: Coupon) => {
    return i18n.language === 'zh' ? coupon.description : (coupon.description_en || coupon.description);
  };

  return {
    availableCoupons,
    userCoupons,
    loading,
    redeeming,
    redeemCoupon,
    useCoupon,
    getCouponDisplayName,
    getCouponDescription,
    refetch: fetchCoupons,
  };
};
