-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view tracking by id" ON public.order_trackings;

-- The "Admins and staff can manage order_trackings" policy remains intact
-- Public tracking lookup is now handled by the secure edge function