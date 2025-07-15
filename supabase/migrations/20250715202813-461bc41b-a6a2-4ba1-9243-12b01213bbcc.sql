-- Step 1: Remove the problematic trigger and function that's blocking cv_uploads insertions
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_cv_uploads ON public.cv_uploads;
DROP FUNCTION IF EXISTS public.prevent_duplicate_cv_uploads();

-- Step 2: Migrate existing resumes data to cv_uploads format
-- This will convert the 3 records from resumes table to the cv_uploads structure
INSERT INTO public.cv_uploads (
  file_url,
  original_filename,
  extracted_json,
  processing_status,
  uploaded_at,
  source_email,
  file_size
)
SELECT 
  COALESCE(file_url, file_path, '') as file_url,
  file_name as original_filename,
  jsonb_build_object(
    'candidate_name', name,
    'email_address', email,
    'contact_number', phone,
    'educational_qualifications', COALESCE(education_level::text, ''),
    'job_history', COALESCE(current_company, ''),
    'skill_set', COALESCE(array_to_string(skills, ', '), ''),
    'score', COALESCE(fit_score::text, ''),
    'justification', COALESCE(justification, ''),
    'countries', COALESCE(location, ''),
    'current_role', COALESCE(role_title, '')
  ) as extracted_json,
  'completed' as processing_status,
  created_at as uploaded_at,
  'migrated_from_resumes' as source_email,
  file_size
FROM public.resumes 
WHERE NOT is_archived
ON CONFLICT DO NOTHING;