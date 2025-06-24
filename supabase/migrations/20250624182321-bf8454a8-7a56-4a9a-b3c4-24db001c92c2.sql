
-- Add candidate status tracking and team collaboration features
ALTER TABLE public.cv_uploads ADD COLUMN IF NOT EXISTS candidate_status TEXT DEFAULT 'new';
ALTER TABLE public.cv_uploads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.cv_uploads ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.cv_uploads ADD COLUMN IF NOT EXISTS score_breakdown JSONB;
ALTER TABLE public.cv_uploads ADD COLUMN IF NOT EXISTS last_updated_by UUID REFERENCES auth.users(id);

-- Create batch uploads tracking table
CREATE TABLE public.batch_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  batch_name TEXT NOT NULL,
  total_files INTEGER NOT NULL DEFAULT 0,
  processed_files INTEGER NOT NULL DEFAULT 0,
  failed_files INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Add batch_id to cv_uploads to track which batch a CV belongs to
ALTER TABLE public.cv_uploads ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batch_uploads(id);

-- Create saved searches table
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  search_criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidate notes table for detailed tracking
CREATE TABLE public.candidate_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID NOT NULL REFERENCES public.cv_uploads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  note_text TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.batch_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_notes ENABLE ROW LEVEL SECURITY;

-- Policies for batch_uploads
CREATE POLICY "Users can view own batch uploads" ON public.batch_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own batch uploads" ON public.batch_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batch uploads" ON public.batch_uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all batch uploads" ON public.batch_uploads
  FOR SELECT USING (public.is_admin());

-- Policies for saved_searches
CREATE POLICY "Users can manage own saved searches" ON public.saved_searches
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all saved searches" ON public.saved_searches
  FOR SELECT USING (public.is_admin());

-- Policies for candidate_notes
CREATE POLICY "Users can view notes for their uploads" ON public.candidate_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cv_uploads 
      WHERE id = upload_id AND user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Users can create notes for their uploads" ON public.candidate_notes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.cv_uploads 
      WHERE id = upload_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own notes" ON public.candidate_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.candidate_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_cv_uploads_candidate_status ON public.cv_uploads(candidate_status);
CREATE INDEX idx_cv_uploads_batch_id ON public.cv_uploads(batch_id);
CREATE INDEX idx_cv_uploads_tags ON public.cv_uploads USING GIN(tags);
CREATE INDEX idx_batch_uploads_status ON public.batch_uploads(status);
CREATE INDEX idx_candidate_notes_upload_id ON public.candidate_notes(upload_id);

-- Create a function to update batch upload progress
CREATE OR REPLACE FUNCTION public.update_batch_progress(batch_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.batch_uploads 
  SET 
    processed_files = (
      SELECT COUNT(*) FROM public.cv_uploads 
      WHERE batch_id = batch_uuid AND processing_status IN ('completed', 'error')
    ),
    failed_files = (
      SELECT COUNT(*) FROM public.cv_uploads 
      WHERE batch_id = batch_uuid AND processing_status = 'error'
    ),
    status = CASE 
      WHEN (SELECT COUNT(*) FROM public.cv_uploads WHERE batch_id = batch_uuid AND processing_status IN ('pending', 'processing')) = 0 
      THEN 'completed'
      ELSE 'processing'
    END,
    completed_at = CASE 
      WHEN (SELECT COUNT(*) FROM public.cv_uploads WHERE batch_id = batch_uuid AND processing_status IN ('pending', 'processing')) = 0 
      THEN NOW()
      ELSE completed_at
    END
  WHERE id = batch_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
