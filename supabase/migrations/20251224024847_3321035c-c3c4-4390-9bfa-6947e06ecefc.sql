-- Add shipping cost column to quotes and orders tables
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS shipping numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping numeric DEFAULT 0;