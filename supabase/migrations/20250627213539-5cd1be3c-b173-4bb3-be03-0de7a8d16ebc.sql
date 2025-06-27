
-- Add email filtering function to check if user can access uploads from specific source emails
CREATE OR REPLACE FUNCTION public.can_access_upload_by_email()
RETURNS BOOLEAN AS $$
BEGIN
  -- Allow admin (Joshua) to see all uploads
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND email = 'joshuaburton096@gmail.com' 
    AND is_admin = TRUE
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- For regular users, they can only see uploads where source_email matches their profile email
  -- or where source_email is null/empty (direct uploads)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own uploads" ON public.cv_uploads;
DROP POLICY IF EXISTS "Admins can view all uploads" ON public.cv_uploads;
DROP POLICY IF EXISTS "Users can view accessible uploads" ON public.cv_uploads;
DROP POLICY IF EXISTS "Users can insert own uploads" ON public.cv_uploads;
DROP POLICY IF EXISTS "Users can update own uploads" ON public.cv_uploads;
DROP POLICY IF EXISTS "Users can delete own uploads" ON public.cv_uploads;

-- Create new policy that combines user ownership and email filtering
CREATE POLICY "Users can view accessible uploads" ON public.cv_uploads
  FOR SELECT USING (
    -- Admin can see everything
    public.is_joshua_admin() OR
    -- Regular users can see uploads where:
    (auth.uid() = user_id AND (
      -- No source email (direct upload)
      source_email IS NULL OR
      source_email = '' OR
      -- Source email matches their profile email
      source_email = (
        SELECT email FROM public.profiles WHERE id = auth.uid()
      )
    ))
  );

-- Recreate other policies
CREATE POLICY "Users can insert own uploads" ON public.cv_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads" ON public.cv_uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploads" ON public.cv_uploads
  FOR DELETE USING (auth.uid() = user_id);
