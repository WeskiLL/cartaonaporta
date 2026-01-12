-- Add estimated_delivery column to order_trackings table
ALTER TABLE public.order_trackings 
ADD COLUMN estimated_delivery date;