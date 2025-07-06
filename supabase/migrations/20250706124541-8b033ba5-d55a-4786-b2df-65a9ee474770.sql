-- Force PostgREST to completely reload by updating a system setting
-- This forces PostgREST to restart and reload all schema information
DO $$
BEGIN
  -- Update PostgREST config to force restart
  PERFORM pg_notify('pgrst', 'reload config');
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;

-- Also ensure the table has the correct permissions
GRANT ALL ON public.resumes TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;