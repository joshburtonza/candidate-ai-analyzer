-- Update received_date for all recent candidates where it's null 
-- Set received_date to today's date for candidates that don't have it set
UPDATE cv_uploads 
SET received_date = CURRENT_DATE
WHERE received_date IS NULL;