-- 添加外键约束，建立dinner_photos和profiles表之间的关系
ALTER TABLE public.dinner_photos 
ADD CONSTRAINT fk_dinner_photos_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- 添加外键约束，建立photo_comments和profiles表之间的关系
ALTER TABLE public.photo_comments 
ADD CONSTRAINT fk_photo_comments_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;