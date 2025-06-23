
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all uploads" ON public.cv_uploads;

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate admin policies using the function
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all uploads" ON public.cv_uploads
  FOR SELECT USING (public.is_admin());

-- Ensure storage policies are correct
DROP POLICY IF EXISTS "Users can upload own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own CVs" ON storage.objects;

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
