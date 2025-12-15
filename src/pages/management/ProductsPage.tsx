import { useEffect, useState } from 'react';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { PageHeader } from '@/components/management/PageHeader';
import { useManagement } from '@/contexts/ManagementContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { ManagementProduct } from '@/types/management';
import { maskCurrency, parseCurrencyToNumber } from '@/lib/masks';

export default function ProductsPage() {
  const { products, loadingProducts, fetchProducts, addProduct, updateProduct, deleteProduct } = useManagement();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ManagementProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    base_price: '',
    cost: '',
  });

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number | undefined) => 
    value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : '-';

  const openNew = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', category: '', base_price: '', cost: '' });
    setFormOpen(true);
  };

  const openEdit = (product: ManagementProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      base_price: product.base_price ? maskCurrency(product.base_price) : '',
      cost: product.cost ? maskCurrency(product.cost) : '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const basePrice = parseCurrencyToNumber(formData.base_price);
    const cost = formData.cost ? parseCurrencyToNumber(formData.cost) : undefined;

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category || undefined,
      base_price: isNaN(basePrice) ? 0 : basePrice,
      cost: cost && !isNaN(cost) ? cost : undefined,
    };

    if (editingProduct) {
      const success = await updateProduct(editingProduct.id, data);
      if (success) {
        toast.success('Produto atualizado!');
        setFormOpen(false);
      }
    } else {
      const result = await addProduct(data as Omit<ManagementProduct, 'id' | 'created_at' | 'updated_at'>);
      if (result) {
        toast.success('Produto adicionado!');
        setFormOpen(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir este produto?')) {
      const success = await deleteProduct(id);
      if (success) toast.success('Produto excluído!');
    }
  };

  return (
    <ManagementLayout>
      <PageHeader
        title="Produtos"
        description="Produtos para orçamentos e pedidos"
        actions={
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
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
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum produto cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(product => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    {product.category && (
                      <span className="text-xs text-muted-foreground">{product.category}</span>
                    )}
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
                {product.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço:</span>
                  <span className="font-medium text-primary">{formatCurrency(product.base_price)}</span>
                </div>
                {product.cost && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Custo:</span>
                    <span>{formatCurrency(product.cost)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Ex: Tags, Cartões..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">Preço Base</Label>
                <Input
                  id="base_price"
                  value={formData.base_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_price: maskCurrency(e.target.value) }))}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Custo</Label>
                <Input
                  id="cost"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: maskCurrency(e.target.value) }))}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
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
