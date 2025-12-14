import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { PageHeader } from '@/components/management/PageHeader';
import { StatCard } from '@/components/management/StatCard';
import { StatusBadge } from '@/components/management/StatusBadge';
import { useManagement } from '@/contexts/ManagementContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, DollarSign, Users, FileText, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { maskCurrency } from '@/lib/masks';

export default function ManagementDashboard() {
  const { orders, quotes, transactions, clients, fetchOrders, fetchQuotes, fetchTransactions, fetchClients, loadingOrders } = useManagement();

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

  const recentOrders = orders.slice(0, 5);

  return (
    <ManagementLayout>
      <PageHeader
        title="Dashboard"
        description="Visão geral do seu negócio"
        actions={
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/admin/gestao/pedidos/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Pedido
              </Link>
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

      {/* Recent Orders */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-foreground">Pedidos Recentes</h2>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/gestao/pedidos">Ver todos</Link>
          </Button>
        </div>
        {loadingOrders ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : recentOrders.length === 0 ? (
          <p className="text-muted-foreground">Nenhum pedido encontrado</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{order.number}</p>
                  <p className="text-sm text-muted-foreground">{order.client_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{maskCurrency(Number(order.total))}</p>
                  <StatusBadge status={order.status} type="order" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ManagementLayout>
  );
}
