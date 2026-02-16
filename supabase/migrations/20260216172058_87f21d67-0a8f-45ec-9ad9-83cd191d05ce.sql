
CREATE TABLE public.counters (
  id text PRIMARY KEY,
  last_value integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage counters"
ON public.counters
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'vendedor'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'vendedor'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

-- Initialize with current max values from existing data
INSERT INTO public.counters (id, last_value)
SELECT 'ORC', COALESCE(MAX(NULLIF(regexp_replace(number, '[^0-9]', '', 'g'), '')::integer), 0)
FROM public.quotes;

INSERT INTO public.counters (id, last_value)
SELECT 'PED', COALESCE(MAX(NULLIF(regexp_replace(number, '[^0-9]', '', 'g'), '')::integer), 0)
FROM public.orders;
