-- Add email column to user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS email text;

-- Update existing users with their emails (will be done via edge function)