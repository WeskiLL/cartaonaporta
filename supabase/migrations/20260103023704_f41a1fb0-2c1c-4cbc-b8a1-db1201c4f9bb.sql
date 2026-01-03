-- Remove the client_phone column from order_trackings table
ALTER TABLE public.order_trackings DROP COLUMN IF EXISTS client_phone;