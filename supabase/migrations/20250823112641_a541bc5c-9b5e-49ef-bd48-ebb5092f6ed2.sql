-- 创建饭局照片存储bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dinner-photos', 'dinner-photos', true);

-- 创建饭局照片表
CREATE TABLE public.dinner_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dinner_id UUID NOT NULL REFERENCES public.dinners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  description TEXT,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建照片点赞表
CREATE TABLE public.photo_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.dinner_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- 创建照片评论表
CREATE TABLE public.photo_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.dinner_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.dinner_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;

-- 饭局照片的RLS策略
CREATE POLICY "用户可以查看已参与饭局的照片"
ON public.dinner_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dinner_participants 
    WHERE dinner_id = dinner_photos.dinner_id AND user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.dinners 
    WHERE id = dinner_photos.dinner_id AND created_by = auth.uid()
  )
);

CREATE POLICY "用户可以上传自己的照片"
ON public.dinner_photos FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  (EXISTS (
    SELECT 1 FROM public.dinner_participants 
    WHERE dinner_id = dinner_photos.dinner_id AND user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.dinners 
    WHERE id = dinner_photos.dinner_id AND created_by = auth.uid()
  ))
);

CREATE POLICY "用户可以更新自己的照片"
ON public.dinner_photos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的照片"
ON public.dinner_photos FOR DELETE
USING (auth.uid() = user_id);

-- 照片点赞的RLS策略
CREATE POLICY "用户可以查看照片点赞"
ON public.photo_likes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dinner_photos dp
    JOIN public.dinner_participants part ON dp.dinner_id = part.dinner_id
    WHERE dp.id = photo_likes.photo_id AND part.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.dinner_photos dp
    JOIN public.dinners d ON dp.dinner_id = d.id
    WHERE dp.id = photo_likes.photo_id AND d.created_by = auth.uid()
  )
);

CREATE POLICY "用户可以点赞照片"
ON public.photo_likes FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.dinner_photos dp
    JOIN public.dinner_participants part ON dp.dinner_id = part.dinner_id
    WHERE dp.id = photo_likes.photo_id AND part.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.dinner_photos dp
    JOIN public.dinners d ON dp.dinner_id = d.id
    WHERE dp.id = photo_likes.photo_id AND d.created_by = auth.uid()
  )
);

CREATE POLICY "用户可以取消自己的点赞"
ON public.photo_likes FOR DELETE
USING (auth.uid() = user_id);

-- 照片评论的RLS策略
CREATE POLICY "用户可以查看照片评论"
ON public.photo_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dinner_photos dp
    JOIN public.dinner_participants part ON dp.dinner_id = part.dinner_id
    WHERE dp.id = photo_comments.photo_id AND part.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.dinner_photos dp
    JOIN public.dinners d ON dp.dinner_id = d.id
    WHERE dp.id = photo_comments.photo_id AND d.created_by = auth.uid()
  )
);

CREATE POLICY "用户可以添加评论"
ON public.photo_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.dinner_photos dp
    JOIN public.dinner_participants part ON dp.dinner_id = part.dinner_id
    WHERE dp.id = photo_comments.photo_id AND part.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.dinner_photos dp
    JOIN public.dinners d ON dp.dinner_id = d.id
    WHERE dp.id = photo_comments.photo_id AND d.created_by = auth.uid()
  )
);

CREATE POLICY "用户可以更新自己的评论"
ON public.photo_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的评论"
ON public.photo_comments FOR DELETE
USING (auth.uid() = user_id);

-- 创建存储策略
CREATE POLICY "用户可以查看饭局照片"
ON storage.objects FOR SELECT
USING (bucket_id = 'dinner-photos');

CREATE POLICY "参与者可以上传饭局照片"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dinner-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "用户可以更新自己的照片"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dinner-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "用户可以删除自己的照片"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dinner-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 创建触发器更新updated_at
CREATE TRIGGER update_dinner_photos_updated_at
BEFORE UPDATE ON public.dinner_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_photo_comments_updated_at
BEFORE UPDATE ON public.photo_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 创建索引优化查询性能
CREATE INDEX idx_dinner_photos_dinner_id ON public.dinner_photos(dinner_id);
CREATE INDEX idx_dinner_photos_user_id ON public.dinner_photos(user_id);
CREATE INDEX idx_photo_likes_photo_id ON public.photo_likes(photo_id);
CREATE INDEX idx_photo_comments_photo_id ON public.photo_comments(photo_id);