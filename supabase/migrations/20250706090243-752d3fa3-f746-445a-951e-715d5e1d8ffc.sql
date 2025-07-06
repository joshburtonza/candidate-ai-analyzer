-- Create the resumes table with full structure
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_path TEXT,
  file_url TEXT,
  file_size BIGINT,
  status TEXT DEFAULT 'pending'::TEXT CHECK (status IN ('pending', 'processed', 'failed', 'archived')),
  source TEXT DEFAULT 'manual_upload'::TEXT CHECK (source IN ('manual_upload', 'email', 'api', 'webhook')),
  parsed_data JSONB DEFAULT '{}'::JSONB,
  original_text TEXT,
  parsing_method TEXT,
  parsing_confidence NUMERIC,
  processing_time_ms INTEGER,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_details JSONB,
  fit_score NUMERIC DEFAULT 0.0,
  justification TEXT,
  score_components JSONB DEFAULT '{}'::JSONB,
  ai_insights JSONB DEFAULT '{}'::JSONB,
  role_title TEXT,
  current_company TEXT,
  experience_years INTEGER DEFAULT 0,
  total_experience_months INTEGER DEFAULT 0,
  education_level TEXT CHECK (education_level IN ('high_school', 'diploma', 'bachelors', 'masters', 'phd', 'other')),
  education_details JSONB DEFAULT '[]'::JSONB,
  skills TEXT[] DEFAULT '{}',
  certifications JSONB DEFAULT '[]'::JSONB,
  languages JSONB DEFAULT '[]'::JSONB,
  nationality TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public read access for resumes" 
ON public.resumes 
FOR SELECT 
USING (NOT is_archived);

CREATE POLICY "Authenticated users can insert resumes" 
ON public.resumes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update their uploads" 
ON public.resumes 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_resumes_created_at ON public.resumes(created_at DESC);
CREATE INDEX idx_resumes_fit_score ON public.resumes(fit_score DESC);
CREATE INDEX idx_resumes_status ON public.resumes(status);
CREATE INDEX idx_resumes_skills ON public.resumes USING GIN(skills);
CREATE INDEX idx_resumes_location ON public.resumes(location);

-- Enable realtime
ALTER TABLE public.resumes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resumes;