-- Table for catalog settings (cover, footer, category names)
CREATE TABLE public.catalog_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalog_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings (needed for public catalog)
CREATE POLICY "Anyone can view catalog_settings"
ON public.catalog_settings FOR SELECT
USING (true);

-- Only staff can manage settings
CREATE POLICY "Staff can manage catalog_settings"
ON public.catalog_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'vendedor'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'vendedor'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

-- Table for catalog metrics (visits and WhatsApp clicks)
CREATE TABLE public.catalog_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('visit', 'whatsapp_click')),
  page_path text,
  product_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalog_metrics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert metrics (needed for anonymous tracking)
CREATE POLICY "Anyone can insert catalog_metrics"
ON public.catalog_metrics FOR INSERT
WITH CHECK (true);

-- Only staff can view metrics
CREATE POLICY "Staff can view catalog_metrics"
ON public.catalog_metrics FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'vendedor'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

-- Create trigger for updated_at on catalog_settings
CREATE TRIGGER update_catalog_settings_updated_at
BEFORE UPDATE ON public.catalog_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.catalog_settings (setting_key, setting_value) VALUES
  ('header', '{"background_color": "#e85616", "show_logos": true}'),
  ('footer', '{"show_customization_notice": true, "show_cut_warning": true, "show_whatsapp_cta": true}'),
  ('category_names', '{"tags": "", "kits": "", "cartoes": "", "adesivos": "", "outros": ""}')