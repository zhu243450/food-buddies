-- Create storage bucket for feedback evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('feedback-evidence', 'feedback-evidence', false);

-- Create policies for feedback evidence uploads
CREATE POLICY "Users can upload their own feedback evidence" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'feedback-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own feedback evidence" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'feedback-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all feedback evidence" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'feedback-evidence' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own feedback evidence" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'feedback-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own feedback evidence" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'feedback-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);