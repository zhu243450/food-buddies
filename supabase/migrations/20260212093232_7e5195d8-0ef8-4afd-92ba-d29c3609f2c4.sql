
-- 提现申请记录表
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points_amount INTEGER NOT NULL,
  cash_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_account TEXT,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own withdrawal requests"
ON public.withdrawal_requests FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create withdrawal requests"
ON public.withdrawal_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all withdrawal requests"
ON public.withdrawal_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update requests
CREATE POLICY "Admins can update withdrawal requests"
ON public.withdrawal_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 提现处理函数：验证积分、扣分、创建申请
CREATE OR REPLACE FUNCTION public.create_withdrawal_request(
  user_id_param UUID,
  points_amount_param INTEGER,
  payment_method_param TEXT DEFAULT NULL,
  payment_account_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_points INTEGER;
  cash_amount_val NUMERIC(10,2);
  pending_count INTEGER;
  new_request_id UUID;
BEGIN
  -- 验证用户身份
  IF auth.uid() != user_id_param THEN
    RETURN json_build_object('success', false, 'message', '身份验证失败');
  END IF;

  -- 检查是否有未处理的提现申请
  SELECT COUNT(*) INTO pending_count
  FROM withdrawal_requests
  WHERE user_id = user_id_param AND status = 'pending';

  IF pending_count > 0 THEN
    RETURN json_build_object('success', false, 'message', '您有未处理的提现申请，请等待审核完成');
  END IF;

  -- 计算兑换金额 (50积分 = 1元)
  cash_amount_val := points_amount_param / 50.0;

  -- 最低提现100元 (5000积分)
  IF cash_amount_val < 100 THEN
    RETURN json_build_object('success', false, 'message', '最低提现金额为100元（5000积分）');
  END IF;

  -- 积分必须是50的倍数
  IF points_amount_param % 50 != 0 THEN
    RETURN json_build_object('success', false, 'message', '提现积分必须是50的倍数');
  END IF;

  -- 获取用户当前积分
  SELECT total_points INTO user_points
  FROM user_rewards
  WHERE user_id = user_id_param;

  IF user_points IS NULL OR user_points < points_amount_param THEN
    RETURN json_build_object('success', false, 'message', '积分不足');
  END IF;

  -- 扣除积分
  UPDATE user_rewards
  SET total_points = total_points - points_amount_param,
      updated_at = now()
  WHERE user_id = user_id_param;

  -- 记录积分交易
  INSERT INTO point_transactions (user_id, points, transaction_type, description)
  VALUES (user_id_param, -points_amount_param, 'withdrawal', '积分提现申请：' || cash_amount_val || '元');

  -- 创建提现申请
  INSERT INTO withdrawal_requests (user_id, points_amount, cash_amount, payment_method, payment_account)
  VALUES (user_id_param, points_amount_param, cash_amount_val, payment_method_param, payment_account_param)
  RETURNING id INTO new_request_id;

  -- 通知管理员
  INSERT INTO notifications (user_id, title, message, type, category)
  SELECT ur.user_id, '新的提现申请',
         '用户申请提现' || cash_amount_val || '元（' || points_amount_param || '积分）',
         'warning', 'withdrawal_request'
  FROM user_roles ur WHERE ur.role = 'admin'::app_role;

  RETURN json_build_object(
    'success', true,
    'message', '提现申请已提交，请等待审核',
    'request_id', new_request_id,
    'cash_amount', cash_amount_val
  );
END;
$$;
