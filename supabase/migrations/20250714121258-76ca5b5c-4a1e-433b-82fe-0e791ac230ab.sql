-- Remove duplicate candidates from cv_uploads table, keeping only the most recent one for each email
WITH duplicates AS (
  SELECT id,
         extracted_json->>'email_address' as email,
         ROW_NUMBER() OVER (PARTITION BY extracted_json->>'email_address' ORDER BY uploaded_at DESC) as rn
  FROM public.cv_uploads 
  WHERE extracted_json->>'email_address' IS NOT NULL
)
DELETE FROM public.cv_uploads 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Also remove any candidates with duplicate names and null/empty emails (edge case)
WITH name_duplicates AS (
  SELECT id,
         extracted_json->>'candidate_name' as name,
         ROW_NUMBER() OVER (PARTITION BY extracted_json->>'candidate_name' ORDER BY uploaded_at DESC) as rn
  FROM public.cv_uploads 
  WHERE (extracted_json->>'email_address' IS NULL OR extracted_json->>'email_address' = '')
    AND extracted_json->>'candidate_name' IS NOT NULL
)
DELETE FROM public.cv_uploads 
WHERE id IN (
  SELECT id FROM name_duplicates WHERE rn > 1
);