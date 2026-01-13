-- Drop the overly permissive public SELECT policy on order_trackings
-- Public access is properly handled via the public-tracking-lookup edge function
-- Staff access remains protected via 'Admins and staff can manage order_trackings' policy
DROP POLICY IF EXISTS "Anyone can view tracking by id" ON public.order_trackings;