import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Static fallback videos
import video1 from "@/assets/video-depoimento-1.mp4";
import video2 from "@/assets/video-depoimento-2.mp4";
import video3 from "@/assets/video-depoimento-3.mp4";

export interface VideoTestimonial {
  id: string;
  title: string | null;
  video_url: string | null;
  video_type: "upload" | "instagram";
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const fallbackVideos: VideoTestimonial[] = [
  {
    id: "fallback-1",
    title: "Depoimento 1",
    video_url: video1,
    video_type: "upload",
    display_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    title: "Depoimento 2",
    video_url: video2,
    video_type: "upload",
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    title: "Depoimento 3",
    video_url: video3,
    video_type: "upload",
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

async function fetchVideoTestimonials(): Promise<VideoTestimonial[]> {
  const { data, error } = await supabase
    .from("video_testimonials")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching video testimonials:", error);
    return fallbackVideos;
  }

  return data && data.length > 0 ? (data as VideoTestimonial[]) : fallbackVideos;
}

export function useVideoTestimonials() {
  return useQuery({
    queryKey: ["video-testimonials"],
    queryFn: fetchVideoTestimonials,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    placeholderData: fallbackVideos,
  });
}
