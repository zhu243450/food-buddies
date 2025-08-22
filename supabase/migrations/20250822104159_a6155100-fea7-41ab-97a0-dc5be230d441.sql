-- 允许管理员查看存储中的聊天与证据图片
-- 注意：仅授予 SELECT 权限用于生成签名 URL/下载

-- 管理员可访问 chat-images
CREATE POLICY "Admins can view chat-images" 
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-images' AND public.has_role(auth.uid(), 'admin'));

-- 管理员可访问 feedback-evidence
CREATE POLICY "Admins can view feedback-evidence" 
ON storage.objects
FOR SELECT
USING (bucket_id = 'feedback-evidence' AND public.has_role(auth.uid(), 'admin'));
