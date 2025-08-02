-- Add received_at and received_date columns to cv_uploads table
ALTER TABLE public.cv_uploads 
ADD COLUMN received_at TIMESTAMPTZ,
ADD COLUMN received_date DATE;

-- Create index on received_date for optimal calendar performance
CREATE INDEX idx_cv_uploads_received_date ON public.cv_uploads(received_date);

-- Create index on user_id and received_date for multi-user queries
CREATE INDEX idx_cv_uploads_user_received_date ON public.cv_uploads(user_id, received_date);

-- Update existing records to populate received_date from extracted_json.date_received
UPDATE public.cv_uploads 
SET 
  received_date = CASE 
    WHEN extracted_json->>'date_received' IS NOT NULL 
      AND extracted_json->>'date_received' != '' 
      AND (extracted_json->>'date_received')::DATE <= CURRENT_DATE
    THEN (extracted_json->>'date_received')::DATE
    ELSE uploaded_at::DATE
  END,
  received_at = CASE 
    WHEN extracted_json->>'date_received' IS NOT NULL 
      AND extracted_json->>'date_received' != '' 
      AND (extracted_json->>'date_received')::DATE <= CURRENT_DATE
    THEN (extracted_json->>'date_received')::TIMESTAMPTZ
    ELSE uploaded_at
  END
WHERE received_date IS NULL;