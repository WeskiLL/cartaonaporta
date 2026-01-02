import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CatalogSettings {
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

const DEFAULT_SETTINGS: CatalogSettings = {
  header: { background_color: "#e85616", show_logos: true, custom_image_url: "" },
  footer: { show_customization_notice: true, show_cut_warning: true, show_whatsapp_cta: true },
  category_names: { tags: "", kits: "", cartoes: "", adesivos: "", outros: "" },
  display: { view_mode: "list" },
};

const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
  tags: "Tags",
  kits: "Kits",
  cartoes: "Cartões",
  adesivos: "Adesivos",
  outros: "Outros",
};

export function useCatalogSettings() {
  const [settings, setSettings] = useState<CatalogSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("catalog_settings")
        .select("*");

      if (error) {
        console.error("Error fetching catalog settings:", error);
        return;
      }

      const newSettings = { ...DEFAULT_SETTINGS };
      data?.forEach((item) => {
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
    } catch (error) {
      console.error("Error fetching catalog settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryLabel = (categoryId: string): string => {
    const customName = settings.category_names[categoryId as keyof typeof settings.category_names];
    return customName || DEFAULT_CATEGORY_LABELS[categoryId] || categoryId;
  };

  const trackEvent = async (eventType: "visit" | "whatsapp_click", productId?: string) => {
    try {
      await supabase.from("catalog_metrics").insert({
        event_type: eventType,
        page_path: window.location.pathname,
        product_id: productId || null,
      });
    } catch (error) {
      console.error("Error tracking event:", error);
    }
  };

  return {
    settings,
    isLoading,
    getCategoryLabel,
    trackEvent,
  };
}
