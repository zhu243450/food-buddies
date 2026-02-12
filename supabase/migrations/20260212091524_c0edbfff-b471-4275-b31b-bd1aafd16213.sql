
ALTER TABLE public.point_transactions DROP CONSTRAINT point_transactions_transaction_type_check;
ALTER TABLE public.point_transactions ADD CONSTRAINT point_transactions_transaction_type_check 
  CHECK (transaction_type = ANY (ARRAY['invite', 'dinner', 'achievement', 'bonus', 'redeem', 'campaign_checkin', 'coupon_redeem']));
