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
import { Quote, Order, QuoteItem, Client, DeliveryAddress, ManagementProduct } from '@/types/management';
import { Plus, Trash2, Loader2, Search, UserPlus, Package } from 'lucide-react';
import { maskCurrency, unmask, maskCPFOrCNPJ, maskCEP, maskPhone, validateCPFOrCNPJ } from '@/lib/masks';
import { fetchAddressByCep } from '@/lib/cep-service';
import { toast } from 'sonner';

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'quote' | 'order';
  onSave: () => void;
  editingItem?: Order | Quote | null;
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

// Available quantities that products can have prices for
const QUANTITY_OPTIONS = [100, 200, 250, 500, 1000, 2000];

export function OrderForm({ open, onOpenChange, mode, onSave, editingItem }: OrderFormProps) {
  const { clients, products, fetchClients, fetchProducts, addQuote, addOrder, addClient, updateQuote, updateOrder } = useManagement();
  const [loading, setLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<(Omit<QuoteItem, 'id' | 'quote_id' | 'order_id'> & { 
    selectedQuantity?: number;
    isManual?: boolean;
    productImage?: string;
  })[]>([]);
  const [discount, setDiscount] = useState('');
  const [shipping, setShipping] = useState('');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  
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

  // Track if we've initialized the form for the current open state
  const [initialized, setInitialized] = useState(false);

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetchClients();
      fetchProducts();
    } else {
      setInitialized(false);
    }
  }, [open, fetchClients, fetchProducts]);

  // Initialize form data only once when dialog opens and data is available
  useEffect(() => {
    if (!open || initialized) return;
    
    // Wait for clients to be loaded before initializing
    if (clients.length === 0 && !editingItem) {
      // For new items, we can initialize without waiting
      setSelectedClient(null);
      setItems([]);
      setDiscount('');
      setShipping('');
      setNotes('');
      setClientMode('select');
      setNewClient({ name: '', email: '', phone: '', document: '' });
      setDeliveryAddress({ zip_code: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
      setDocumentError('');
      setInitialized(true);
      return;
    }

    if (editingItem) {
      // Populate form with existing data
      const client = clients.find(c => c.id === editingItem.client_id);
      setSelectedClient(client || null);
      setClientMode('select');
      setDiscount(editingItem.discount ? maskCurrency(editingItem.discount) : '');
      setShipping(editingItem.shipping ? maskCurrency(editingItem.shipping) : '');
      setNotes(editingItem.notes || '');
      
      // Populate items
      if (editingItem.items && editingItem.items.length > 0) {
        const mappedItems = editingItem.items.map(item => {
          // Check if product exists in catalog by ID
          const product = item.product_id ? products.find(p => p.id === item.product_id) : null;
          
          // Item is manual only if it has no product_id
          const isManualItem = !item.product_id;
          
          // Extract quantity from product_name if it's a catalog product (format: "Name (250 un)")
          let extractedQuantity = item.quantity;
          if (!isManualItem && item.product_name) {
            const match = item.product_name.match(/\((\d+)\s*un\)/);
            if (match) {
              extractedQuantity = parseInt(match[1], 10);
            }
          }
          
          // Get product name - use the base name from catalog if available, otherwise strip the quantity suffix
          let productName = item.product_name;
          if (product) {
            productName = product.name;
          } else if (!isManualItem && item.product_name) {
            // Product ID exists but product not found in catalog - extract base name
            productName = item.product_name.replace(/\s*\(\d+\s*un\)$/, '');
          }
          
          return {
            product_id: item.product_id || '',
            product_name: productName,
            quantity: item.quantity,
            selectedQuantity: extractedQuantity,
            unit_price: item.unit_price,
            total: item.total,
            isManual: isManualItem,
            productImage: product?.image_url,
          };
        });
        setItems(mappedItems);
      } else {
        setItems([]);
      }
      
      // Populate delivery address for orders
      if (mode === 'order' && 'delivery_address' in editingItem && editingItem.delivery_address) {
        const addr = editingItem.delivery_address as unknown as DeliveryAddressData;
        setDeliveryAddress({
          zip_code: addr.zip_code || '',
          street: addr.street || '',
          number: addr.number || '',
          complement: addr.complement || '',
          neighborhood: addr.neighborhood || '',
          city: addr.city || '',
          state: addr.state || '',
        });
      } else {
        setDeliveryAddress({ zip_code: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
      }
    } else {
      // Reset form for new item
      setSelectedClient(null);
      setItems([]);
      setDiscount('');
      setShipping('');
      setNotes('');
      setClientMode('select');
      setNewClient({ name: '', email: '', phone: '', document: '' });
      setDeliveryAddress({ zip_code: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
      setDocumentError('');
    }
    
    setInitialized(true);
  }, [open, initialized, editingItem, clients, products, mode]);

  // Filter products by search
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Get price for a product at a specific quantity
  const getProductPriceForQuantity = (product: ManagementProduct, quantity: number): number => {
    const priceMap: Record<number, number | undefined> = {
      100: product.price_qty100,
      200: product.price_qty200,
      250: product.price_qty250,
      500: product.price_qty500,
      1000: product.price_qty1000,
      2000: product.price_qty2000,
    };
    return priceMap[quantity] || 0;
  };

  // Get available quantities for a product (quantities that have prices > 0)
  const getAvailableQuantities = (product: ManagementProduct): number[] => {
    if (product.available_quantities && product.available_quantities.length > 0) {
      return product.available_quantities;
    }
    return QUANTITY_OPTIONS.filter(qty => getProductPriceForQuantity(product, qty) > 0);
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      product_id: '',
      product_name: '',
      quantity: 1,
      selectedQuantity: undefined,
      unit_price: 0,
      total: 0,
      isManual: false,
      productImage: undefined,
    }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index], [field]: value };
      
      if (field === 'product_id') {
        if (value === '' || value === 'manual') {
          // Manual mode
          item.product_id = '';
          item.product_name = '';
          item.isManual = true;
          item.selectedQuantity = undefined;
          item.unit_price = 0;
          item.total = 0;
          item.productImage = undefined;
        } else {
          const product = products.find(p => p.id === value);
          if (product) {
            item.product_name = product.name;
            item.isManual = false;
            item.productImage = product.image_url;
            
            // Get available quantities
            const availableQtys = getAvailableQuantities(product);
            // Default to first available quantity
            const defaultQty = availableQtys.includes(250) ? 250 : (availableQtys[0] || 100);
            item.selectedQuantity = defaultQty;
            item.quantity = 1; // 1 "unit" at this quantity
            item.unit_price = getProductPriceForQuantity(product, defaultQty);
            item.total = item.unit_price; // total = price for that quantity
          }
        }
      }
      
      if (field === 'selectedQuantity' && item.product_id) {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          const qty = value as number;
          item.unit_price = getProductPriceForQuantity(product, qty);
          item.total = item.unit_price;
        }
      }
      
      // For manual items, calculate total from quantity * unit_price
      if (item.isManual && (field === 'quantity' || field === 'unit_price' || field === 'total')) {
        if (field === 'total') {
          // If total is set directly, keep it
          item.total = value;
        } else {
          // For manual: no quantity calculation needed, just use total directly
        }
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
  const shippingValue = parseFloat(unmask(shipping)) / 100 || 0;
  const total = subtotal - discountValue + shippingValue;

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
      // Validate that new client has a name
      if (!newClient.name.trim()) {
        toast.error('Informe o nome do cliente');
        return;
      }
      
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
      
      // Create client with the provided name
      const createdClient = await addClient({
        name: newClient.name.trim(),
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
      // Mode is 'select' - validate that a client is selected
      if (!selectedClient) {
        toast.error('Selecione um cliente');
        return;
      }
    }

    setLoading(true);
    
    const data: any = {
      client_id: clientId || undefined,
      client_name: clientName,
      subtotal,
      discount: discountValue,
      shipping: shippingValue,
      total,
      notes: notes || undefined,
      status: mode === 'quote' ? 'pending' as const : 'awaiting_payment' as const,
    };
    
    // Add delivery address for orders
    if (mode === 'order' && deliveryAddress.zip_code) {
      data.delivery_address = deliveryAddress;
    }

    const itemsData = items.map(item => ({
      product_id: item.product_id && item.product_id.length > 0 ? item.product_id : null,
      product_name: item.isManual 
        ? item.product_name 
        : `${item.product_name} (${item.selectedQuantity} un)`,
      quantity: item.isManual ? item.quantity : item.selectedQuantity || 1,
      unit_price: item.total,
      total: item.total,
    }));

    let result;
    if (editingItem) {
      // Update existing
      const success = mode === 'quote' 
        ? await updateQuote(editingItem.id, { ...data, items: undefined })
        : await updateOrder(editingItem.id, { ...data, items: undefined });
      
      if (success) {
        // Delete old items and insert new ones
        const { supabase } = await import('@/integrations/supabase/client');
        if (mode === 'quote') {
          await supabase.from('quote_items').delete().eq('quote_id', editingItem.id);
          if (itemsData.length > 0) {
            await supabase.from('quote_items').insert(itemsData.map(item => ({ ...item, quote_id: editingItem.id })));
          }
        } else {
          await supabase.from('quote_items').delete().eq('order_id', editingItem.id);
          if (itemsData.length > 0) {
            await supabase.from('quote_items').insert(itemsData.map(item => ({ ...item, order_id: editingItem.id })));
          }
        }
      }
      result = success;
    } else {
      // Create new
      if (mode === 'quote') {
        result = await addQuote(data, itemsData);
      } else {
        result = await addOrder(data, itemsData);
      }
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
            {editingItem 
              ? (mode === 'quote' ? `Editar Orçamento_${editingItem.number.replace('ORC', '')}` : `Editar Pedido_${editingItem.number.replace('PED', '')}`)
              : (mode === 'quote' ? 'Novo Orçamento' : 'Novo Pedido')
            }
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
                        role="button"
                        tabIndex={0}
                        className="w-full text-left p-2 hover:bg-muted cursor-pointer"
                        onClick={() => setSelectedClient(client)}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedClient(client)}
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
              <Button type="button" variant="outline" size="sm" onClick={() => addItem()}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => {
                const selectedProduct = item.product_id ? products.find(p => p.id === item.product_id) : null;
                const availableQuantities = selectedProduct ? getAvailableQuantities(selectedProduct) : [];
                
                return (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        {/* Product Image Thumbnail */}
                        <div className="flex-shrink-0">
                          {item.productImage ? (
                            <img 
                              src={item.productImage} 
                              alt={item.product_name}
                              className="w-12 h-12 object-cover rounded-lg border border-border"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-4">
                            <Label className="text-xs">Produto</Label>
                            <Select
                              value={item.product_id || 'manual'}
                              onValueChange={(value) => {
                                updateItem(index, 'product_id', value === 'manual' ? '' : value);
                                setProductSearch('');
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-2">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                    <Input
                                      placeholder="Buscar produto..."
                                      value={productSearch}
                                      onChange={(e) => setProductSearch(e.target.value)}
                                      className="h-8 pl-7 text-xs"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                <SelectItem value="manual">Digite manualmente</SelectItem>
                                {filteredProducts.map(p => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {item.isManual && (
                              <Input
                                placeholder="Nome do produto"
                                value={item.product_name}
                                onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                                className="mt-1"
                              />
                            )}
                          </div>
                          
                          {item.product_id && !item.isManual ? (
                            <>
                              <div className="col-span-3">
                                <Label className="text-xs">Quantidade</Label>
                                <Select
                                  value={String(item.selectedQuantity || '')}
                                  onValueChange={(value) => updateItem(index, 'selectedQuantity', parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Qtd" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableQuantities.map(qty => (
                                      <SelectItem key={qty} value={String(qty)}>
                                        {qty} unidades
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-4">
                                <Label className="text-xs">Preço</Label>
                                <Input 
                                  value={formatCurrency(item.total)} 
                                  disabled 
                                  className="bg-muted"
                                />
                              </div>
                            </>
                          ) : item.isManual ? (
                            <>
                              <div className="col-span-3">
                                <Label className="text-xs">Qtd</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                />
                              </div>
                              <div className="col-span-4">
                                <Label className="text-xs">Valor Total</Label>
                                <Input
                                  value={maskCurrency(item.total)}
                                  onChange={(e) => {
                                    const cleaned = unmask(e.target.value);
                                    const cents = parseInt(cleaned, 10) || 0;
                                    updateItem(index, 'total', cents / 100);
                                  }}
                                  placeholder="R$ 0,00"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="col-span-7 flex items-center text-sm text-muted-foreground">
                              Selecione um produto ou escolha "Digite manualmente"
                            </div>
                          )}
                          
                          <div className="col-span-1">
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Adicione itens ao {mode === 'quote' ? 'orçamento' : 'pedido'}
                </p>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-4">
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
              <Label htmlFor="shipping">Frete</Label>
              <Input
                id="shipping"
                value={shipping}
                onChange={(e) => setShipping(maskCurrency(e.target.value))}
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
              {shippingValue > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Frete</span>
                  <span>+{formatCurrency(shippingValue)}</span>
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
              {editingItem ? 'Salvar Alterações' : `Criar ${mode === 'quote' ? 'Orçamento' : 'Pedido'}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
