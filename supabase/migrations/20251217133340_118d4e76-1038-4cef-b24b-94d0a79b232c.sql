-- Fix RLS policies for clients table
-- Drop existing policy and create proper PERMISSIVE SELECT policy
DROP POLICY IF EXISTS "Admins and staff can manage clients" ON public.clients;

CREATE POLICY "Staff can view clients" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'vendedor'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Staff can insert clients" 
ON public.clients 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'vendedor'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Staff can update clients" 
ON public.clients 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'vendedor'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Staff can delete clients" 
ON public.clients 
FOR DELETE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'vendedor'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- Fix RLS policies for company table
DROP POLICY IF EXISTS "Admins and staff can manage company" ON public.company;

CREATE POLICY "Staff can view company" 
ON public.company 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'vendedor'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Staff can insert company" 
ON public.company 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'vendedor'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Staff can update company" 
ON public.company 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'vendedor'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Staff can delete company" 
ON public.company 
FOR DELETE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'vendedor'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- Fix RLS policies for management_products table
DROP POLICY IF EXISTS "Admins and staff can manage management_products" ON public.management_products;

CREATE POLICY "Staff can view management_products" 
ON public.management_products 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'vendedor'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Staff can insert management_products" 
ON public.management_products 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'vendedor'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Staff can update management_products" 
ON public.management_products 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'vendedor'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Staff can delete management_products" 
ON public.management_products 
FOR DELETE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'vendedor'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);