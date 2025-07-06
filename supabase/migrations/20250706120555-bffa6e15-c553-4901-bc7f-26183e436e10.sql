-- Force PostgREST schema cache refresh by adding a comment
COMMENT ON TABLE public.resumes IS 'Resume data for candidates - cache refresh';