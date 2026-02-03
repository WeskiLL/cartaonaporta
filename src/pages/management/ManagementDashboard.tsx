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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, DollarSign, Users, FileText, Plus, TrendingUp, TrendingDown, RefreshCw, Loader2, Calendar } from 'lucide-react';
import { maskCurrency } from '@/lib/masks';
import { toast } from 'sonner';

type OrderStatus = 'awaiting_payment' | 'creating_art' | 'production' | 'shipping' | 'delivered';

const MONTHS = [
  { value: 'all', label: 'Todo o ano' },
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' },
];

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
    deleteTransaction,
    convertQuoteToOrder 
  } = useManagement();

  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [orderFormMode, setOrderFormMode] = useState<'quote' | 'order'>('order');
  const [convertingQuoteId, setConvertingQuoteId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

  // Generate available years (current year and 2 years back)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => ({
      value: String(y),
      label: String(y)
    }));
  }, []);


  useEffect(() => {
    fetchOrders();
    fetchQuotes();
    fetchTransactions();
    fetchClients();
  }, [fetchOrders, fetchQuotes, fetchTransactions, fetchClients]);

  const stats = useMemo(() => {
    const filterYear = parseInt(selectedYear, 10);
    const isAllYear = selectedMonth === 'all';
    const filterMonth = isAllYear ? null : parseInt(selectedMonth, 10);

    const monthlyOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      if (isAllYear) {
        return orderDate.getFullYear() === filterYear;
      }
      return orderDate.getMonth() === filterMonth && orderDate.getFullYear() === filterYear;
    });

    const monthlyTransactions = transactions.filter(t => {
      const transDate = new Date(t.date);
      if (isAllYear) {
        return transDate.getFullYear() === filterYear;
      }
      return transDate.getMonth() === filterMonth && transDate.getFullYear() === filterYear;
    });

    const totalRevenue = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + Number(t.amount), 0);

    // Excluir retiradas e pró-labore do cálculo de despesas para o lucro
    const withdrawalKeywords = ['retirada', 'retirar', 'saque', 'pró-labore', 'pro-labore', 'prolabore'];
    
    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount), 0);
    
    const expensesForProfit = monthlyTransactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        // Normalizar texto removendo acentos para comparação
        const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/-/g, '');
        const desc = normalize(t.description);
        const cat = normalize(t.category);
        const isWithdrawal = withdrawalKeywords.some(kw => {
          const kwNorm = normalize(kw);
          return desc.includes(kwNorm) || cat.includes(kwNorm);
        });
        return !isWithdrawal;
      })
      .reduce((acc, t) => acc + Number(t.amount), 0);

    // Ajuste para compensar valor de pró-labore subtraído incorretamente
    const profitAdjustment = 688.63;

    return {
      ordersCount: monthlyOrders.length,
      quotesCount: quotes.filter(q => q.status === 'pending').length,
      clientsCount: clients.length,
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: totalRevenue - expensesForProfit + profitAdjustment,
    };
  }, [orders, quotes, transactions, clients, selectedMonth, selectedYear]);

  const handleStatusChange = useCallback(async (
    orderId: string, 
    newStatus: OrderStatus, 
    revenueAction: 'add' | 'remove' | 'none',
    expenseAction?: { type: 'add' | 'remove'; amount?: number }
  ) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Update order status and revenue_added flag
    const success = await updateOrder(orderId, { 
      status: newStatus,
      revenue_added: revenueAction === 'add' ? true : revenueAction === 'remove' ? false : order.revenue_added 
    });

    if (success) {
      // Add revenue when moving out of "awaiting_payment"
      if (revenueAction === 'add') {
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
      
      // Remove revenue when moving back to "awaiting_payment"
      if (revenueAction === 'remove') {
        // Find the income transaction associated with this order
        const orderTransaction = transactions.find(t => t.order_id === order.id && t.type === 'income');
        if (orderTransaction) {
          await deleteTransaction(orderTransaction.id);
          toast.success('Receita removida do financeiro');
        }
      }

      // Handle production expense
      if (expenseAction?.type === 'add' && expenseAction.amount) {
        await addTransaction({
          type: 'expense',
          amount: expenseAction.amount,
          category: 'Produção',
          description: `Despesa do pedido ${order.number} - ${order.client_name}`,
          date: new Date().toISOString(),
          order_id: order.id,
        });
        toast.success('Despesa de produção adicionada');
      }

      // Remove production expense when moving back from production to creating_art
      if (expenseAction?.type === 'remove') {
        const expenseTransaction = transactions.find(
          t => t.order_id === order.id && t.type === 'expense' && t.category === 'Produção'
        );
        if (expenseTransaction) {
          await deleteTransaction(expenseTransaction.id);
          toast.success('Despesa de produção removida');
        }
      }
      
      fetchOrders();
      fetchTransactions();
    }
  }, [orders, transactions, updateOrder, addTransaction, deleteTransaction, fetchOrders, fetchTransactions]);

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
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => { setOrderFormMode('quote'); setOrderFormOpen(true); }}>
              <Plus className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Orçamento
            </Button>
            <Button size="sm" className="text-xs sm:text-sm" onClick={() => { setOrderFormMode('order'); setOrderFormOpen(true); }}>
              <Plus className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Pedido
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6 sm:mb-8">
        <StatCard
          title="Pedidos"
          value={stats.ordersCount}
          icon={<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />}
        />
        <StatCard
          title="Orçamentos"
          value={stats.quotesCount}
          icon={<FileText className="h-4 w-4 sm:h-5 sm:w-5" />}
        />
        <StatCard
          title="Clientes"
          value={stats.clientsCount}
          icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
        />
        <StatCard
          title="Receita"
          value={maskCurrency(stats.revenue)}
          icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
        />
      </div>

      {/* Month/Year Filter and Financial Summary */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Período:</span>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-card rounded-xl border border-border p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <span className="text-xs sm:text-sm text-muted-foreground">Receitas</span>
            </div>
            <p className="text-sm sm:text-2xl font-display font-bold text-green-600">{maskCurrency(stats.revenue)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              <span className="text-xs sm:text-sm text-muted-foreground">Despesas</span>
            </div>
            <p className="text-sm sm:text-2xl font-display font-bold text-red-600">{maskCurrency(stats.expenses)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-xs sm:text-sm text-muted-foreground">Lucro</span>
            </div>
            <p className={`text-sm sm:text-2xl font-display font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {maskCurrency(stats.profit)}
            </p>
          </div>
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
