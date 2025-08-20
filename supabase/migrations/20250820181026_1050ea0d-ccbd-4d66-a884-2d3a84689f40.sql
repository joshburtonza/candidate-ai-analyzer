-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organization_members table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for organizations
CREATE POLICY "Users can view their organization"
ON public.organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their organization"
ON public.organizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = id AND user_id = auth.uid() AND role = 'manager'
  )
);

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for organization_members
CREATE POLICY "Users can view their organization members"
ON public.organization_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om 
    WHERE om.organization_id = organization_id AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Managers can manage organization members"
ON public.organization_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = organization_members.organization_id 
    AND user_id = auth.uid() 
    AND role = 'manager'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = organization_members.organization_id 
    AND user_id = auth.uid() 
    AND role = 'manager'
  )
);

CREATE POLICY "Users can join organizations"
ON public.organization_members
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Add org_id columns to existing tables
ALTER TABLE public.cv_uploads 
ADD COLUMN org_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.candidate_notes 
ADD COLUMN org_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.batch_uploads 
ADD COLUMN org_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.saved_searches 
ADD COLUMN org_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.processed_emails 
ADD COLUMN org_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.api_usage_logs 
ADD COLUMN org_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.user_settings 
ADD COLUMN org_id UUID REFERENCES public.organizations(id);

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

-- Create triggers for auto-populating org_id
CREATE TRIGGER set_cv_uploads_org_id
  BEFORE INSERT ON public.cv_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

CREATE TRIGGER set_candidate_notes_org_id
  BEFORE INSERT ON public.candidate_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

CREATE TRIGGER set_batch_uploads_org_id
  BEFORE INSERT ON public.batch_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

CREATE TRIGGER set_saved_searches_org_id
  BEFORE INSERT ON public.saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

CREATE TRIGGER set_processed_emails_org_id
  BEFORE INSERT ON public.processed_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

CREATE TRIGGER set_api_usage_logs_org_id
  BEFORE INSERT ON public.api_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

CREATE TRIGGER set_user_settings_org_id
  BEFORE INSERT ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_org_id();

-- Update RLS policies for data tables to be org-scoped
DROP POLICY IF EXISTS "Users can view accessible uploads" ON public.cv_uploads;
CREATE POLICY "Users can view org uploads"
ON public.cv_uploads
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  is_joshua_admin() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

DROP POLICY IF EXISTS "Users can view own notes" ON public.candidate_notes;
CREATE POLICY "Users can view org notes"
ON public.candidate_notes
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  is_admin() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

DROP POLICY IF EXISTS "Users can view own batches" ON public.batch_uploads;
CREATE POLICY "Users can view org batches"
ON public.batch_uploads
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  is_admin() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

DROP POLICY IF EXISTS "Users can view own searches" ON public.saved_searches;
CREATE POLICY "Users can view org searches"
ON public.saved_searches
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

DROP POLICY IF EXISTS "Users can view own processed emails" ON public.processed_emails;
CREATE POLICY "Users can view org processed emails"
ON public.processed_emails
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  is_admin() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

DROP POLICY IF EXISTS "Users can view own api logs" ON public.api_usage_logs;
CREATE POLICY "Users can view org api logs"
ON public.api_usage_logs
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  is_admin() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view org settings"
ON public.user_settings
FOR SELECT
USING (
  org_id = public.get_user_org_id() OR 
  (auth.uid() = user_id AND org_id IS NULL)
);

-- Backfill existing data: Create personal organizations for existing users
DO $$
DECLARE
  user_record RECORD;
  org_id UUID;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT p.id, p.email, p.full_name, ur.role
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  LOOP
    -- Create personal organization
    INSERT INTO public.organizations (name, slug)
    VALUES (
      COALESCE(user_record.full_name, user_record.email) || '''s Organization',
      'personal-' || user_record.id::text
    )
    RETURNING id INTO org_id;
    
    -- Add user to organization with their role
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (
      org_id, 
      user_record.id, 
      COALESCE(user_record.role, 'recruiter'::app_role)
    );
    
    -- Update existing data with org_id
    UPDATE public.cv_uploads SET org_id = org_id WHERE user_id = user_record.id;
    UPDATE public.candidate_notes SET org_id = org_id WHERE user_id = user_record.id;
    UPDATE public.batch_uploads SET org_id = org_id WHERE user_id = user_record.id;
    UPDATE public.saved_searches SET org_id = org_id WHERE user_id = user_record.id;
    UPDATE public.processed_emails SET org_id = org_id WHERE user_id = user_record.id;
    UPDATE public.api_usage_logs SET org_id = org_id WHERE user_id = user_record.id;
    UPDATE public.user_settings SET org_id = org_id WHERE user_id = user_record.id;
  END LOOP;
END $$;

-- Add triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();