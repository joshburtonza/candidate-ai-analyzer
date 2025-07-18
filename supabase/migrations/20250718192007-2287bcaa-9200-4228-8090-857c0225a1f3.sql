-- Create the cv-uploads storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cv-uploads', 'cv-uploads', false);

-- Create storage policies for cv-uploads bucket
CREATE POLICY "Authenticated users can upload CVs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'cv-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view uploaded CVs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cv-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update CV files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'cv-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete CV files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'cv-uploads' AND auth.role() = 'authenticated');