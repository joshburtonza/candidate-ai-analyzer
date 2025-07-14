-- Ensure cv_uploads table has proper unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS cv_uploads_email_unique_idx 
ON public.cv_uploads ((extracted_json->>'email_address')) 
WHERE extracted_json->>'email_address' IS NOT NULL 
AND extracted_json->>'email_address' != '' 
AND trim(extracted_json->>'email_address') != '';

-- Also create a function to prevent duplicate insertions
CREATE OR REPLACE FUNCTION prevent_duplicate_cv_uploads()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if a record with the same email already exists
  IF NEW.extracted_json->>'email_address' IS NOT NULL 
     AND NEW.extracted_json->>'email_address' != '' 
     AND trim(NEW.extracted_json->>'email_address') != '' THEN
    
    IF EXISTS (
      SELECT 1 FROM public.cv_uploads 
      WHERE extracted_json->>'email_address' = NEW.extracted_json->>'email_address'
      AND id != NEW.id
    ) THEN
      -- Instead of throwing error, just skip the insert
      RETURN NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run the function
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_cv_uploads ON public.cv_uploads;
CREATE TRIGGER trigger_prevent_duplicate_cv_uploads
  BEFORE INSERT ON public.cv_uploads
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_cv_uploads();