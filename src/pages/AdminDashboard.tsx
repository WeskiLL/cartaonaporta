import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { LogOut, Plus, Save, Trash2, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";

interface Product {
  id: string;
  name: string;
  size: string;
  image_url: string | null;
  category: "tags" | "kits" | "cartoes" | "adesivos" | "outros";
  is_kit: boolean;
  kit_description: string | null;
  available_quantities: number[] | null;
  custom_specs: string[] | null;
  price_qty100: number;
  price_qty250: number;
  price_qty500: number;
  price_qty1000: number;
  display_order: number;
  is_active: boolean;
}

const CATEGORIES = [
  { value: "tags", label: "Tags" },
  { value: "kits", label: "Kits" },
  { value: "cartoes", label: "Cartões" },
  { value: "adesivos", label: "Adesivos" },
  { value: "outros", label: "Outros" },
];

const AdminDashboard = () => {
  const { isAuthenticated, username, logout, isLoading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    image_url: "",
    category: "tags" as Product["category"],
    is_kit: false,
    kit_description: "",
    available_quantities: "",
    custom_specs: "",
    price_qty100: 0,
    price_qty250: 0,
    price_qty500: 0,
    price_qty1000: 0,
    is_active: true,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch products
  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-products`,
        { method: "GET" }
      );
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      size: product.size,
      image_url: product.image_url || "",
      category: product.category,
      is_kit: product.is_kit,
      kit_description: product.kit_description || "",
      available_quantities: product.available_quantities?.join(", ") || "",
      custom_specs: product.custom_specs?.join(", ") || "",
      price_qty100: product.price_qty100,
      price_qty250: product.price_qty250,
      price_qty500: product.price_qty500,
      price_qty1000: product.price_qty1000,
      is_active: product.is_active,
    });
    setIsEditing(true);
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setFormData({
      name: "",
      size: "",
      image_url: "",
      category: "tags",
      is_kit: false,
      kit_description: "",
      available_quantities: "",
      custom_specs: "",
      price_qty100: 0,
      price_qty250: 0,
      price_qty500: 0,
      price_qty1000: 0,
      is_active: true,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const productData = {
        name: formData.name,
        size: formData.size,
        image_url: formData.image_url || null,
        category: formData.category,
        is_kit: formData.is_kit,
        kit_description: formData.kit_description || null,
        available_quantities: formData.available_quantities
          ? formData.available_quantities.split(",").map((n) => parseInt(n.trim())).filter(n => !isNaN(n))
          : null,
        custom_specs: formData.custom_specs
          ? formData.custom_specs.split(",").map((s) => s.trim()).filter(s => s)
          : null,
        price_qty100: formData.price_qty100,
        price_qty250: formData.price_qty250,
        price_qty500: formData.price_qty500,
        price_qty1000: formData.price_qty1000,
        is_active: formData.is_active,
      };

      const method = selectedProduct ? "PUT" : "POST";
      const body = selectedProduct
        ? { id: selectedProduct.id, ...productData }
        : productData;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-products`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      toast.success(selectedProduct ? "Produto atualizado!" : "Produto criado!");
      fetchProducts();
      setIsEditing(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Erro ao salvar produto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-products?id=${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      toast.success("Produto excluído!");
      fetchProducts();
      if (selectedProduct?.id === id) {
        setIsEditing(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Erro ao excluir produto");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-display font-bold text-foreground">
              Painel Administrativo
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Olá, <strong>{username}</strong>
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Product List */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Produtos</h2>
                <Button size="sm" onClick={handleNewProduct}>
                  <Plus className="w-4 h-4 mr-1" />
                  Novo
                </Button>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedProduct?.id === product.id
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/50 hover:bg-muted"
                    } border`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.category} • {product.size}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            {isEditing ? (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="font-semibold text-foreground mb-6">
                  {selectedProduct ? "Editar Produto" : "Novo Produto"}
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Produto</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Tag para brincos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Tamanho</Label>
                    <Input
                      id="size"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      placeholder="Ex: 4x5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: Product["category"]) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <ImageUpload
                      value={formData.image_url}
                      onChange={(url) => setFormData({ ...formData, image_url: url })}
                      productName={formData.name}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="custom_specs">
                      Especificações (separadas por vírgula)
                    </Label>
                    <Input
                      id="custom_specs"
                      value={formData.custom_specs}
                      onChange={(e) => setFormData({ ...formData, custom_specs: e.target.value })}
                      placeholder="Ex: Frente e Verso, Couchê 250g, Verniz Total"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="available_quantities">
                      Quantidades Disponíveis (separadas por vírgula, deixe vazio para padrão)
                    </Label>
                    <Input
                      id="available_quantities"
                      value={formData.available_quantities}
                      onChange={(e) =>
                        setFormData({ ...formData, available_quantities: e.target.value })
                      }
                      placeholder="Ex: 250, 500, 1000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price_qty100">Preço 100 un (R$)</Label>
                    <Input
                      id="price_qty100"
                      type="number"
                      step="0.01"
                      value={formData.price_qty100}
                      onChange={(e) =>
                        setFormData({ ...formData, price_qty100: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price_qty250">Preço 250 un (R$)</Label>
                    <Input
                      id="price_qty250"
                      type="number"
                      step="0.01"
                      value={formData.price_qty250}
                      onChange={(e) =>
                        setFormData({ ...formData, price_qty250: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price_qty500">Preço 500 un (R$)</Label>
                    <Input
                      id="price_qty500"
                      type="number"
                      step="0.01"
                      value={formData.price_qty500}
                      onChange={(e) =>
                        setFormData({ ...formData, price_qty500: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price_qty1000">Preço 1000 un (R$)</Label>
                    <Input
                      id="price_qty1000"
                      type="number"
                      step="0.01"
                      value={formData.price_qty1000}
                      onChange={(e) =>
                        setFormData({ ...formData, price_qty1000: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_kit"
                      checked={formData.is_kit}
                      onChange={(e) => setFormData({ ...formData, is_kit: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="is_kit">É um Kit</Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="is_active">Ativo (visível no catálogo)</Label>
                  </div>

                  {formData.is_kit && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="kit_description">Descrição do Kit</Label>
                      <Textarea
                        id="kit_description"
                        value={formData.kit_description}
                        onChange={(e) =>
                          setFormData({ ...formData, kit_description: e.target.value })
                        }
                        placeholder="Descreva o conteúdo do kit..."
                        rows={3}
                      />
                    </div>
                  )}
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
                      setSelectedProduct(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Selecione um produto para editar ou clique em "Novo" para adicionar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
