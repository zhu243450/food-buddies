-- 更新photo_likes表的INSERT政策，允许用户对个人分享照片点赞
DROP POLICY IF EXISTS "用户可以点赞照片" ON public.photo_likes;

CREATE POLICY "用户可以点赞照片" 
ON public.photo_likes 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND (
    -- 对于个人分享的照片（dinner_id为null），任何人都可以点赞
    (EXISTS ( 
      SELECT 1 FROM dinner_photos dp 
      WHERE dp.id = photo_likes.photo_id AND dp.dinner_id IS NULL 
    )) 
    OR
    -- 对于饭局照片，需要是参与者或创建者
    (EXISTS ( 
      SELECT 1 FROM (dinner_photos dp JOIN dinner_participants part ON dp.dinner_id = part.dinner_id) 
      WHERE dp.id = photo_likes.photo_id AND part.user_id = auth.uid() 
    )) 
    OR 
    (EXISTS ( 
      SELECT 1 FROM (dinner_photos dp JOIN dinners d ON dp.dinner_id = d.id) 
      WHERE dp.id = photo_likes.photo_id AND d.created_by = auth.uid() 
    ))
  )
);

-- 更新photo_comments表的INSERT政策，允许用户对个人分享照片评论
DROP POLICY IF EXISTS "用户可以添加评论" ON public.photo_comments;

CREATE POLICY "用户可以添加评论" 
ON public.photo_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND (
    -- 对于个人分享的照片（dinner_id为null），任何人都可以评论
    (EXISTS ( 
      SELECT 1 FROM dinner_photos dp 
      WHERE dp.id = photo_comments.photo_id AND dp.dinner_id IS NULL 
    )) 
    OR
    -- 对于饭局照片，需要是参与者或创建者
    (EXISTS ( 
      SELECT 1 FROM (dinner_photos dp JOIN dinner_participants part ON dp.dinner_id = part.dinner_id) 
      WHERE dp.id = photo_comments.photo_id AND part.user_id = auth.uid() 
    )) 
    OR 
    (EXISTS ( 
      SELECT 1 FROM (dinner_photos dp JOIN dinners d ON dp.dinner_id = d.id) 
      WHERE dp.id = photo_comments.photo_id AND d.created_by = auth.uid() 
    ))
  )
);