
-- Create storage bucket for CV files
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', false);

-- Create storage policies for CV uploads
CREATE POLICY "Users can upload own CVs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cv-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own CVs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cv-uploads' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
  );

CREATE POLICY "Users can delete own CVs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'cv-uploads' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
  );

-- Create additional tables for full functionality
CREATE TABLE public.batch_uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  total_files integer DEFAULT 0,
  processed_files integer DEFAULT 0,
  failed_files integer DEFAULT 0,
  status text DEFAULT 'processing',
  source_email text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  PRIMARY KEY (id)
);

CREATE TABLE public.candidate_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cv_upload_id uuid REFERENCES public.cv_uploads ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.processed_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email_id text UNIQUE NOT NULL,
  source_email text NOT NULL,
  processed_at timestamp with time zone DEFAULT now(),
  files_extracted integer DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE public.saved_searches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  search_name text NOT NULL,
  search_criteria jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS on all new tables
ALTER TABLE public.batch_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for batch_uploads
CREATE POLICY "Users can view own batch uploads" ON public.batch_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batch uploads" ON public.batch_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batch uploads" ON public.batch_uploads
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for candidate_notes
CREATE POLICY "Users can view own candidate notes" ON public.candidate_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own candidate notes" ON public.candidate_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own candidate notes" ON public.candidate_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own candidate notes" ON public.candidate_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for processed_emails (admin only for security)
CREATE POLICY "Admins can manage processed emails" ON public.processed_emails
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Create RLS policies for saved_searches
CREATE POLICY "Users can manage own saved searches" ON public.saved_searches
  FOR ALL USING (auth.uid() = user_id);

-- Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create Joshua-specific admin function
CREATE OR REPLACE FUNCTION public.is_joshua_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND email = 'joshuaburton096@gmail.com' 
    AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update cv_uploads policies to include admin access
DROP POLICY IF EXISTS "Users can view their own uploads" ON public.cv_uploads;
CREATE POLICY "Users can view accessible uploads" ON public.cv_uploads
  FOR SELECT USING (
    public.is_joshua_admin() OR
    (auth.uid() = user_id AND (
      source_email IS NULL OR
      source_email = '' OR
      source_email = (
        SELECT email FROM public.profiles WHERE id = auth.uid()
      )
    ))
  );

-- Add admin policies for profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION public.update_profile(
  user_full_name text
)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles 
  SET full_name = user_full_name,
      updated_at = now()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for cv_uploads
ALTER PUBLICATION supabase_realtime ADD TABLE public.cv_uploads;
ALTER TABLE public.cv_uploads REPLICA IDENTITY FULL;

-- Enable realtime for profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Set up Joshua as admin
INSERT INTO public.profiles (id, email, full_name, is_admin, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Joshua Burton'),
  true,
  created_at
FROM auth.users 
WHERE email = 'joshuaburton096@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  is_admin = true,
  full_name = COALESCE(EXCLUDED.full_name, 'Joshua Burton');
