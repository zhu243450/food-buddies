-- Create coupons table (coupon templates)
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT NOT NULL,
  description_en TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed', 'free_item'
  discount_value NUMERIC NOT NULL, -- percentage (10 = 10%) or fixed amount
  min_spend NUMERIC DEFAULT 0, -- minimum spend to use coupon
  points_required INTEGER NOT NULL DEFAULT 100, -- points needed to redeem
  restaurant_id UUID REFERENCES public.restaurants(id),
  valid_days INTEGER NOT NULL DEFAULT 30, -- how many days coupon is valid after redemption
  max_redemptions INTEGER, -- null = unlimited
  current_redemptions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_coupons table (coupons owned by users)
CREATE TABLE public.user_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id),
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'used', 'expired'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- RLS policies for coupons (publicly readable)
CREATE POLICY "Anyone can view active coupons" 
ON public.coupons 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage coupons"
ON public.coupons
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- RLS policies for user_coupons
CREATE POLICY "Users can view their own coupons" 
ON public.user_coupons 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem coupons" 
ON public.user_coupons 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can use their own coupons" 
ON public.user_coupons 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_coupons_active ON public.coupons(is_active);
CREATE INDEX idx_coupons_points ON public.coupons(points_required);
CREATE INDEX idx_user_coupons_user ON public.user_coupons(user_id);
CREATE INDEX idx_user_coupons_status ON public.user_coupons(status);

-- Function to redeem a coupon
CREATE OR REPLACE FUNCTION public.redeem_coupon(
  coupon_id_param UUID,
  user_id_param UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coupon_record RECORD;
  user_points INTEGER;
  new_coupon_id UUID;
BEGIN
  -- Get coupon details
  SELECT * INTO coupon_record
  FROM coupons
  WHERE id = coupon_id_param AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', '优惠券不存在或已下架');
  END IF;
  
  -- Check max redemptions
  IF coupon_record.max_redemptions IS NOT NULL AND 
     coupon_record.current_redemptions >= coupon_record.max_redemptions THEN
    RETURN json_build_object('success', false, 'message', '优惠券已被领完');
  END IF;
  
  -- Get user's current points
  SELECT total_points INTO user_points
  FROM user_rewards
  WHERE user_id = user_id_param;
  
  IF user_points IS NULL OR user_points < coupon_record.points_required THEN
    RETURN json_build_object('success', false, 'message', '积分不足');
  END IF;
  
  -- Deduct points
  UPDATE user_rewards
  SET total_points = total_points - coupon_record.points_required,
      updated_at = now()
  WHERE user_id = user_id_param;
  
  -- Record point transaction
  INSERT INTO point_transactions (user_id, points, transaction_type, description, related_id)
  VALUES (user_id_param, -coupon_record.points_required, 'coupon_redeem', 
          '兑换优惠券: ' || coupon_record.name, coupon_id_param);
  
  -- Create user coupon
  INSERT INTO user_coupons (user_id, coupon_id, expires_at)
  VALUES (user_id_param, coupon_id_param, now() + (coupon_record.valid_days || ' days')::interval)
  RETURNING id INTO new_coupon_id;
  
  -- Increment redemption count
  UPDATE coupons
  SET current_redemptions = current_redemptions + 1,
      updated_at = now()
  WHERE id = coupon_id_param;
  
  RETURN json_build_object(
    'success', true, 
    'message', '兑换成功',
    'coupon_id', new_coupon_id
  );
END;
$$;

-- Insert some sample coupons
INSERT INTO public.coupons (name, name_en, description, description_en, discount_type, discount_value, points_required, min_spend, valid_days)
VALUES 
  ('新人专享9折券', '10% Off for New Users', '全场消费满50元可用，享受9折优惠', 'Get 10% off on orders above ¥50', 'percentage', 10, 50, 50, 30),
  ('满100减20券', '¥20 Off on ¥100', '消费满100元立减20元', 'Get ¥20 off on orders above ¥100', 'fixed', 20, 100, 100, 30),
  ('免费甜点券', 'Free Dessert', '任意消费即可获得免费甜点一份', 'Get a free dessert with any order', 'free_item', 0, 200, 0, 14),
  ('尊享8折券', '20% Off VIP', '全场消费享受8折优惠', 'Get 20% off on any order', 'percentage', 20, 500, 0, 60);