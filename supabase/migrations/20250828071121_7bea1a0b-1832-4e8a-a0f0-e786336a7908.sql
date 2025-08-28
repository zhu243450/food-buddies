-- 为聊天添加视频支持，创建chat-videos存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-videos', 'chat-videos', false);

-- 为chat-videos存储桶创建RLS策略
CREATE POLICY "Users can view their own chat videos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'chat-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their own chat videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chat-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own chat videos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'chat-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 为dinner-photos存储桶添加视频支持（将其重新用作媒体存储桶）
CREATE POLICY "Users can view dinner videos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'dinner-photos' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM dinner_photos dp 
      WHERE dp.photo_url LIKE '%' || name || '%'
      AND (
        dp.dinner_id IS NULL 
        OR EXISTS (
          SELECT 1 FROM dinner_participants part 
          WHERE part.dinner_id = dp.dinner_id AND part.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM dinners d 
          WHERE d.id = dp.dinner_id AND d.created_by = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "Users can upload dinner videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'dinner-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 修改dinner_photos表以支持视频
ALTER TABLE dinner_photos 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT NULL; -- 视频时长（秒）

-- 更新已有记录
UPDATE dinner_photos SET media_type = 'image' WHERE media_type IS NULL;