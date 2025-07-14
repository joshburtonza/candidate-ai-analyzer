-- Add unique constraint on email to prevent duplicate candidates
ALTER TABLE public.resumes 
ADD CONSTRAINT resumes_email_unique UNIQUE (email);

-- Add partial unique index for non-null emails only to handle null values gracefully
DROP CONSTRAINT IF EXISTS resumes_email_unique;
CREATE UNIQUE INDEX resumes_email_unique_idx ON public.resumes (email) WHERE email IS NOT NULL;