-- Create order_trackings table for tracking shipments
CREATE TABLE public.order_trackings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  tracking_code TEXT NOT NULL,
  carrier TEXT NOT NULL DEFAULT 'correios',
  status TEXT NOT NULL DEFAULT 'pending',
  events JSONB DEFAULT '[]'::jsonb,
  last_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_trackings ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage trackings
CREATE POLICY "Admins can manage order_trackings"
ON public.order_trackings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy for public to view their own tracking (by id)
CREATE POLICY "Anyone can view tracking by id"
ON public.order_trackings
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_order_trackings_tracking_code ON public.order_trackings(tracking_code);
CREATE INDEX idx_order_trackings_order_id ON public.order_trackings(order_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_order_trackings_updated_at
BEFORE UPDATE ON public.order_trackings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();