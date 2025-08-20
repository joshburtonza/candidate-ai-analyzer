-- Drop existing problematic policies
DROP POLICY IF EXISTS "Managers can manage organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their organization members" ON public.organization_members;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.is_organization_manager(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id 
    AND user_id = auth.uid() 
    AND role = 'manager'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_organization_member(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id 
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT organization_id 
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Create new policies using the security definer functions
CREATE POLICY "Managers can manage their organization members"
ON public.organization_members
FOR ALL
TO authenticated
USING (public.is_organization_manager(organization_id))
WITH CHECK (public.is_organization_manager(organization_id));

CREATE POLICY "Users can view their organization members"
ON public.organization_members  
FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id());