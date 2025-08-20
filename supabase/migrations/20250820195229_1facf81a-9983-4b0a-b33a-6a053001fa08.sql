
-- 1) Ensure organization exists
INSERT INTO public.organizations (name, slug)
SELECT 'SA Recruitment', 'sa-recruitment'
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations WHERE slug = 'sa-recruitment'
);

-- 2) Normalize target users and set their roles to 'recruiter'
WITH target_users AS (
  SELECT id, email
  FROM public.profiles
  WHERE lower(email) IN (lower('cv@sa-recruitment.com'), lower('info@sa-recruitment.com'))
),
org AS (
  SELECT id FROM public.organizations WHERE slug = 'sa-recruitment'
),
deleted_roles AS (
  DELETE FROM public.user_roles ur
  WHERE ur.user_id IN (SELECT id FROM target_users)
  RETURNING ur.user_id
),
insert_roles AS (
  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'recruiter'::public.app_role
  FROM target_users
  -- If a unique constraint exists, this avoids errors and we already deleted above
  ON CONFLICT DO NOTHING
  RETURNING user_id
)
-- 3) Add org membership as 'recruiter' (avoid duplicates)
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT (SELECT id FROM org), tu.id, 'recruiter'::public.app_role
FROM target_users tu
WHERE NOT EXISTS (
  SELECT 1
  FROM public.organization_members m
  WHERE m.organization_id = (SELECT id FROM org)
    AND m.user_id = tu.id
);
