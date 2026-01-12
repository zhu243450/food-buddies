import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, Gift, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCoupons } from '@/hooks/useCoupons';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export const CouponCard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { 
    availableCoupons, 
    userCoupons, 
    loading, 
    redeeming, 
    redeemCoupon,
    useCoupon,
    getCouponDisplayName,
    getCouponDescription,
  } = useCoupons(user?.id);

  const getDiscountText = (type: string, value: number) => {
    if (type === 'percentage') {
      return i18n.language === 'zh' ? `${value}折` : `${value}% off`;
    }
    if (type === 'fixed') {
      return i18n.language === 'zh' ? `减¥${value}` : `¥${value} off`;
    }
    return i18n.language === 'zh' ? '免费赠品' : 'Free item';
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (status === 'used') {
      return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />{i18n.language === 'zh' ? '已使用' : 'Used'}</Badge>;
    }
    if (isExpired || status === 'expired') {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />{i18n.language === 'zh' ? '已过期' : 'Expired'}</Badge>;
    }
    return <Badge variant="default" className="bg-green-500"><Clock className="w-3 h-3 mr-1" />{i18n.language === 'zh' ? '可使用' : 'Active'}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const activeCoupons = userCoupons.filter(uc => 
    uc.status === 'active' && new Date(uc.expires_at) > new Date()
  );
  const usedOrExpiredCoupons = userCoupons.filter(uc => 
    uc.status !== 'active' || new Date(uc.expires_at) <= new Date()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          {i18n.language === 'zh' ? '优惠券' : 'Coupons'}
        </CardTitle>
        <CardDescription>
          {i18n.language === 'zh' ? '使用积分兑换优惠券' : 'Redeem coupons with your points'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="available">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">
              {i18n.language === 'zh' ? '可兑换' : 'Available'}
            </TabsTrigger>
            <TabsTrigger value="my-coupons">
              {i18n.language === 'zh' ? '我的券' : 'My Coupons'} ({activeCoupons.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              {i18n.language === 'zh' ? '历史' : 'History'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-3 mt-4">
            {availableCoupons.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {i18n.language === 'zh' ? '暂无可兑换的优惠券' : 'No coupons available'}
              </p>
            ) : (
              availableCoupons.map((coupon) => (
                <div key={coupon.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className="w-4 h-4 text-orange-500" />
                      <span className="font-medium">{getCouponDisplayName(coupon)}</span>
                      <Badge variant="outline">{getDiscountText(coupon.discount_type, coupon.discount_value)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{getCouponDescription(coupon)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {i18n.language === 'zh' ? `有效期${coupon.valid_days}天` : `Valid for ${coupon.valid_days} days`}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-primary mb-2">
                      {coupon.points_required} {i18n.language === 'zh' ? '积分' : 'pts'}
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => redeemCoupon(coupon.id)}
                      disabled={redeeming === coupon.id}
                    >
                      {redeeming === coupon.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        i18n.language === 'zh' ? '兑换' : 'Redeem'
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="my-coupons" className="space-y-3 mt-4">
            {activeCoupons.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {i18n.language === 'zh' ? '暂无可用优惠券' : 'No active coupons'}
              </p>
            ) : (
              activeCoupons.map((uc) => (
                <div key={uc.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-primary" />
                      <span className="font-medium">
                        {uc.coupon && getCouponDisplayName(uc.coupon as any)}
                      </span>
                    </div>
                    {getStatusBadge(uc.status, uc.expires_at)}
                  </div>
                  {uc.coupon && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {getCouponDescription(uc.coupon as any)}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {i18n.language === 'zh' ? '过期时间：' : 'Expires: '}
                      {format(new Date(uc.expires_at), 'yyyy-MM-dd')}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => useCoupon(uc.id)}>
                      {i18n.language === 'zh' ? '使用' : 'Use'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-4">
            {usedOrExpiredCoupons.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {i18n.language === 'zh' ? '暂无历史记录' : 'No history'}
              </p>
            ) : (
              usedOrExpiredCoupons.map((uc) => (
                <div key={uc.id} className="border rounded-lg p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      <span>{uc.coupon && getCouponDisplayName(uc.coupon as any)}</span>
                    </div>
                    {getStatusBadge(uc.status, uc.expires_at)}
                  </div>
                  {uc.used_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {i18n.language === 'zh' ? '使用时间：' : 'Used: '}
                      {format(new Date(uc.used_at), 'yyyy-MM-dd HH:mm')}
                    </p>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
