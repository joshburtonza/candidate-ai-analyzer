-- Recreate the original cv_uploads table structure
CREATE TABLE public.cv_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  file_url TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_email TEXT,
  file_size BIGINT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
  extracted_json JSONB
);

-- Enable RLS
ALTER TABLE public.cv_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read access to match original behavior)
CREATE POLICY "Public read access for cv_uploads" 
ON public.cv_uploads 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert cv_uploads" 
ON public.cv_uploads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update cv_uploads" 
ON public.cv_uploads 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete cv_uploads" 
ON public.cv_uploads 
FOR DELETE 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_cv_uploads_uploaded_at ON public.cv_uploads(uploaded_at DESC);
CREATE INDEX idx_cv_uploads_user_id ON public.cv_uploads(user_id);
CREATE INDEX idx_cv_uploads_source_email ON public.cv_uploads(source_email);

-- Enable realtime
ALTER TABLE public.cv_uploads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cv_uploads;