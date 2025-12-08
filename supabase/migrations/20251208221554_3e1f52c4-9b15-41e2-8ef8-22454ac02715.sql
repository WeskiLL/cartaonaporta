-- Add new price columns for 200 and 2000 quantities
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_qty200 numeric DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_qty2000 numeric DEFAULT 0;