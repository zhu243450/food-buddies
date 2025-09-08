-- Add policy for chat participants to view chat videos
CREATE POLICY "Chat participants can view chat videos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'chat-videos' AND 
  EXISTS (
    SELECT 1 FROM chat_sessions cs
    JOIN chat_messages cm ON cm.session_id = cs.id
    WHERE cm.content LIKE '%' || objects.name
    AND (cs.participant1_id = auth.uid() OR cs.participant2_id = auth.uid())
  )
);