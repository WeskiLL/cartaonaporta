import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { PageHeader } from '@/components/management/PageHeader';
import { StatCard } from '@/components/management/StatCard';
import { StatusBadge } from '@/components/management/StatusBadge';
import { OrderKanban } from '@/components/management/OrderKanban';
import { OrderForm } from '@/components/management/OrderForm';
import { useManagement } from '@/contexts/ManagementContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, DollarSign, Users, FileText, Plus, TrendingUp, TrendingDown, RefreshCw, Loader2 } from 'lucide-react';
import { maskCurrency } from '@/lib/masks';
import { toast } from 'sonner';

type OrderStatus = 'awaiting_payment' | 'creating_art' | 'production' | 'shipping' | 'delivered';

export default function ManagementDashboard() {
  const { 
    orders, 
    quotes, 
    transactions, 
    clients, 
    fetchOrders, 
    fetchQuotes, 
    fetchTransactions, 
    fetchClients, 
    loadingOrders,
    loadingQuotes,
    updateOrder,
    addTransaction,
    convertQuoteToOrder 
  } = useManagement();

  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [orderFormMode, setOrderFormMode] = useState<'quote' | 'order'>('order');
  const [convertingQuoteId, setConvertingQuoteId] = useState<string | null>(null);


  useEffect(() => {
    fetchOrders();
    fetchQuotes();
    fetchTransactions();
    fetchClients();
  }, [fetchOrders, fetchQuotes, fetchTransactions, fetchClients]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const monthlyTransactions = transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
    });

    const totalRevenue = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount), 0);

    return {
      ordersCount: monthlyOrders.length,
      quotesCount: quotes.filter(q => q.status === 'pending').length,
      clientsCount: clients.length,
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: totalRevenue - totalExpenses,
    };
  }, [orders, quotes, transactions, clients]);

  const handleStatusChange = useCallback(async (orderId: string, newStatus: OrderStatus, addRevenue: boolean) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Update order status
    const success = await updateOrder(orderId, { 
      status: newStatus,
      revenue_added: addRevenue ? true : order.revenue_added 
    });

    if (success) {
      // Add revenue when moving to "creating_art" and not already added
      if (addRevenue && !order.revenue_added) {
        await addTransaction({
          type: 'income',
          amount: Number(order.total),
          category: 'Vendas',
          description: `Pedido ${order.number} - ${order.client_name}`,
          date: new Date().toISOString(),
          order_id: order.id,
        });
        toast.success('Receita adicionada ao financeiro');
      }
      
      fetchOrders();
    }
  }, [orders, updateOrder, addTransaction, fetchOrders]);

  const handleConvertQuote = async (quoteId: string) => {
    setConvertingQuoteId(quoteId);
    const order = await convertQuoteToOrder(quoteId);
    if (order) {
      toast.success(`Pedido ${order.number} criado com sucesso`);
      fetchQuotes();
      fetchOrders();
    }
    setConvertingQuoteId(null);
  };


  const pendingQuotes = quotes.filter(q => q.status === 'pending' || q.status === 'approved');

  return (
    <ManagementLayout>
      <PageHeader
        title="Dashboard"
        description="Visão geral do seu negócio"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setOrderFormMode('quote'); setOrderFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Orçamento
            </Button>
            <Button onClick={() => { setOrderFormMode('order'); setOrderFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Pedido
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Pedidos do Mês"
          value={stats.ordersCount}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <StatCard
          title="Orçamentos Pendentes"
          value={stats.quotesCount}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title="Total de Clientes"
          value={stats.clientsCount}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Receita do Mês"
          value={maskCurrency(stats.revenue)}
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm text-muted-foreground">Receitas</span>
          </div>
          <p className="text-2xl font-display font-bold text-green-600">{maskCurrency(stats.revenue)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <span className="text-sm text-muted-foreground">Despesas</span>
          </div>
          <p className="text-2xl font-display font-bold text-red-600">{maskCurrency(stats.expenses)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Lucro</span>
          </div>
          <p className={`text-2xl font-display font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {maskCurrency(stats.profit)}
          </p>
        </div>
      </div>

      {/* Tabs for Orders Kanban and Quotes */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="quotes">Orçamentos ({pendingQuotes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                Status dos Pedidos
                <Button variant="ghost" size="sm" onClick={() => fetchOrders()} disabled={loadingOrders}>
                  <RefreshCw className={`h-4 w-4 ${loadingOrders ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum pedido encontrado
                </p>
              ) : (
                <OrderKanban orders={orders} onStatusChange={handleStatusChange} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                Orçamentos Pendentes
                <Button variant="ghost" size="sm" onClick={() => fetchQuotes()} disabled={loadingQuotes}>
                  <RefreshCw className={`h-4 w-4 ${loadingQuotes ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingQuotes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : pendingQuotes.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhum orçamento pendente</p>
              ) : (
                <div className="space-y-3">
                  {pendingQuotes.map((quote) => (
                    <div key={quote.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{quote.number}</p>
                          <StatusBadge status={quote.status} type="quote" />
                        </div>
                        <p className="text-sm text-muted-foreground">{quote.client_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium text-foreground">{maskCurrency(Number(quote.total))}</p>
                        <Button
                          size="sm"
                          onClick={() => handleConvertQuote(quote.id)}
                          disabled={convertingQuoteId === quote.id}
                        >
                          {convertingQuoteId === quote.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Gerar Pedido
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <OrderForm
        open={orderFormOpen}
        onOpenChange={setOrderFormOpen}
        mode={orderFormMode}
        onSave={() => {
          fetchOrders();
          fetchQuotes();
        }}
      />
    </ManagementLayout>
  );
}
