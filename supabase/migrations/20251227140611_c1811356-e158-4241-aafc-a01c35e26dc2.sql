-- Drop the existing foreign key constraint that references management_products
ALTER TABLE public.quote_items 
DROP CONSTRAINT IF EXISTS quote_items_product_id_fkey;

-- Add new foreign key constraint that references the products table
ALTER TABLE public.quote_items 
ADD CONSTRAINT quote_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;