-- Add org_id columns to existing tables (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cv_uploads' AND column_name = 'org_id') THEN
        ALTER TABLE public.cv_uploads ADD COLUMN org_id UUID REFERENCES public.organizations(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_notes' AND column_name = 'org_id') THEN
        ALTER TABLE public.candidate_notes ADD COLUMN org_id UUID REFERENCES public.organizations(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'batch_uploads' AND column_name = 'org_id') THEN
        ALTER TABLE public.batch_uploads ADD COLUMN org_id UUID REFERENCES public.organizations(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_searches' AND column_name = 'org_id') THEN
        ALTER TABLE public.saved_searches ADD COLUMN org_id UUID REFERENCES public.organizations(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processed_emails' AND column_name = 'org_id') THEN
        ALTER TABLE public.processed_emails ADD COLUMN org_id UUID REFERENCES public.organizations(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_usage_logs' AND column_name = 'org_id') THEN
        ALTER TABLE public.api_usage_logs ADD COLUMN org_id UUID REFERENCES public.organizations(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'org_id') THEN
        ALTER TABLE public.user_settings ADD COLUMN org_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- Function to get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- Function to auto-populate org_id
CREATE OR REPLACE FUNCTION public.set_user_org_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.org_id = public.get_user_org_id();
  RETURN NEW;
END;
$$;

-- Create triggers for auto-populating org_id (only if they don't exist)
DROP TRIGGER IF EXISTS set_cv_uploads_org_id ON public.cv_uploads;
CREATE TRIGGER set_cv_uploads_org_id
  BEFORE INSERT ON public.cv_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

DROP TRIGGER IF EXISTS set_candidate_notes_org_id ON public.candidate_notes;
CREATE TRIGGER set_candidate_notes_org_id
  BEFORE INSERT ON public.candidate_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

DROP TRIGGER IF EXISTS set_batch_uploads_org_id ON public.batch_uploads;
CREATE TRIGGER set_batch_uploads_org_id
  BEFORE INSERT ON public.batch_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

DROP TRIGGER IF EXISTS set_saved_searches_org_id ON public.saved_searches;
CREATE TRIGGER set_saved_searches_org_id
  BEFORE INSERT ON public.saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

DROP TRIGGER IF EXISTS set_processed_emails_org_id ON public.processed_emails;
CREATE TRIGGER set_processed_emails_org_id
  BEFORE INSERT ON public.processed_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

DROP TRIGGER IF EXISTS set_api_usage_logs_org_id ON public.api_usage_logs;
CREATE TRIGGER set_api_usage_logs_org_id
  BEFORE INSERT ON public.api_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

DROP TRIGGER IF EXISTS set_user_settings_org_id ON public.user_settings;
CREATE TRIGGER set_user_settings_org_id
  BEFORE INSERT ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

-- Update RLS policies for data tables to be org-scoped
DROP POLICY IF EXISTS "Users can view accessible uploads" ON public.cv_uploads;
DROP POLICY IF EXISTS "Users can view org uploads" ON public.cv_uploads;
CREATE POLICY "Users can view org uploads"
ON public.cv_uploads
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  is_joshua_admin() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

DROP POLICY IF EXISTS "Users can view own notes" ON public.candidate_notes;
DROP POLICY IF EXISTS "Users can view org notes" ON public.candidate_notes;
CREATE POLICY "Users can view org notes"
ON public.candidate_notes
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  is_admin() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

DROP POLICY IF EXISTS "Users can view own batches" ON public.batch_uploads;
DROP POLICY IF EXISTS "Users can view org batches" ON public.batch_uploads;
CREATE POLICY "Users can view org batches"
ON public.batch_uploads
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  is_admin() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

DROP POLICY IF EXISTS "Users can view own searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can view org searches" ON public.saved_searches;
CREATE POLICY "Users can view org searches"
ON public.saved_searches
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

DROP POLICY IF EXISTS "Users can view own processed emails" ON public.processed_emails;
DROP POLICY IF EXISTS "Users can view org processed emails" ON public.processed_emails;
CREATE POLICY "Users can view org processed emails"
ON public.processed_emails
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  is_admin() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

DROP POLICY IF EXISTS "Users can view own api logs" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Users can view org api logs" ON public.api_usage_logs;
CREATE POLICY "Users can view org api logs"
ON public.api_usage_logs
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  is_admin() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view org settings" ON public.user_settings;
CREATE POLICY "Users can view org settings"
ON public.user_settings
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

-- Backfill existing data: Create personal organizations for existing users who don't have one
DO $$
DECLARE
  user_record RECORD;
  new_org_id UUID;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT p.id, p.email, p.full_name, ur.role
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.organization_members om 
      WHERE om.user_id = p.id
    )
  LOOP
    -- Create personal organization
    INSERT INTO public.organizations (name, slug)
    VALUES (
      COALESCE(user_record.full_name, user_record.email) || '''s Organization',
      'personal-' || user_record.id::text
    )
    RETURNING id INTO new_org_id;
    
    -- Add user to organization with their role
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (
      new_org_id, 
      user_record.id, 
      COALESCE(user_record.role, 'recruiter'::app_role)
    );
    
    -- Update existing data with org_id
    UPDATE public.cv_uploads SET org_id = new_org_id WHERE user_id = user_record.id AND org_id IS NULL;
    UPDATE public.candidate_notes SET org_id = new_org_id WHERE user_id = user_record.id AND org_id IS NULL;
    UPDATE public.batch_uploads SET org_id = new_org_id WHERE user_id = user_record.id AND org_id IS NULL;
    UPDATE public.saved_searches SET org_id = new_org_id WHERE user_id = user_record.id AND org_id IS NULL;
    UPDATE public.processed_emails SET org_id = new_org_id WHERE user_id = user_record.id AND org_id IS NULL;
    UPDATE public.api_usage_logs SET org_id = new_org_id WHERE user_id = user_record.id AND org_id IS NULL;
    UPDATE public.user_settings SET org_id = new_org_id WHERE user_id = user_record.id AND org_id IS NULL;
  END LOOP;
END $$;