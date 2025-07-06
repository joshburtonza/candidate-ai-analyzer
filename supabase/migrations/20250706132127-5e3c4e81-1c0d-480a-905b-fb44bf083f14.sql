-- Grant explicit permissions to the roles that PostgREST uses
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON public.resumes TO anon, authenticated;

-- Also grant permissions on sequences if any
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Refresh the PostgREST schema cache completely
NOTIFY pgrst, 'reload schema';