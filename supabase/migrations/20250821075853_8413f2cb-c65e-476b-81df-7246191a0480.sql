-- Fix cross-contamination: restrict visibility to user's own uploads only

-- 1) cv_uploads: users can only see their own uploads
DROP POLICY IF EXISTS "Authenticated users can view all uploads" ON public.cv_uploads;

CREATE POLICY "Users can view own uploads"
ON public.cv_uploads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2) candidate_notes: users can only see notes on their own candidates
DROP POLICY IF EXISTS "Authenticated users can view all notes" ON public.candidate_notes;

CREATE POLICY "Users can view notes on own candidates"
ON public.candidate_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cv_uploads 
    WHERE cv_uploads.id = candidate_notes.candidate_id 
    AND cv_uploads.user_id = auth.uid()
  )
);