-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create a PERMISSIVE policy (default behavior allows access)
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);