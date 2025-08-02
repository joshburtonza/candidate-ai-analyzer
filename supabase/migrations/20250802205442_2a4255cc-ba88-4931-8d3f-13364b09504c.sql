-- Update received_date for all recent candidates where it's null or incorrect
-- Set received_date to today's date for candidates uploaded in the last 7 days
UPDATE cv_uploads 
SET received_date = CURRENT_DATE
WHERE received_date IS NULL 
  AND created_at >= CURRENT_DATE - INTERVAL '7 days';