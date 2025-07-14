-- Remove duplicate candidates, keeping only the most recent one for each email
WITH duplicates AS (
  SELECT id,
         email,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM public.resumes 
  WHERE email IS NOT NULL
)
DELETE FROM public.resumes 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Also remove any candidates with duplicate names and null emails (edge case)
WITH name_duplicates AS (
  SELECT id,
         name,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
  FROM public.resumes 
  WHERE email IS NULL
)
DELETE FROM public.resumes 
WHERE id IN (
  SELECT id FROM name_duplicates WHERE rn > 1
);