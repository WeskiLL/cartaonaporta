import { useEffect, useMemo } from 'react';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { PageHeader } from '@/components/management/PageHeader';
import { StatCard } from '@/components/management/StatCard';
import { useManagement } from '@/contexts/ManagementContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, TrendingUp, Package, DollarSign, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { exportFinancialReportToPDF } from '@/lib/pdf-export';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsPage() {
  const { 
    orders, transactions, clients, products,
    fetchOrders, fetchTransactions, fetchClients, fetchProducts,
    loadingOrders, loadingTransactions, company
  } = useManagement();

  useEffect(() => {
    fetchOrders();
    fetchTransactions();
    fetchClients();
    fetchProducts();
  }, [fetchOrders, fetchTransactions, fetchClients, fetchProducts]);

  // Monthly revenue data (last 6 months)
  const monthlyRevenueData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthOrders = orders.filter(o => {
        const orderDate = parseISO(o.created_at);
        return orderDate >= start && orderDate <= end;
      });
      
      const revenue = monthOrders.reduce((sum, o) => sum + o.total, 0);
      
      months.push({
        name: format(date, 'MMM', { locale: ptBR }),
        receita: revenue,
      });
    }
    return months;
  }, [orders]);

  // Profit data (income vs expense)
  const profitData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthTransactions = transactions.filter(t => {
        const tDate = parseISO(t.date);
        return tDate >= start && tDate <= end;
      });
      
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      months.push({
        name: format(date, 'MMM', { locale: ptBR }),
        receitas: income,
        despesas: expense,
        lucro: income - expense,
      });
    }
    return months;
  }, [transactions]);

  // Top products by order quantity
  const topProductsData = useMemo(() => {
    const productCount: Record<string, { name: string; count: number; revenue: number }> = {};
    
    orders.forEach(order => {
      order.items?.forEach(item => {
        const key = item.product_name;
        if (!productCount[key]) {
          productCount[key] = { name: key, count: 0, revenue: 0 };
        }
        productCount[key].count += item.quantity;
        productCount[key].revenue += item.total;
      });
    });
    
    return Object.values(productCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders]);

  // Summary stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const totalClients = clients.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleExportFinancial = () => {
    const start = startOfMonth(subMonths(new Date(), 5));
    const end = endOfMonth(new Date());
    exportFinancialReportToPDF(transactions, company, {
      start: start.toISOString(),
      end: end.toISOString(),
    });
  };

  const isLoading = loadingOrders || loadingTransactions;

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <PageHeader
        title="Relatórios"
        description="Análise de vendas, lucro e produtos"
        actions={
          <Button onClick={handleExportFinancial}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Financeiro
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Receita Total"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Total de Pedidos"
          value={totalOrders.toString()}
          icon={<Package className="w-5 h-5" />}
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(avgOrderValue)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Clientes Ativos"
          value={totalClients.toString()}
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={(v) => `R$${v / 1000}k`} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lucro Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={(v) => `R$${v / 1000}k`} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Line type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                <Line type="monotone" dataKey="lucro" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={topProductsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percent }) => `${name.slice(0, 15)}... ${(percent * 100).toFixed(0)}%`}
                  >
                    {topProductsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, 'Quantidade']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {topProductsData.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium text-sm truncate max-w-[200px]">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{product.count} un.</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
                {topProductsData.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum produto vendido ainda
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ManagementLayout>
  );
}
