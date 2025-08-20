-- Fix the get_user_org_id function to handle users in multiple organizations
-- It should return the first/primary organization for the user
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = auth.uid() 
  ORDER BY created_at ASC 
  LIMIT 1;
$$;