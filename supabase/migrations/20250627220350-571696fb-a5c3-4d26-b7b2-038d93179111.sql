
-- Delete all candidate notes first (due to foreign key relationships)
DELETE FROM public.candidate_notes;

-- Delete all processed emails
DELETE FROM public.processed_emails;

-- Delete all CV uploads (this is the main candidate data)
DELETE FROM public.cv_uploads;

-- Delete all batch uploads
DELETE FROM public.batch_uploads;

-- Delete all saved searches
DELETE FROM public.saved_searches;
