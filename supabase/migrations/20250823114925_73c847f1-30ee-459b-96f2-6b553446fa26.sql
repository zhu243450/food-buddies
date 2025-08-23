-- 添加新的RLS策略，让用户可以查看所有用户的照片（用于个人资料页面）
CREATE POLICY "用户可以查看所有照片用于个人资料" 
ON public.dinner_photos 
FOR SELECT 
USING (true);

-- 更新照片点赞的RLS策略，允许查看所有点赞
DROP POLICY IF EXISTS "用户可以查看照片点赞" ON public.photo_likes;
CREATE POLICY "用户可以查看所有照片点赞" 
ON public.photo_likes 
FOR SELECT 
USING (true);

-- 更新照片评论的RLS策略，允许查看所有评论
DROP POLICY IF EXISTS "用户可以查看照片评论" ON public.photo_comments;
CREATE POLICY "用户可以查看所有照片评论" 
ON public.photo_comments 
FOR SELECT 
USING (true);