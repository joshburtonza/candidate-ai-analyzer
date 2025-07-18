-- Clear all profiles from the database completely
DELETE FROM public.profiles;

-- Delete all CV uploads except those uploaded today
DELETE FROM public.cv_uploads 
WHERE uploaded_at::date != CURRENT_DATE;

-- Also clear related data that might reference old profiles
DELETE FROM public.candidate_notes;
DELETE FROM public.saved_searches;
DELETE FROM public.batch_uploads;