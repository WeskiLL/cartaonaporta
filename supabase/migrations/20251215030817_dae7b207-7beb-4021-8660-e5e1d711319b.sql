-- Update RLS policies to allow admin, vendedor and financeiro to manage core management tables

-- Clients
DROP POLICY IF EXISTS "Admins can manage clients" ON public.clients;
CREATE POLICY "Admins and staff can manage clients"
ON public.clients
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
);

-- Company
DROP POLICY IF EXISTS "Admins can manage company" ON public.company;
CREATE POLICY "Admins and staff can manage company"
ON public.company
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
);

-- Management products (legacy, kept for safety)
DROP POLICY IF EXISTS "Admins can manage management_products" ON public.management_products;
CREATE POLICY "Admins and staff can manage management_products"
ON public.management_products
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
);

-- Mockups
DROP POLICY IF EXISTS "Admins can manage mockups" ON public.mockups;
CREATE POLICY "Admins and staff can manage mockups"
ON public.mockups
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
);

-- Order trackings (keep public view policy, only update management policy)
DROP POLICY IF EXISTS "Admins can manage order_trackings" ON public.order_trackings;
CREATE POLICY "Admins and staff can manage order_trackings"
ON public.order_trackings
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
);

-- Orders
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins and staff can manage orders"
ON public.orders
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
);

-- Quote items
DROP POLICY IF EXISTS "Admins can manage quote_items" ON public.quote_items;
CREATE POLICY "Admins and staff can manage quote_items"
ON public.quote_items
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
);

-- Quotes
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.quotes;
CREATE POLICY "Admins and staff can manage quotes"
ON public.quotes
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
);

-- Transactions
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
CREATE POLICY "Admins and staff can manage transactions"
ON public.transactions
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'vendedor')
  OR has_role(auth.uid(), 'financeiro')
);

-- Update user_roles policies to handle new roles
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to view all user roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view roles"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin')
);