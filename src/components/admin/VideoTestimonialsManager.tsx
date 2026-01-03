import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Save, Trash2, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import VideoUpload from "./VideoUpload";

interface VideoTestimonial {
  id: string;
  title: string | null;
  video_url: string | null;
  video_type: "upload" | "instagram";
  display_order: number;
  is_active: boolean;
}

const VideoTestimonialsManager = () => {
  const [videos, setVideos] = useState<VideoTestimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoTestimonial | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    video_url: "",
    video_type: "upload" as "upload" | "instagram",
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }
    return {
      "Authorization": `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchVideos = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-video-testimonials`,
        { 
          method: "GET",
          headers,
        }
      );
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Sem permissão para acessar vídeos");
          return;
        }
        throw new Error("Failed to fetch videos");
      }
      
      const data = await response.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Erro ao carregar vídeos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVideo = (video: VideoTestimonial) => {
    setSelectedVideo(video);
    setFormData({
      title: video.title || "",
      video_url: video.video_url || "",
      video_type: video.video_type,
      display_order: video.display_order,
      is_active: video.is_active,
    });
    setIsEditing(true);
  };

  const handleNewVideo = () => {
    setSelectedVideo(null);
    setFormData({
      title: "",
      video_url: "",
      video_type: "upload",
      display_order: videos.length,
      is_active: true,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.video_url) {
      toast.error("Adicione um vídeo antes de salvar");
      return;
    }

    setIsSaving(true);
    try {
      const headers = await getAuthHeaders();
      const method = selectedVideo ? "PUT" : "POST";
      const body = selectedVideo
        ? { id: selectedVideo.id, ...formData }
        : formData;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-video-testimonials`,
        {
          method,
          headers,
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Sem permissão para salvar vídeo");
          return;
        }
        throw new Error("Failed to save");
      }

      toast.success(selectedVideo ? "Vídeo atualizado!" : "Vídeo adicionado!");
      fetchVideos();
      setIsEditing(false);
      setSelectedVideo(null);
    } catch (error) {
      console.error("Error saving video:", error);
      toast.error("Erro ao salvar vídeo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este vídeo?")) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-video-testimonials?id=${id}`,
        { 
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("Sem permissão para excluir vídeo");
          return;
        }
        throw new Error("Failed to delete");
      }

      toast.success("Vídeo excluído!");
      fetchVideos();
      if (selectedVideo?.id === id) {
        setIsEditing(false);
        setSelectedVideo(null);
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Erro ao excluir vídeo");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Video List */}
      <div className="lg:col-span-1">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Vídeos</h2>
            <Button size="sm" onClick={handleNewVideo}>
              <Plus className="w-4 h-4 mr-1" />
              Novo
            </Button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {videos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum vídeo cadastrado
              </p>
            ) : (
              videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleSelectVideo(video)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedVideo?.id === video.id
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/50 hover:bg-muted"
                  } border`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-primary flex-shrink-0" />
                        <p className="font-medium text-sm text-foreground truncate">
                          {video.title || "Sem título"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {video.video_type === "instagram" ? "Instagram" : "Upload"} •{" "}
                        {video.is_active ? "Ativo" : "Inativo"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(video.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="lg:col-span-2">
        {isEditing ? (
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-6">
              {selectedVideo ? "Editar Vídeo" : "Novo Vídeo"}
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título (opcional)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Depoimento Cliente X"
                />
              </div>

              <VideoUpload
                value={formData.video_url}
                videoType={formData.video_type}
                onChange={(url, type) =>
                  setFormData({ ...formData, video_url: url, video_type: type })
                }
              />

              <div className="space-y-2">
                <Label htmlFor="display_order">Ordem de Exibição</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="is_active">Ativo (visível no site)</Label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedVideo(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
            <Video className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Selecione um vídeo para editar ou clique em "Novo" para adicionar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoTestimonialsManager;
