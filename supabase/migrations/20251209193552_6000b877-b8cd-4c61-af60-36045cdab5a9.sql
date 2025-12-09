-- Create table for video testimonials
CREATE TABLE public.video_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  video_url TEXT,
  video_type TEXT NOT NULL DEFAULT 'upload' CHECK (video_type IN ('upload', 'instagram')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_testimonials ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active testimonials
CREATE POLICY "Anyone can view active video testimonials"
ON public.video_testimonials
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_video_testimonials_updated_at
BEFORE UPDATE ON public.video_testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for video testimonials
INSERT INTO storage.buckets (id, name, public) VALUES ('video-testimonials', 'video-testimonials', true);

-- Storage policies for video testimonials bucket
CREATE POLICY "Anyone can view video testimonials"
ON storage.objects
FOR SELECT
USING (bucket_id = 'video-testimonials');

CREATE POLICY "Authenticated users can upload video testimonials"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'video-testimonials' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update video testimonials"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'video-testimonials' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete video testimonials"
ON storage.objects
FOR DELETE
USING (bucket_id = 'video-testimonials' AND auth.role() = 'authenticated');