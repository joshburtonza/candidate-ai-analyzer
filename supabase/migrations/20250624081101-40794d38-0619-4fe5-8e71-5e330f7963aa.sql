
-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Public can view CV files" ON storage.objects;

-- Create storage policies for the cv-uploads bucket
CREATE POLICY "Users can upload own CVs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cv-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own CVs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cv-uploads' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

CREATE POLICY "Users can delete own CVs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'cv-uploads' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

-- Allow public access to files for downloads (this is the key policy for downloads)
CREATE POLICY "Public can view CV files" ON storage.objects
  FOR SELECT USING (bucket_id = 'cv-uploads');
