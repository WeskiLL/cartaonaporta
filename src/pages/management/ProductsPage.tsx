import { useEffect, useState } from 'react';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { PageHeader } from '@/components/management/PageHeader';
import { useManagement } from '@/contexts/ManagementContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Edit, Trash2, Loader2, Package, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { ManagementProduct } from '@/types/management';
import { maskCurrency, parseCurrencyToNumber } from '@/lib/masks';
import { Link } from 'react-router-dom';
import { ImageUploadField } from '@/components/management/ImageUploadField';

const categories = [
  { id: 'tags', label: 'Tags' },
  { id: 'kits', label: 'Kits' },
  { id: 'cartoes', label: 'Cartões' },
  { id: 'adesivos', label: 'Adesivos' },
  { id: 'outros', label: 'Outros' },
];

export default function ProductsPage() {
  const { products, loadingProducts, fetchProducts, addProduct, updateProduct, deleteProduct } = useManagement();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('tags');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ManagementProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    category: 'tags',
    is_active: true,
    price_qty100: '',
    price_qty200: '',
    price_qty250: '',
    price_qty500: '',
    price_qty1000: '',
    price_qty2000: '',
    kit_description: '',
    is_kit: false,
    image_url: '',
    available_quantities: '',
    custom_specs: '',
  });

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number | undefined | null) => 
    value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : '-';

  const getMainPrice = (product: ManagementProduct) => {
    return product.price_qty250 || product.price_qty100 || product.price_qty500 || product.price_qty1000 || 0;
  };

  const openNew = () => {
    setEditingProduct(null);
    setFormData({ 
      name: '', 
      size: '', 
      category: 'tags', 
      is_active: true,
      price_qty100: '',
      price_qty200: '',
      price_qty250: '',
      price_qty500: '',
      price_qty1000: '',
      price_qty2000: '',
      kit_description: '',
      is_kit: false,
      image_url: '',
      available_quantities: '',
      custom_specs: '',
    });
    setFormOpen(true);
  };

  const openEdit = (product: ManagementProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      size: product.size || '',
      category: product.category || 'tags',
      is_active: product.is_active ?? true,
      price_qty100: product.price_qty100 ? maskCurrency(product.price_qty100) : '',
      price_qty200: product.price_qty200 ? maskCurrency(product.price_qty200) : '',
      price_qty250: product.price_qty250 ? maskCurrency(product.price_qty250) : '',
      price_qty500: product.price_qty500 ? maskCurrency(product.price_qty500) : '',
      price_qty1000: product.price_qty1000 ? maskCurrency(product.price_qty1000) : '',
      price_qty2000: product.price_qty2000 ? maskCurrency(product.price_qty2000) : '',
      kit_description: product.kit_description || '',
      is_kit: product.is_kit ?? false,
      image_url: product.image_url || '',
      available_quantities: product.available_quantities?.join(', ') || '',
      custom_specs: product.custom_specs?.join(', ') || '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse available quantities
    const availableQuantities = formData.available_quantities
      ? formData.available_quantities.split(',').map(q => parseInt(q.trim())).filter(q => !isNaN(q))
      : null;
    
    // Parse custom specs
    const customSpecs = formData.custom_specs
      ? formData.custom_specs.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : null;
    
    const data: any = {
      name: formData.name,
      size: formData.size || '0x0',
      category: formData.category,
      is_active: formData.is_active,
      is_kit: formData.is_kit,
      kit_description: formData.kit_description || null,
      image_url: formData.image_url || null,
      price_qty100: parseCurrencyToNumber(formData.price_qty100) || 0,
      price_qty200: parseCurrencyToNumber(formData.price_qty200) || 0,
      price_qty250: parseCurrencyToNumber(formData.price_qty250) || 0,
      price_qty500: parseCurrencyToNumber(formData.price_qty500) || 0,
      price_qty1000: parseCurrencyToNumber(formData.price_qty1000) || 0,
      price_qty2000: parseCurrencyToNumber(formData.price_qty2000) || 0,
      available_quantities: availableQuantities,
      custom_specs: customSpecs,
    };

    if (editingProduct) {
      const success = await updateProduct(editingProduct.id, data);
      if (success) {
        toast.success('Produto atualizado!');
        setFormOpen(false);
        fetchProducts();
      }
    } else {
      const result = await addProduct(data);
      if (result) {
        toast.success('Produto adicionado!');
        setFormOpen(false);
        fetchProducts();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir este produto? Ele também será removido do catálogo.')) {
      const success = await deleteProduct(id);
      if (success) {
        toast.success('Produto excluído!');
        fetchProducts();
      }
    }
  };

  return (
    <ManagementLayout>
      <PageHeader
        title="Produtos"
        description="Produtos sincronizados com o catálogo do site"
        actions={
          <div className="flex gap-2">
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ir para Catálogo
              </Button>
            </Link>
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        }
      />

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loadingProducts ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 mb-6">
            {categories.map(cat => {
              const count = filteredProducts.filter(p => p.category === cat.id).length;
              return (
                <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5">
                  {cat.label}
                  <span className="text-xs text-muted-foreground">({count})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map(category => {
            const categoryProducts = filteredProducts.filter(p => p.category === category.id);

            return (
              <TabsContent key={category.id} value={category.id} className="mt-0">
                {categoryProducts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum produto nesta categoria</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryProducts.map(product => (
                      <Card key={product.id} className={!product.is_active ? 'opacity-60' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-3">
                              {product.image_url && (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <h3 className="font-semibold text-foreground">{product.name}</h3>
                                <div className="flex gap-2 items-center">
                                  {product.size && (
                                    <span className="text-xs text-muted-foreground">{product.size}cm</span>
                                  )}
                                  {!product.is_active && (
                                    <span className="text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">Inativo</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(product.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm mt-3">
                            <span className="text-muted-foreground">Preço (250un):</span>
                            <span className="font-medium text-primary">{formatCurrency(getMainPrice(product))}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* Product Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nome</Label>
              <Input
                id="product-name"
                name="product-name"
                autoComplete="off"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-size">Tamanho (cm)</Label>
                <Input
                  id="product-size"
                  name="product-size"
                  autoComplete="off"
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="Ex: 5x9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label htmlFor="is_active">Ativo no catálogo</Label>
                <p className="text-xs text-muted-foreground">Visível para clientes</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label htmlFor="is_kit">É um Kit</Label>
                <p className="text-xs text-muted-foreground">Produto do tipo kit</p>
              </div>
              <Switch
                id="is_kit"
                checked={formData.is_kit}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_kit: checked }))}
              />
            </div>

            {formData.is_kit && (
              <div className="space-y-2">
                <Label htmlFor="kit_description">Descrição do Kit</Label>
                <Textarea
                  id="kit_description"
                  value={formData.kit_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, kit_description: e.target.value }))}
                  placeholder="Ex: 100 tags brinco + 100 tags anel..."
                  rows={2}
                />
              </div>
            )}

            <ImageUploadField
              value={formData.image_url}
              onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
              label="Imagem do Produto"
              bucket="product-images"
              folder="products"
            />

            <div className="space-y-2">
              <Label htmlFor="custom_specs">Especificações (separadas por vírgula)</Label>
              <Input
                id="custom_specs"
                value={formData.custom_specs}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_specs: e.target.value }))}
                placeholder="Ex: Frente e Verso, Couchê 250g, Verniz Total"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="available_quantities">Quantidades Disponíveis (separadas por vírgula, deixe vazio para padrão)</Label>
              <Input
                id="available_quantities"
                value={formData.available_quantities}
                onChange={(e) => setFormData(prev => ({ ...prev, available_quantities: e.target.value }))}
                placeholder="Ex: 250, 500, 1000"
              />
            </div>

            <div className="space-y-3">
              <Label>Preços por Quantidade</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">100 unidades</Label>
                  <Input
                    value={formData.price_qty100}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_qty100: maskCurrency(e.target.value) }))}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">200 unidades</Label>
                  <Input
                    value={formData.price_qty200}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_qty200: maskCurrency(e.target.value) }))}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">250 unidades</Label>
                  <Input
                    value={formData.price_qty250}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_qty250: maskCurrency(e.target.value) }))}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">500 unidades</Label>
                  <Input
                    value={formData.price_qty500}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_qty500: maskCurrency(e.target.value) }))}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">1.000 unidades</Label>
                  <Input
                    value={formData.price_qty1000}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_qty1000: maskCurrency(e.target.value) }))}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">2.000 unidades</Label>
                  <Input
                    value={formData.price_qty2000}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_qty2000: maskCurrency(e.target.value) }))}
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingProduct ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ManagementLayout>
  );
}