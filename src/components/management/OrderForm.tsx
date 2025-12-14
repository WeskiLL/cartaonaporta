import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useManagement } from '@/contexts/ManagementContext';
import { Quote, Order, QuoteItem, Client, ManagementProduct } from '@/types/management';
import { Plus, Trash2, Loader2, Search } from 'lucide-react';
import { maskCurrency, unmask } from '@/lib/masks';

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'quote' | 'order';
  onSave: () => void;
}

export function OrderForm({ open, onOpenChange, mode, onSave }: OrderFormProps) {
  const { clients, products, fetchClients, fetchProducts, addQuote, addOrder } = useManagement();
  const [loading, setLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<Omit<QuoteItem, 'id' | 'quote_id' | 'order_id'>[]>([]);
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchProducts();
      setSelectedClient(null);
      setItems([]);
      setDiscount('');
      setNotes('');
    }
  }, [open, fetchClients, fetchProducts]);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const addItem = () => {
    setItems(prev => [...prev, {
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
    }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index], [field]: value };
      
      if (field === 'product_id') {
        const product = products.find(p => p.id === value);
        if (product) {
          item.product_name = product.name;
          item.unit_price = product.base_price || 0;
          item.total = item.quantity * item.unit_price;
        }
      }
      
      if (field === 'quantity' || field === 'unit_price') {
        item.total = item.quantity * item.unit_price;
      }
      
      newItems[index] = item;
      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountValue = parseFloat(unmask(discount)) / 100 || 0;
  const total = subtotal - discountValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || items.length === 0) return;

    setLoading(true);
    
    const data = {
      client_id: selectedClient.id,
      client_name: selectedClient.name,
      subtotal,
      discount: discountValue,
      total,
      notes: notes || undefined,
      status: mode === 'quote' ? 'pending' as const : 'awaiting_payment' as const,
    };

    const itemsData = items.map(item => ({
      product_id: item.product_id || undefined,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }));

    let result;
    if (mode === 'quote') {
      result = await addQuote(data as any, itemsData);
    } else {
      result = await addOrder(data as any, itemsData);
    }

    setLoading(false);
    if (result) {
      onSave();
      onOpenChange(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'quote' ? 'Novo Orçamento' : 'Novo Pedido'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            {selectedClient ? (
              <Card>
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedClient.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
                    Alterar
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-lg">
                  {filteredClients.map(client => (
                    <div
                      key={client.id}
                      className="p-2 hover:bg-muted cursor-pointer"
                      onClick={() => setSelectedClient(client)}
                    >
                      <p className="font-medium text-sm">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                  ))}
                  {filteredClients.length === 0 && (
                    <p className="p-2 text-sm text-muted-foreground">Nenhum cliente encontrado</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Itens *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label className="text-xs">Produto</Label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) => updateItem(index, 'product_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Qtd</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Valor Unit.</Label>
                        <Input
                          value={maskCurrency(item.unit_price * 100)}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(unmask(e.target.value)) / 100 || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Total</Label>
                        <Input value={formatCurrency(item.total)} disabled />
                      </div>
                      <div className="col-span-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Adicione itens ao {mode === 'quote' ? 'orçamento' : 'pedido'}
                </p>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Desconto</Label>
              <Input
                id="discount"
                value={discount}
                onChange={(e) => setDiscount(maskCurrency(e.target.value))}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Desconto</span>
                  <span>-{formatCurrency(discountValue)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg mt-2 pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedClient || items.length === 0}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar {mode === 'quote' ? 'Orçamento' : 'Pedido'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
