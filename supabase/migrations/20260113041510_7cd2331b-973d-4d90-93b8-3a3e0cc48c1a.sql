-- Create storage bucket for PDF exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-exports', 'pdf-exports', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read PDFs (they'll have unique generated names)
CREATE POLICY "Public can read PDFs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pdf-exports');

-- Allow authenticated users to upload PDFs
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'pdf-exports' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their PDFs
CREATE POLICY "Authenticated users can delete PDFs"
ON storage.objects
FOR DELETE
USING (bucket_id = 'pdf-exports' AND auth.role() = 'authenticated');