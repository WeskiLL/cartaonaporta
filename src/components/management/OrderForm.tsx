import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useManagement } from '@/contexts/ManagementContext';
import { Quote, Order, QuoteItem, Client, DeliveryAddress } from '@/types/management';
import { Plus, Trash2, Loader2, Search, UserPlus } from 'lucide-react';
import { maskCurrency, unmask, maskCPFOrCNPJ, maskCEP, maskPhone, validateCPFOrCNPJ } from '@/lib/masks';
import { fetchAddressByCep } from '@/lib/cep-service';
import { toast } from 'sonner';

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'quote' | 'order';
  onSave: () => void;
}

interface NewClientData {
  name: string;
  email: string;
  phone: string;
  document: string;
}

interface DeliveryAddressData {
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export function OrderForm({ open, onOpenChange, mode, onSave }: OrderFormProps) {
  const { clients, products, fetchClients, fetchProducts, addQuote, addOrder, addClient } = useManagement();
  const [loading, setLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<Omit<QuoteItem, 'id' | 'quote_id' | 'order_id'>[]>([]);
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  
  // New client inline creation
  const [clientMode, setClientMode] = useState<'select' | 'new'>('select');
  const [newClient, setNewClient] = useState<NewClientData>({
    name: '',
    email: '',
    phone: '',
    document: '',
  });
  const [documentError, setDocumentError] = useState('');
  
  // Delivery address (only for orders)
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddressData>({
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchProducts();
      setSelectedClient(null);
      setItems([]);
      setDiscount('');
      setNotes('');
      setClientMode('select');
      setNewClient({ name: '', email: '', phone: '', document: '' });
      setDeliveryAddress({ zip_code: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
      setDocumentError('');
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

  // Handle CEP lookup
  const handleCepChange = async (value: string) => {
    const maskedCep = maskCEP(value);
    setDeliveryAddress(prev => ({ ...prev, zip_code: maskedCep }));
    
    const cleanCep = unmask(maskedCep);
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      const address = await fetchAddressByCep(cleanCep);
      if (address) {
        setDeliveryAddress(prev => ({
          ...prev,
          street: address.logradouro,
          neighborhood: address.bairro,
          city: address.localidade,
          state: address.uf,
        }));
      }
      setLoadingCep(false);
    }
  };

  // Handle document validation
  const handleDocumentChange = (value: string) => {
    const masked = maskCPFOrCNPJ(value);
    setNewClient(prev => ({ ...prev, document: masked }));
    
    const cleaned = unmask(masked);
    if (cleaned.length === 11 || cleaned.length === 14) {
      const result = validateCPFOrCNPJ(cleaned);
      if (!result.valid) {
        setDocumentError(`${result.type?.toUpperCase() || 'Documento'} inválido`);
      } else {
        setDocumentError('');
      }
    } else {
      setDocumentError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let clientId = selectedClient?.id;
    let clientName = selectedClient?.name || '';
    
    // If creating new client
    if (clientMode === 'new') {
      // Validate document if provided
      if (newClient.document) {
        const cleaned = unmask(newClient.document);
        if (cleaned.length === 11 || cleaned.length === 14) {
          const result = validateCPFOrCNPJ(cleaned);
          if (!result.valid) {
            toast.error(`${result.type?.toUpperCase() || 'Documento'} inválido`);
            return;
          }
        }
      }
      
      // Create client if name provided
      if (newClient.name.trim()) {
        const createdClient = await addClient({
          name: newClient.name,
          email: newClient.email || '',
          phone: newClient.phone || '',
          document: newClient.document || '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
        });
        
        if (!createdClient) {
          toast.error('Erro ao criar cliente');
          return;
        }
        
        clientId = createdClient.id;
        clientName = createdClient.name;
      } else {
        clientName = newClient.name || 'Cliente não informado';
      }
    }
    
    // Client name can be empty now (not required)
    if (!clientName && !clientId) {
      clientName = 'Cliente não informado';
    }

    setLoading(true);
    
    const data: any = {
      client_id: clientId || undefined,
      client_name: clientName,
      subtotal,
      discount: discountValue,
      total,
      notes: notes || undefined,
      status: mode === 'quote' ? 'pending' as const : 'awaiting_payment' as const,
    };
    
    // Add delivery address for orders
    if (mode === 'order' && deliveryAddress.zip_code) {
      data.delivery_address = deliveryAddress;
    }

    const itemsData = items.map(item => ({
      product_id: item.product_id || undefined,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }));

    let result;
    if (mode === 'quote') {
      result = await addQuote(data, itemsData);
    } else {
      result = await addOrder(data, itemsData);
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
          {/* Client Selection/Creation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cliente</Label>
              <Tabs value={clientMode} onValueChange={(v) => setClientMode(v as 'select' | 'new')}>
                <TabsList className="h-8">
                  <TabsTrigger value="select" className="text-xs px-2 py-1">Selecionar</TabsTrigger>
                  <TabsTrigger value="new" className="text-xs px-2 py-1">
                    <UserPlus className="w-3 h-3 mr-1" />
                    Novo
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {clientMode === 'select' ? (
              selectedClient ? (
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
              )
            ) : (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={newClient.name}
                        onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome do cliente"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CPF/CNPJ</Label>
                      <Input
                        value={newClient.document}
                        onChange={(e) => handleDocumentChange(e.target.value)}
                        placeholder="000.000.000-00"
                        maxLength={18}
                      />
                      {documentError && (
                        <p className="text-xs text-destructive mt-1">{documentError}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Telefone</Label>
                      <Input
                        value={newClient.phone}
                        onChange={(e) => setNewClient(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Delivery Address (only for orders) */}
          {mode === 'order' && (
            <div className="space-y-2">
              <Label>Endereço de Entrega</Label>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-1">
                      <Label className="text-xs">CEP</Label>
                      <div className="relative">
                        <Input
                          value={deliveryAddress.zip_code}
                          onChange={(e) => handleCepChange(e.target.value)}
                          placeholder="00000-000"
                          maxLength={9}
                        />
                        {loadingCep && (
                          <Loader2 className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Rua</Label>
                      <Input
                        value={deliveryAddress.street}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="Nome da rua"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Número</Label>
                      <Input
                        value={deliveryAddress.number}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, number: e.target.value }))}
                        placeholder="Nº"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Complemento</Label>
                      <Input
                        value={deliveryAddress.complement}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, complement: e.target.value }))}
                        placeholder="Apto, sala..."
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Bairro</Label>
                      <Input
                        value={deliveryAddress.neighborhood}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                        placeholder="Bairro"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Cidade</Label>
                      <Input
                        value={deliveryAddress.city}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Cidade"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Estado</Label>
                      <Input
                        value={deliveryAddress.state}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Items */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Itens</Label>
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
                        <div className="space-y-1">
                          <Select
                            value={item.product_id || 'manual'}
                            onValueChange={(value) => {
                              if (value === 'manual') {
                                updateItem(index, 'product_id', '');
                              } else {
                                updateItem(index, 'product_id', value);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Digite manualmente</SelectItem>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!item.product_id && (
                            <Input
                              placeholder="Nome do produto"
                              value={item.product_name}
                              onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                              className="mt-1"
                            />
                          )}
                        </div>
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
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar {mode === 'quote' ? 'Orçamento' : 'Pedido'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
