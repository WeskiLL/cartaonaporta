import { useEffect, useState } from 'react';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { PageHeader } from '@/components/management/PageHeader';
import { useManagement } from '@/contexts/ManagementContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Mockup } from '@/types/management';

export default function MockupsPage() {
  const { mockups, loadingMockups, fetchMockups, addMockup, deleteMockup } = useManagement();
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    image_url: '',
  });

  useEffect(() => {
    fetchMockups();
  }, [fetchMockups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addMockup({
      name: formData.name,
      category: formData.category || 'Geral',
      image_url: formData.image_url,
    });
    if (result) {
      toast.success('Mockup adicionado!');
      setFormOpen(false);
      setFormData({ name: '', category: '', image_url: '' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir este mockup?')) {
      const success = await deleteMockup(id);
      if (success) toast.success('Mockup excluído!');
    }
  };

  const categories = [...new Set(mockups.map(m => m.category))].filter(Boolean);

  return (
    <ManagementLayout>
      <PageHeader
        title="Mockups"
        description="Galeria de mockups para apresentação"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Mockup
          </Button>
        }
      />

      {loadingMockups ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : mockups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum mockup cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4 text-foreground">{category}</h3>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {mockups.filter(m => m.category === category).map(mockup => (
                  <Card key={mockup.id} className="group relative overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-square relative">
                        {mockup.image_url ? (
                          <img
                            src={mockup.image_url}
                            alt={mockup.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(mockup.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium truncate text-foreground">{mockup.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mockup Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Mockup</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
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
            <div className="space-y-2">
              <Label htmlFor="image_url">URL da Imagem *</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://..."
                required
              />
            </div>
            {formData.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ManagementLayout>
  );
}
