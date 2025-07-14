-- Add partial unique index for non-null emails only to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS resumes_email_unique_idx ON public.resumes (email) WHERE email IS NOT NULL;