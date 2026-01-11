-- Create table to track login attempts for brute force protection
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);

-- Create index for faster lookups
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts (email, attempted_at DESC);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for tracking failed attempts before auth)
CREATE POLICY "Anyone can insert login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);

-- Policy: Only staff can view login attempts
CREATE POLICY "Staff can view login attempts"
ON public.login_attempts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Policy: Only admins can delete old attempts
CREATE POLICY "Admins can delete login attempts"
ON public.login_attempts
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Function to check if login is blocked (more than 10 attempts in last 2 hours)
CREATE OR REPLACE FUNCTION public.is_login_blocked(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) >= 10
  FROM public.login_attempts
  WHERE email = lower(check_email)
    AND success = false
    AND attempted_at > now() - interval '2 hours'
$$;

-- Function to get remaining attempts
CREATE OR REPLACE FUNCTION public.get_remaining_login_attempts(check_email text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, 10 - COUNT(*)::integer)
  FROM public.login_attempts
  WHERE email = lower(check_email)
    AND success = false
    AND attempted_at > now() - interval '2 hours'
$$;

-- Function to get time until unblock (in minutes)
CREATE OR REPLACE FUNCTION public.get_unblock_time_minutes(check_email text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    EXTRACT(EPOCH FROM (
      (SELECT MIN(attempted_at) FROM public.login_attempts 
       WHERE email = lower(check_email) 
         AND success = false 
         AND attempted_at > now() - interval '2 hours')
      + interval '2 hours' - now()
    ))::integer / 60,
    0
  )
$$;