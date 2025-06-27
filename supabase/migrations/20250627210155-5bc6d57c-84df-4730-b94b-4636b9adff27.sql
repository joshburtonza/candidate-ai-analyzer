
-- Make joshuaburton096@gmail.com the only admin
UPDATE public.profiles 
SET is_admin = false 
WHERE email != 'joshuaburton096@gmail.com';

UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'joshuaburton096@gmail.com';

-- Create a security function to check if user is specifically you
CREATE OR REPLACE FUNCTION public.is_joshua_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND email = 'joshuaburton096@gmail.com' 
    AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
