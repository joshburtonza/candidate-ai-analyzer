-- Drop the candidates table since we're reverting back
DROP TABLE IF EXISTS public.candidates CASCADE;

-- Make sure cv_uploads table exists with the original structure
-- (It should already exist from the previous migration)

-- Update cv_uploads to ensure it has all the fields we need
-- Add any missing columns that might be needed
ALTER TABLE public.cv_uploads 
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error'));

-- Ensure RLS is enabled and policies are correct
ALTER TABLE public.cv_uploads ENABLE ROW LEVEL SECURITY;

-- Recreate policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cv_uploads' AND policyname = 'Public read access for cv_uploads') THEN
        CREATE POLICY "Public read access for cv_uploads" 
        ON public.cv_uploads 
        FOR SELECT 
        USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cv_uploads' AND policyname = 'Authenticated users can insert cv_uploads') THEN
        CREATE POLICY "Authenticated users can insert cv_uploads" 
        ON public.cv_uploads 
        FOR INSERT 
        WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cv_uploads' AND policyname = 'Authenticated users can update cv_uploads') THEN
        CREATE POLICY "Authenticated users can update cv_uploads" 
        ON public.cv_uploads 
        FOR UPDATE 
        USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cv_uploads' AND policyname = 'Authenticated users can delete cv_uploads') THEN
        CREATE POLICY "Authenticated users can delete cv_uploads" 
        ON public.cv_uploads 
        FOR DELETE 
        USING (true);
    END IF;
END
$$;

-- Ensure realtime is enabled
ALTER TABLE public.cv_uploads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cv_uploads;