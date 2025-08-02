-- Remove uploaded_at and received_at columns from cv_uploads table
-- Keep only received_date for all date-based operations

ALTER TABLE public.cv_uploads 
DROP COLUMN IF EXISTS uploaded_at,
DROP COLUMN IF EXISTS received_at;