-- Drop the insecure policy
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

-- Create function to check if user is admin (using service role in edge function)
-- Products write operations will only be done through edge functions with service role
-- No direct client-side write access needed

-- Add policy for service role operations (edge functions use service role)
-- The edge functions already use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS