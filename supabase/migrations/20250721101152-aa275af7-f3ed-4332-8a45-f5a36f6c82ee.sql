
-- Create user profiles table with enhanced features
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create enhanced CV uploads table
CREATE TABLE public.cv_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  extracted_json JSONB,
  original_filename TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_email TEXT,
  file_size BIGINT,
  processing_status TEXT DEFAULT 'pending',
  PRIMARY KEY (id)
);

-- Create candidate notes table
CREATE TABLE public.candidate_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.cv_uploads ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create saved searches table
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  search_name TEXT NOT NULL,
  search_criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create batch uploads table
CREATE TABLE public.batch_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  batch_name TEXT NOT NULL,
  total_files INTEGER NOT NULL,
  processed_files INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (id)
);

-- Create processed emails table
CREATE TABLE public.processed_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email_id TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_email TEXT NOT NULL,
  attachments_count INTEGER DEFAULT 0,
  PRIMARY KEY (id)
);

-- Create API usage logs table
CREATE TABLE public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_status INTEGER,
  request_size BIGINT,
  response_size BIGINT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create user settings table
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (user_id, setting_key)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create security function for Joshua admin access
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

-- Create general admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- CV uploads policies
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

CREATE POLICY "Users can insert own uploads" ON public.cv_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads" ON public.cv_uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploads" ON public.cv_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- Candidate notes policies
CREATE POLICY "Users can view own notes" ON public.candidate_notes
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own notes" ON public.candidate_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.candidate_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.candidate_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Saved searches policies
CREATE POLICY "Users can view own searches" ON public.saved_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own searches" ON public.saved_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own searches" ON public.saved_searches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own searches" ON public.saved_searches
  FOR DELETE USING (auth.uid() = user_id);

-- Batch uploads policies
CREATE POLICY "Users can view own batches" ON public.batch_uploads
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own batches" ON public.batch_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batches" ON public.batch_uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batches" ON public.batch_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- Processed emails policies
CREATE POLICY "Users can view own processed emails" ON public.processed_emails
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own processed emails" ON public.processed_emails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own processed emails" ON public.processed_emails
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own processed emails" ON public.processed_emails
  FOR DELETE USING (auth.uid() = user_id);

-- API usage logs policies
CREATE POLICY "Users can view own api logs" ON public.api_usage_logs
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own api logs" ON public.api_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cv-uploads', 'cv-uploads', false);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('processed-documents', 'processed-documents', false);

-- Storage policies for cv-uploads
CREATE POLICY "Users can upload own CVs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cv-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own CVs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cv-uploads' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

CREATE POLICY "Users can delete own CVs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'cv-uploads' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

-- Storage policies for profile-photos
CREATE POLICY "Users can upload own profile photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view profile photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can delete own profile photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for processed-documents
CREATE POLICY "Users can upload processed documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'processed-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view processed documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'processed-documents' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

CREATE POLICY "Users can delete processed documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'processed-documents' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

-- Enable realtime for cv_uploads table
ALTER TABLE public.cv_uploads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cv_uploads;

-- Make joshuaburton096@gmail.com admin (will be applied when they sign up)
-- This will be handled by the trigger when the user signs up
