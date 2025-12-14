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
import { Search, Package, FileText, Eye, Trash2, Loader2, ArrowRightLeft, Plus, Download } from 'lucide-react';
import { format } from 'date-fns';
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
    orders, quotes, clients, loadingOrders, loadingQuotes, company,
    fetchOrders, fetchQuotes, fetchClients, updateOrder, updateQuote, 
    deleteOrder, deleteQuote, convertQuoteToOrder 
  } = useManagement();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedItem, setSelectedItem] = useState<Order | Quote | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'quote' | 'order'>('order');
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfItem, setPdfItem] = useState<Order | Quote | null>(null);
  const [pdfType, setPdfType] = useState<'order' | 'quote'>('order');

  useEffect(() => {
    fetchOrders();
    fetchQuotes();
    fetchClients();
  }, [fetchOrders, fetchQuotes, fetchClients]);

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openNewForm('quote')}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
            <Button onClick={() => openNewForm('order')}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Pedido
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
        <TabsList className="mb-6">
          <TabsTrigger value="orders" className="gap-2">
            <Package className="w-4 h-4" />
            Pedidos ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="quotes" className="gap-2">
            <FileText className="w-4 h-4" />
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
            <div className="grid gap-4">
              {filteredOrders.map(order => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-foreground">{order.number}</span>
                          <StatusBadge status={order.status} type="order" />
                        </div>
                        <p className="text-sm text-muted-foreground">{order.client_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-sm font-medium text-primary mt-1">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleOrderStatusChange(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUS_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={() => openPdfPreview(order, 'order')}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => { setSelectedItem(order); setDetailsOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="text-destructive" onClick={() => handleDeleteOrder(order.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
            <div className="grid gap-4">
              {filteredQuotes.map(quote => (
                <Card key={quote.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-foreground">{quote.number}</span>
                          <StatusBadge status={quote.status} type="quote" />
                        </div>
                        <p className="text-sm text-muted-foreground">{quote.client_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(quote.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-sm font-medium text-primary mt-1">
                          {formatCurrency(quote.total)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Select
                          value={quote.status}
                          onValueChange={(value) => handleQuoteStatusChange(quote.id, value as QuoteStatus)}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QUOTE_STATUS_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {quote.status === 'approved' && (
                          <Button variant="outline" size="sm" onClick={() => handleConvertQuote(quote.id)}>
                            <ArrowRightLeft className="w-4 h-4 mr-1" />
                            Converter
                          </Button>
                        )}
                        <Button variant="outline" size="icon" onClick={() => openPdfPreview(quote, 'quote')}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => { setSelectedItem(quote); setDetailsOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="text-destructive" onClick={() => handleDeleteQuote(quote.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Order Form */}
      <OrderForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        onSave={() => {
          fetchOrders();
          fetchQuotes();
        }}
      />

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes - {selectedItem && ('number' in selectedItem ? selectedItem.number : '')}</DialogTitle>
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
        title={pdfItem ? (pdfType === 'order' ? `Pedido ${(pdfItem as Order).number}` : `Orçamento ${(pdfItem as Quote).number}`) : ''}
        generatePdf={async () => {
          if (!pdfItem) {
            const jsPDF = (await import('jspdf')).default;
            return new jsPDF();
          }
          const client = getClientById(pdfItem.client_id);
          return pdfType === 'order' 
            ? generateOrderPDF(pdfItem as Order, company, client)
            : generateQuotePDF(pdfItem as Quote, company, client);
        }}
      />
    </ManagementLayout>
  );
}
