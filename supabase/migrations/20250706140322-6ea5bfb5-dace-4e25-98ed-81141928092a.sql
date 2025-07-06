-- Add missing DELETE policy for resumes table
CREATE POLICY "Authenticated users can delete resumes" 
ON public.resumes 
FOR DELETE 
USING (true);

-- Force complete PostgREST restart and schema reload
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';