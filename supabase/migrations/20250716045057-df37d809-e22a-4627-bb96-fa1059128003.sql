-- Update existing cv_uploads records to fix field name mismatches
UPDATE cv_uploads 
SET extracted_json = jsonb_set(
  jsonb_set(
    extracted_json - 'full name',
    '{candidate_name}', 
    extracted_json->'full name'
  ),
  '{score}',
  to_jsonb((extracted_json->>'score')::text)
)
WHERE extracted_json ? 'full name' 
   OR jsonb_typeof(extracted_json->'score') = 'number';