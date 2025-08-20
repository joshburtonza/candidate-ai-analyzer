-- Remove organization-based visibility and allow all authenticated users to view all candidates and notes

-- 1) cv_uploads: make all candidates visible to any signed-in user
DROP POLICY IF EXISTS "Users can view org uploads" ON public.cv_uploads;

CREATE POLICY "Authenticated users can view all uploads"
ON public.cv_uploads
FOR SELECT
TO authenticated
USING (true);

-- Keep existing policies that restrict insert/update/delete to the owner (unchanged)

-- 2) candidate_notes: make all notes visible to any signed-in user
DROP POLICY IF EXISTS "Users can view org notes" ON public.candidate_notes;

CREATE POLICY "Authenticated users can view all notes"
ON public.candidate_notes
FOR SELECT
TO authenticated
USING (true);

-- Keep existing policies that restrict insert/update/delete to the note owner (unchanged)