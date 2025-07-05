-- Drop the cv_uploads table since we're consolidating to resumes table
DROP TABLE IF EXISTS public.cv_uploads CASCADE;

-- Drop the candidate_notes table foreign key reference and recreate with resumes
DROP TABLE IF EXISTS public.candidate_notes CASCADE;

-- Recreate candidate_notes table to reference resumes instead
CREATE TABLE public.candidate_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id UUID DEFAULT auth.uid(),
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on candidate_notes
ALTER TABLE public.candidate_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for candidate_notes
CREATE POLICY "Users can view own candidate notes" 
ON public.candidate_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own candidate notes" 
ON public.candidate_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own candidate notes" 
ON public.candidate_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own candidate notes" 
ON public.candidate_notes 
FOR DELETE 
USING (auth.uid() = user_id);