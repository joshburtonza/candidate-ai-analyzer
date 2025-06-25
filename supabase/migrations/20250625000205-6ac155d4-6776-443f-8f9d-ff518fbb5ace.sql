
-- Create table to store Gmail OAuth tokens for each user
CREATE TABLE public.gmail_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  gmail_email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  watch_expiration TIMESTAMP WITH TIME ZONE,
  history_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, gmail_email)
);

-- Create table to track processed emails to avoid duplicates
CREATE TABLE public.processed_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  gmail_integration_id UUID REFERENCES public.gmail_integrations NOT NULL,
  gmail_message_id TEXT NOT NULL,
  subject TEXT,
  sender_email TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cv_upload_ids UUID[] DEFAULT '{}',
  processing_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  UNIQUE(gmail_integration_id, gmail_message_id)
);

-- Add RLS policies for gmail_integrations
ALTER TABLE public.gmail_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Gmail integrations" 
  ON public.gmail_integrations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Gmail integrations" 
  ON public.gmail_integrations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Gmail integrations" 
  ON public.gmail_integrations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Gmail integrations" 
  ON public.gmail_integrations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS policies for processed_emails
ALTER TABLE public.processed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own processed emails" 
  ON public.processed_emails 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own processed emails" 
  ON public.processed_emails 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processed emails" 
  ON public.processed_emails 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to refresh expired tokens
CREATE OR REPLACE FUNCTION public.refresh_gmail_token(integration_id uuid, new_access_token text, new_expires_at timestamp with time zone)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.gmail_integrations 
  SET 
    access_token = new_access_token,
    token_expires_at = new_expires_at,
    updated_at = now()
  WHERE id = integration_id AND user_id = auth.uid();
END;
$$;

-- Create function to update Gmail watch expiration
CREATE OR REPLACE FUNCTION public.update_gmail_watch(integration_id uuid, new_expiration timestamp with time zone, new_history_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.gmail_integrations 
  SET 
    watch_expiration = new_expiration,
    history_id = COALESCE(new_history_id, history_id),
    updated_at = now()
  WHERE id = integration_id AND user_id = auth.uid();
END;
$$;

-- Add indexes for performance
CREATE INDEX idx_gmail_integrations_user_id ON public.gmail_integrations(user_id);
CREATE INDEX idx_gmail_integrations_active ON public.gmail_integrations(user_id, is_active);
CREATE INDEX idx_processed_emails_gmail_integration ON public.processed_emails(gmail_integration_id);
CREATE INDEX idx_processed_emails_message_id ON public.processed_emails(gmail_message_id);
