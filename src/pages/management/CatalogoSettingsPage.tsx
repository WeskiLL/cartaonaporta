import { useState, useEffect, useMemo, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutTemplate,
  FileText,
  GripVertical,
  Save,
  Loader2,
  BarChart3,
  Tag,
  Eye,
  MousePointerClick,
  TrendingUp,
  Calendar,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ManagementLayout } from "@/components/management/ManagementLayout";
import { PageHeader } from "@/components/management/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Json } from "@/integrations/supabase/types";

interface Product {
  id: string;
  name: string;
  category: string;
  display_order: number;
}

interface CatalogSettings {
  header: {
    background_color: string;
    show_logos: boolean;
    custom_image_url?: string;
  };
  footer: {
    show_customization_notice: boolean;
    show_cut_warning: boolean;
    show_whatsapp_cta: boolean;
  };
  category_names: {
    tags: string;
    kits: string;
    cartoes: string;
    adesivos: string;
    outros: string;
  };
  display: {
    view_mode: "list" | "cards";
  };
}

interface MetricData {
  date: string;
  visits: number;
  whatsapp_clicks: number;
}

const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
  tags: "Tags",
  kits: "Kits",
  cartoes: "Cartões",
  adesivos: "Adesivos",
  outros: "Outros",
};

const PERIOD_OPTIONS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "14", label: "Últimos 14 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

export default function CatalogoSettingsPage() {
  const [activeTab, setActiveTab] = useState("capa");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<CatalogSettings>({
    header: { background_color: "#e85616", show_logos: true, custom_image_url: "" },
    footer: { show_customization_notice: true, show_cut_warning: true, show_whatsapp_cta: true },
    category_names: { tags: "", kits: "", cartoes: "", adesivos: "", outros: "" },
    display: { view_mode: "list" },
  });
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [metricsPeriod, setMetricsPeriod] = useState("7");
  const [metricsLoading, setMetricsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "metricas") {
      fetchMetrics();
    }
  }, [activeTab, metricsPeriod]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("catalog_settings")
        .select("*");

      if (settingsError) throw settingsError;

      const newSettings = { ...settings };
      settingsData?.forEach((item) => {
        if (item.setting_key === "header") {
          newSettings.header = item.setting_value as CatalogSettings["header"];
        } else if (item.setting_key === "footer") {
          newSettings.footer = item.setting_value as CatalogSettings["footer"];
        } else if (item.setting_key === "category_names") {
          newSettings.category_names = item.setting_value as CatalogSettings["category_names"];
        } else if (item.setting_key === "display") {
          newSettings.display = item.setting_value as CatalogSettings["display"];
        }
      });
      setSettings(newSettings);

      // Fetch products for ordering
      const { supabase: sbClient } = await import("@/integrations/supabase/client");
      const { data: { session } } = await sbClient.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-products`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.access_token || ""}`,
            "Content-Type": "application/json",
          },
        }
      );

      const productsData = await response.json();
      if (Array.isArray(productsData)) {
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const days = parseInt(metricsPeriod);
      const startDate = startOfDay(subDays(new Date(), days - 1));
      const endDate = endOfDay(new Date());

      const { data, error } = await supabase
        .from("catalog_metrics")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;

      // Group by date
      const groupedData: Record<string, { visits: number; whatsapp_clicks: number }> = {};
      
      // Initialize all dates
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
        groupedData[date] = { visits: 0, whatsapp_clicks: 0 };
      }

      // Count events
      data?.forEach((event) => {
        const date = format(new Date(event.created_at), "yyyy-MM-dd");
        if (groupedData[date]) {
          if (event.event_type === "visit") {
            groupedData[date].visits++;
          } else if (event.event_type === "whatsapp_click") {
            groupedData[date].whatsapp_clicks++;
          }
        }
      });

      const metricsArray = Object.entries(groupedData).map(([date, values]) => ({
        date: format(new Date(date), "dd/MM", { locale: ptBR }),
        visits: values.visits,
        whatsapp_clicks: values.whatsapp_clicks,
      }));

      setMetrics(metricsArray);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast.error("Erro ao carregar métricas");
    } finally {
      setMetricsLoading(false);
    }
  };

  const saveSetting = async (key: string, value: Json) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("catalog_settings")
        .update({ setting_value: value })
        .eq("setting_key", key);

      if (error) throw error;
      toast.success("Configuração salva!");
    } catch (error) {
      console.error("Error saving setting:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const newProducts = [...products];
    const [removed] = newProducts.splice(sourceIndex, 1);
    newProducts.splice(destIndex, 0, removed);

    setProducts(newProducts);

    const orders = newProducts.map((p, i) => ({
      id: p.id,
      display_order: i,
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-products`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
          body: JSON.stringify({ orders }),
        }
      );

      if (!response.ok) throw new Error("Failed to update order");
      toast.success("Ordem atualizada!");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erro ao atualizar ordem");
      fetchData();
    }
  };

  const totalMetrics = useMemo(() => {
    return metrics.reduce(
      (acc, m) => ({
        visits: acc.visits + m.visits,
        whatsapp_clicks: acc.whatsapp_clicks + m.whatsapp_clicks,
      }),
      { visits: 0, whatsapp_clicks: 0 }
    );
  }, [metrics]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `catalog-header-${Date.now()}.${fileExt}`;
      const filePath = `catalog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setSettings({
        ...settings,
        header: { ...settings.header, custom_image_url: publicUrl },
      });

      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setSettings({
      ...settings,
      header: { ...settings.header, custom_image_url: "" },
    });
  };

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando...</span>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <PageHeader
        title="Configurações do Catálogo"
        description="Personalize a aparência e acompanhe as métricas do catálogo"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 flex-wrap h-auto gap-1">
          <TabsTrigger value="capa" className="gap-2">
            <LayoutTemplate className="w-4 h-4" />
            Capa
          </TabsTrigger>
          <TabsTrigger value="visualizacao" className="gap-2">
            <Eye className="w-4 h-4" />
            Visualização
          </TabsTrigger>
          <TabsTrigger value="rodape" className="gap-2">
            <FileText className="w-4 h-4" />
            Rodapé
          </TabsTrigger>
          <TabsTrigger value="ordem" className="gap-2">
            <GripVertical className="w-4 h-4" />
            Ordem dos Produtos
          </TabsTrigger>
          <TabsTrigger value="metricas" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="categorias" className="gap-2">
            <Tag className="w-4 h-4" />
            Categorias
          </TabsTrigger>
        </TabsList>

        {/* Header/Capa Tab */}
        <TabsContent value="capa">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Capa</CardTitle>
              <CardDescription>
                Personalize o cabeçalho do catálogo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bg-color">Cor de Fundo</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="bg-color"
                    type="color"
                    value={settings.header.background_color}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        header: { ...settings.header, background_color: e.target.value },
                      })
                    }
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={settings.header.background_color}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        header: { ...settings.header, background_color: e.target.value },
                      })
                    }
                    className="flex-1"
                    placeholder="#e85616"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="show-logos"
                  checked={settings.header.show_logos}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      header: { ...settings.header, show_logos: e.target.checked },
                    })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="show-logos">Exibir logos no cabeçalho</Label>
              </div>

              {/* Custom Image Upload */}
              <div className="space-y-3">
                <Label>Imagem Customizada do Header</Label>
                <p className="text-sm text-muted-foreground">
                  Faça upload de uma imagem para substituir o fundo de cor sólida
                </p>
                
                {settings.header.custom_image_url ? (
                  <div className="relative inline-block">
                    <img
                      src={settings.header.custom_image_url}
                      alt="Header customizado"
                      className="max-w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Enviando...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Clique para enviar uma imagem
                        </span>
                        <span className="text-xs text-muted-foreground">
                          PNG, JPG ou WEBP (máx. 5MB)
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <Button
                onClick={() => saveSetting("header", settings.header)}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Mode Tab */}
        <TabsContent value="visualizacao">
          <Card>
            <CardHeader>
              <CardTitle>Modo de Visualização</CardTitle>
              <CardDescription>
                Escolha como os produtos serão exibidos no catálogo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* List Mode Option */}
                <div
                  onClick={() =>
                    setSettings({
                      ...settings,
                      display: { ...settings.display, view_mode: "list" },
                    })
                  }
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50 ${
                    settings.display.view_mode === "list"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      settings.display.view_mode === "list" ? "bg-primary text-white" : "bg-muted"
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Lista</h4>
                      <p className="text-xs text-muted-foreground">Visualização compacta em linhas</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-8 bg-muted rounded flex items-center gap-2 px-2">
                      <div className="w-6 h-6 bg-muted-foreground/20 rounded" />
                      <div className="flex-1 h-3 bg-muted-foreground/20 rounded" />
                    </div>
                    <div className="h-8 bg-muted rounded flex items-center gap-2 px-2">
                      <div className="w-6 h-6 bg-muted-foreground/20 rounded" />
                      <div className="flex-1 h-3 bg-muted-foreground/20 rounded" />
                    </div>
                  </div>
                </div>

                {/* Cards Mode Option */}
                <div
                  onClick={() =>
                    setSettings({
                      ...settings,
                      display: { ...settings.display, view_mode: "cards" },
                    })
                  }
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50 ${
                    settings.display.view_mode === "cards"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      settings.display.view_mode === "cards" ? "bg-primary text-white" : "bg-muted"
                    }`}>
                      <LayoutTemplate className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Cartões</h4>
                      <p className="text-xs text-muted-foreground">Destaque para imagens dos produtos</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted rounded p-1.5">
                      <div className="w-full aspect-square bg-muted-foreground/20 rounded mb-1" />
                      <div className="h-2 bg-muted-foreground/20 rounded w-3/4" />
                    </div>
                    <div className="bg-muted rounded p-1.5">
                      <div className="w-full aspect-square bg-muted-foreground/20 rounded mb-1" />
                      <div className="h-2 bg-muted-foreground/20 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => saveSetting("display", settings.display)}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer/Rodapé Tab */}
        <TabsContent value="rodape">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Rodapé</CardTitle>
              <CardDescription>
                Personalize as seções exibidas no final do catálogo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="show-customization"
                  checked={settings.footer.show_customization_notice}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, show_customization_notice: e.target.checked },
                    })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="show-customization">Exibir aviso de personalização</Label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="show-cut-warning"
                  checked={settings.footer.show_cut_warning}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, show_cut_warning: e.target.checked },
                    })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="show-cut-warning">Exibir aviso sobre cortes fixos</Label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="show-whatsapp-cta"
                  checked={settings.footer.show_whatsapp_cta}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, show_whatsapp_cta: e.target.checked },
                    })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="show-whatsapp-cta">Exibir CTA do WhatsApp</Label>
              </div>

              <Button
                onClick={() => saveSetting("footer", settings.footer)}
                disabled={isSaving}
                className="mt-4"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Order Tab */}
        <TabsContent value="ordem">
          <Card>
            <CardHeader>
              <CardTitle>Ordem dos Produtos</CardTitle>
              <CardDescription>
                Arraste e solte para reorganizar os produtos no catálogo (por categoria)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(DEFAULT_CATEGORY_LABELS).map(([categoryKey, categoryLabel]) => {
                const categoryProducts = products.filter(p => p.category === categoryKey);
                if (categoryProducts.length === 0) return null;

                return (
                  <div key={categoryKey}>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {categoryLabel}
                      <span className="text-xs font-normal text-muted-foreground">({categoryProducts.length})</span>
                    </h3>
                    <DragDropContext onDragEnd={(result) => {
                      if (!result.destination) return;
                      
                      const sourceIndex = result.source.index;
                      const destIndex = result.destination.index;
                      
                      if (sourceIndex === destIndex) return;
                      
                      // Get the global indices
                      const globalSourceIndex = products.findIndex(p => p.id === categoryProducts[sourceIndex].id);
                      const globalDestIndex = products.findIndex(p => p.id === categoryProducts[destIndex].id);
                      
                      const newProducts = [...products];
                      const [removed] = newProducts.splice(globalSourceIndex, 1);
                      newProducts.splice(globalDestIndex, 0, removed);
                      
                      setProducts(newProducts);
                      
                      const orders = newProducts.map((p, i) => ({
                        id: p.id,
                        display_order: i,
                      }));
                      
                      (async () => {
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          
                          const response = await fetch(
                            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-products`,
                            {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${session?.access_token || ""}`,
                              },
                              body: JSON.stringify({ orders }),
                            }
                          );
                          
                          if (!response.ok) throw new Error("Failed to update order");
                          toast.success("Ordem atualizada!");
                        } catch (error) {
                          console.error("Error updating order:", error);
                          toast.error("Erro ao atualizar ordem");
                          fetchData();
                        }
                      })();
                    }}>
                      <Droppable droppableId={`products-order-${categoryKey}`}>
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                          >
                            {categoryProducts.map((product, index) => (
                              <Draggable key={product.id} draggableId={product.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`p-3 rounded-lg border transition-all flex items-center gap-3 ${
                                      snapshot.isDragging
                                        ? "bg-primary/10 border-primary"
                                        : "bg-muted/50 hover:bg-muted border-border"
                                    }`}
                                  >
                                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                                    <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                                    <span className="font-medium text-foreground flex-1">{product.name}</span>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metricas">
          <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <Select value={metricsPeriod} onValueChange={setMetricsPeriod}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <Eye className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Visitas</p>
                      <p className="text-2xl font-bold text-foreground">{totalMetrics.visits}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <MousePointerClick className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cliques WhatsApp</p>
                      <p className="text-2xl font-bold text-foreground">{totalMetrics.whatsapp_clicks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <TrendingUp className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                      <p className="text-2xl font-bold text-foreground">
                        {totalMetrics.visits > 0
                          ? ((totalMetrics.whatsapp_clicks / totalMetrics.visits) * 100).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Visitas e Cliques</CardTitle>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="visits"
                        name="Visitas"
                        stroke="hsl(220 70% 50%)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="whatsapp_clicks"
                        name="Cliques WhatsApp"
                        stroke="hsl(142 70% 45%)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Category Names Tab */}
        <TabsContent value="categorias">
          <Card>
            <CardHeader>
              <CardTitle>Nomes das Categorias</CardTitle>
              <CardDescription>
                Personalize os nomes exibidos nas abas do catálogo. Deixe em branco para usar o padrão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(DEFAULT_CATEGORY_LABELS).map(([key, defaultLabel]) => (
                <div key={key} className="grid md:grid-cols-2 gap-4 items-center">
                  <div>
                    <Label htmlFor={`cat-${key}`} className="text-muted-foreground">
                      {defaultLabel} (padrão)
                    </Label>
                  </div>
                  <Input
                    id={`cat-${key}`}
                    value={settings.category_names[key as keyof typeof settings.category_names] || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        category_names: { ...settings.category_names, [key]: e.target.value },
                      })
                    }
                    placeholder={`Deixe vazio para "${defaultLabel}"`}
                  />
                </div>
              ))}

              <Button
                onClick={() => saveSetting("category_names", settings.category_names)}
                disabled={isSaving}
                className="mt-4"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ManagementLayout>
  );
}
