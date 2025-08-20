-- Fix Organizations RLS policies (drop and recreate with correct logic)
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

-- Create correct organization policies using security definer functions
CREATE POLICY "Users can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (public.is_organization_member(id));

CREATE POLICY "Users can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (public.is_organization_manager(id));

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Create atomic RPC to create organization + membership simultaneously
CREATE OR REPLACE FUNCTION public.create_organization_with_membership(
  _name text,
  _slug text,
  _role public.app_role
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Insert the organization
  INSERT INTO public.organizations (name, slug)
  VALUES (_name, _slug)
  RETURNING id INTO new_org_id;
  
  -- Insert the membership
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, auth.uid(), _role);
  
  RETURN new_org_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_organization_with_membership(text, text, public.app_role) TO authenticated;