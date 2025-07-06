-- Create simplified candidates table with only the required fields
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  contact_number TEXT,
  score NUMERIC DEFAULT 0,
  justification TEXT,
  professional_assessment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public read access for candidates" 
ON public.candidates 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert candidates" 
ON public.candidates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidates" 
ON public.candidates 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete candidates" 
ON public.candidates 
FOR DELETE 
USING (true);

-- Migrate data from resumes table to candidates table
INSERT INTO public.candidates (id, full_name, email, contact_number, score, justification, professional_assessment, created_at, updated_at)
SELECT 
  id,
  name as full_name,
  email,
  phone as contact_number,
  fit_score as score,
  justification,
  COALESCE(
    ai_insights->>'professional_assessment',
    ai_insights->>'assessment',
    'Professional assessment not available'
  ) as professional_assessment,
  created_at,
  updated_at
FROM public.resumes
WHERE NOT is_archived;

-- Create indexes for performance
CREATE INDEX idx_candidates_created_at ON public.candidates(created_at DESC);
CREATE INDEX idx_candidates_email ON public.candidates(email);
CREATE INDEX idx_candidates_score ON public.candidates(score DESC);

-- Enable realtime
ALTER TABLE public.candidates REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;