-- Fix security warnings: Set OTP expiry to recommended 10 minutes
ALTER SYSTEM SET auth.otp_expiry = '600';

-- Fix security warnings: Enable leaked password protection
ALTER SYSTEM SET auth.enable_password_validation = 'on';