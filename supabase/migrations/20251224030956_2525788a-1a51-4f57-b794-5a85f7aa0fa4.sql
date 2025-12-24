-- Fix storage policies to restrict uploads to staff roles only

-- Drop existing overly permissive policies for product-images bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

-- Drop existing overly permissive policies for video-testimonials bucket
DROP POLICY IF EXISTS "Authenticated users can upload video testimonials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update video testimonials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete video testimonials" ON storage.objects;

-- Create new staff-only policies for product-images bucket
CREATE POLICY "Staff can upload to product-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  (public.has_role(auth.uid(), 'admin') OR 
   public.has_role(auth.uid(), 'vendedor') OR 
   public.has_role(auth.uid(), 'financeiro'))
);

CREATE POLICY "Staff can update product-images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  (public.has_role(auth.uid(), 'admin') OR 
   public.has_role(auth.uid(), 'vendedor') OR 
   public.has_role(auth.uid(), 'financeiro'))
);

CREATE POLICY "Staff can delete from product-images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  (public.has_role(auth.uid(), 'admin') OR 
   public.has_role(auth.uid(), 'vendedor') OR 
   public.has_role(auth.uid(), 'financeiro'))
);

-- Create new staff-only policies for video-testimonials bucket
CREATE POLICY "Staff can upload video testimonials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'video-testimonials' AND
  (public.has_role(auth.uid(), 'admin') OR 
   public.has_role(auth.uid(), 'vendedor') OR 
   public.has_role(auth.uid(), 'financeiro'))
);

CREATE POLICY "Staff can update video testimonials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'video-testimonials' AND
  (public.has_role(auth.uid(), 'admin') OR 
   public.has_role(auth.uid(), 'vendedor') OR 
   public.has_role(auth.uid(), 'financeiro'))
);

CREATE POLICY "Staff can delete video testimonials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'video-testimonials' AND
  (public.has_role(auth.uid(), 'admin') OR 
   public.has_role(auth.uid(), 'vendedor') OR 
   public.has_role(auth.uid(), 'financeiro'))
);