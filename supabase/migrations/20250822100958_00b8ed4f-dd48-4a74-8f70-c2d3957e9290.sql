-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', false);

-- Create policies for chat image uploads
CREATE POLICY "Users can upload chat images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own chat images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Chat participants can view chat images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'chat-images' 
  AND EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    JOIN public.chat_messages cm ON cm.session_id = cs.id
    WHERE cm.content LIKE '%' || name
    AND (
      cs.participant1_id = auth.uid() 
      OR cs.participant2_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete their own chat images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);