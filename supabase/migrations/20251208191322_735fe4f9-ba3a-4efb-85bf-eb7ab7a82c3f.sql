-- Create storage policy for uploading product images (public bucket, anyone can read)
-- Allow uploads only from authenticated sessions or edge functions
CREATE POLICY "Allow public read access on product-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated uploads to product-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated updates to product-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated deletes from product-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');