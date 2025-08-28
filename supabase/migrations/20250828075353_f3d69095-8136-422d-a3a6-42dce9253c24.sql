-- Fix storage policies for chat videos to allow proper upload
DROP POLICY IF EXISTS "Users can upload their own chat videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload chat images" ON storage.objects;

-- Create proper upload policies for chat videos and images
CREATE POLICY "Users can upload their own chat videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chat-videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload chat images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chat-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);