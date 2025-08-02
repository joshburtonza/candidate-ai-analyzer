-- Update Rasheed Aniff to be linked to 2025-07-29
UPDATE cv_uploads 
SET received_date = '2025-07-29' 
WHERE extracted_json->>'candidate_name' = 'Rasheed Aniff';