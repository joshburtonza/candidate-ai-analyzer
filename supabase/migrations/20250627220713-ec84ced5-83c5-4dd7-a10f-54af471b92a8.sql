
-- Double-check and clear all candidate data completely
TRUNCATE TABLE public.candidate_notes CASCADE;
TRUNCATE TABLE public.processed_emails CASCADE;
TRUNCATE TABLE public.cv_uploads CASCADE;
TRUNCATE TABLE public.batch_uploads CASCADE;
TRUNCATE TABLE public.saved_searches CASCADE;

-- Reset any sequences if they exist
-- This ensures clean slate for new uploads
