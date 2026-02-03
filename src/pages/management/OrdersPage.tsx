import { useEffect, useState } from 'react';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { PageHeader } from '@/components/management/PageHeader';
import { StatusBadge } from '@/components/management/StatusBadge';
import { OrderForm } from '@/components/management/OrderForm';
import { useManagement } from '@/contexts/ManagementContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, FileText, Eye, Trash2, Loader2, ArrowRightLeft, Plus, Download, Pencil, AlertTriangle } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Order, Quote, OrderStatus, QuoteStatus } from '@/types/management';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PdfPreviewDialog } from '@/components/management/PdfPreviewDialog';
import { generateOrderPDF, generateQuotePDF } from '@/lib/pdf-export';

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'awaiting_payment', label: 'Aguardando Pagamento' },
  { value: 'creating_art', label: 'Criando Arte' },
  { value: 'production', label: 'Em Produção' },
  { value: 'shipping', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
];

const QUOTE_STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' },
  { value: 'converted', label: 'Convertido' },
];

export default function OrdersPage() {
  const { 
    orders, quotes, clients, products, loadingOrders, loadingQuotes, company,
    fetchOrders, fetchQuotes, fetchClients, fetchCompany, fetchProducts, updateOrder, updateQuote, 
    deleteOrder, deleteQuote, convertQuoteToOrder 
  } = useManagement();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedItem, setSelectedItem] = useState<Order | Quote | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'quote' | 'order'>('order');
  const [editingItem, setEditingItem] = useState<Order | Quote | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfItem, setPdfItem] = useState<Order | Quote | null>(null);
  const [pdfType, setPdfType] = useState<'order' | 'quote'>('order');

  useEffect(() => {
    fetchOrders();
    fetchQuotes();
    fetchClients();
    fetchCompany();
    fetchProducts();
  }, [fetchOrders, fetchQuotes, fetchClients, fetchCompany, fetchProducts]);

  const getClientById = (clientId?: string) => {
    if (!clientId) return null;
    return clients.find(c => c.id === clientId) || null;
  };

  const filteredOrders = orders.filter(order => 
    order.number.toLowerCase().includes(search.toLowerCase()) ||
    order.client_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredQuotes = quotes.filter(quote => 
    quote.number.toLowerCase().includes(search.toLowerCase()) ||
    quote.client_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    const success = await updateOrder(orderId, { 
      status,
      completed_at: status === 'delivered' ? new Date().toISOString() : undefined
    });
    if (success) toast.success('Status atualizado!');
  };

  const handleQuoteStatusChange = async (quoteId: string, status: QuoteStatus) => {
    const success = await updateQuote(quoteId, { status });
    if (success) toast.success('Status atualizado!');
  };

  const handleConvertQuote = async (quoteId: string) => {
    const order = await convertQuoteToOrder(quoteId);
    if (order) {
      toast.success(`Pedido ${order.number} criado!`);
      setActiveTab('orders');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm('Excluir este pedido?')) {
      const success = await deleteOrder(id);
      if (success) toast.success('Pedido excluído!');
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (confirm('Excluir este orçamento?')) {
      const success = await deleteQuote(id);
      if (success) toast.success('Orçamento excluído!');
    }
  };

  const openNewForm = (mode: 'quote' | 'order') => {
    setFormMode(mode);
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEditForm = (item: Order | Quote, mode: 'quote' | 'order') => {
    setFormMode(mode);
    setEditingItem(item);
    setFormOpen(true);
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const openPdfPreview = (item: Order | Quote, type: 'order' | 'quote') => {
    setPdfItem(item);
    setPdfType(type);
    setPdfPreviewOpen(true);
  };

  const isLoading = loadingOrders || loadingQuotes;

  return (
    <ManagementLayout>
      <PageHeader
        title="Pedidos & Orçamentos"
        description="Gerencie pedidos e orçamentos"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => openNewForm('quote')}>
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Orçamento
            </Button>
            <Button size="sm" className="text-xs sm:text-sm" onClick={() => openNewForm('order')}>
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Pedido
            </Button>
          </div>
        }
      />

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto">
          <TabsTrigger value="orders" className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Pedidos ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="quotes" className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Orçamentos ({quotes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum pedido encontrado
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {filteredOrders.map(order => (
                <Card key={order.id}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-semibold text-foreground text-sm sm:text-base">Pedido_{order.number.replace('PED', '')}</span>
                          <StatusBadge status={order.status} type="order" />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{order.client_name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {format(new Date(order.created_at), "dd/MM/yy", { locale: ptBR })}
                          </p>
                          <p className="text-sm sm:text-base font-medium text-primary">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleOrderStatusChange(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUS_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openPdfPreview(order, 'order')}>
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditForm(order, 'order')}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setSelectedItem(order); setDetailsOpen(true); }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteOrder(order.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quotes">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum orçamento encontrado
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {filteredQuotes.map(quote => {
                const isExpired = quote.valid_until && isPast(parseISO(quote.valid_until)) && quote.status === 'pending';
                
                return (
                <Card key={quote.id} className={isExpired ? 'border-destructive/50 bg-destructive/5' : ''}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-semibold text-foreground text-sm sm:text-base">Orçamento_{quote.number.replace('ORC', '')}</span>
                          <StatusBadge status={quote.status} type="quote" />
                          {isExpired && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                              <AlertTriangle className="w-3 h-3" />
                              Expirado
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{quote.client_name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex flex-col">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {format(new Date(quote.created_at), "dd/MM/yy", { locale: ptBR })}
                            </p>
                            {quote.valid_until && (
                              <p className={`text-xs ${isExpired ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                Válido até: {format(parseISO(quote.valid_until), "dd/MM/yy", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                          <p className="text-sm sm:text-base font-medium text-primary">
                            {formatCurrency(quote.total)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Select
                          value={quote.status}
                          onValueChange={(value) => handleQuoteStatusChange(quote.id, value as QuoteStatus)}
                        >
                          <SelectTrigger className="w-full sm:w-[160px] text-xs sm:text-sm h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QUOTE_STATUS_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                          {quote.status === 'approved' && (
                            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => handleConvertQuote(quote.id)}>
                              <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                              Converter
                            </Button>
                          )}
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openPdfPreview(quote, 'quote')}>
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditForm(quote, 'quote')}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setSelectedItem(quote); setDetailsOpen(true); }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteQuote(quote.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Order Form */}
      <OrderForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingItem(null);
        }}
        mode={formMode}
        editingItem={editingItem}
        onSave={() => {
          fetchOrders();
          fetchQuotes();
        }}
      />

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes - {selectedItem && ('number' in selectedItem ? (pdfType === 'order' ? `Pedido_${selectedItem.number.replace('PED', '')}` : `Orçamento_${selectedItem.number.replace('ORC', '')}`) : '')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{selectedItem.client_name}</p>
              </div>
              {selectedItem.items && selectedItem.items.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Itens</p>
                  <div className="space-y-2">
                    {selectedItem.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span>{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-semibold">{formatCurrency(selectedItem.total)}</span>
                </div>
              </div>
              {selectedItem.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm">{selectedItem.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Preview */}
      <PdfPreviewDialog
        open={pdfPreviewOpen}
        onOpenChange={setPdfPreviewOpen}
        title={pdfItem ? (pdfType === 'order' ? `Pedido_${(pdfItem as Order).number.replace('PED', '')}` : `Orçamento_${(pdfItem as Quote).number.replace('ORC', '')}`) : ''}
        generatePdf={async () => {
          if (!pdfItem) {
            const jsPDF = (await import('jspdf')).default;
            return new jsPDF();
          }
          const client = getClientById(pdfItem.client_id);
          return pdfType === 'order' 
            ? generateOrderPDF(pdfItem as Order, company, client, products)
            : generateQuotePDF(pdfItem as Quote, company, client, products);
        }}
      />
    </ManagementLayout>
  );
}
