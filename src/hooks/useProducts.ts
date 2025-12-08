import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as staticProducts, Product, categories } from "@/components/catalog/catalogData";

// Map database product to frontend Product interface
const mapDbProduct = (dbProduct: any): Product => ({
  id: dbProduct.id,
  name: dbProduct.name,
  size: dbProduct.size,
  image: dbProduct.image_url || "",
  category: dbProduct.category,
  isKit: dbProduct.is_kit || false,
  kitDescription: dbProduct.kit_description || undefined,
  availableQuantities: dbProduct.available_quantities || undefined,
  customSpecs: dbProduct.custom_specs || undefined,
  prices: {
    qty100: dbProduct.price_qty100 || 0,
    qty250: dbProduct.price_qty250 || 0,
    qty500: dbProduct.price_qty500 || 0,
    qty1000: dbProduct.price_qty1000 || 0,
  },
});

// Fetch products from database
const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching products:", error);
    throw error;
  }

  // If no products in DB, return static products
  if (!data || data.length === 0) {
    return staticProducts;
  }

  return data.map(mapDbProduct);
};

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    placeholderData: staticProducts, // Use static products while loading
  });
};

export { categories };
export type { Product };
