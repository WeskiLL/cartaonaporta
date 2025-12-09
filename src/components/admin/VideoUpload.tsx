import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Video, Link, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoUploadProps {
  value: string;
  videoType: "upload" | "instagram";
  onChange: (url: string, type: "upload" | "instagram") => void;
}

const VideoUpload = ({ value, videoType, onChange }: VideoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<"upload" | "link">(
    videoType === "instagram" ? "link" : "upload"
  );
  const [linkInput, setLinkInput] = useState(videoType === "instagram" ? value : "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Por favor, selecione um arquivo de vídeo");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("O vídeo deve ter no máximo 50MB");
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("video-testimonials")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("video-testimonials")
        .getPublicUrl(data.path);

      onChange(publicUrlData.publicUrl, "upload");
      toast.success("Vídeo enviado com sucesso!");
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Erro ao enviar vídeo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleLinkSave = () => {
    if (!linkInput.trim()) {
      toast.error("Por favor, insira um link válido");
      return;
    }
    onChange(linkInput.trim(), "instagram");
    toast.success("Link salvo!");
  };

  const handleRemove = () => {
    onChange("", "upload");
    setLinkInput("");
  };

  return (
    <div className="space-y-4">
      <Label>Vídeo do Depoimento</Label>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={uploadMode === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMode("upload")}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
        <Button
          type="button"
          variant={uploadMode === "link" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMode("link")}
        >
          <Link className="w-4 h-4 mr-2" />
          Link (Instagram)
        </Button>
      </div>

      {uploadMode === "upload" ? (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Vídeo
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: MP4, WebM, MOV. Máximo 50MB.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            placeholder="Cole o link do vídeo do Instagram"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
          />
          <Button type="button" onClick={handleLinkSave} size="sm">
            Salvar Link
          </Button>
          <p className="text-xs text-muted-foreground">
            Cole o link direto do vídeo (não o link do post).
          </p>
        </div>
      )}

      {/* Preview */}
      {value && videoType === "upload" && (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <video
            src={value}
            className="w-full h-48 object-cover"
            muted
            playsInline
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {value && videoType === "instagram" && (
        <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Video className="w-4 h-4 text-primary" />
            <span className="truncate max-w-[200px]">{value}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
