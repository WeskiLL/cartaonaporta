-- Rename client_email to client_phone in order_trackings table
ALTER TABLE public.order_trackings RENAME COLUMN client_email TO client_phone;