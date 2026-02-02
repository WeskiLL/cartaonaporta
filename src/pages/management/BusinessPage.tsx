import { useEffect, useMemo, useState } from 'react';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { PageHeader } from '@/components/management/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useManagement } from '@/contexts/ManagementContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  Percent, 
  BarChart3, 
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  ShoppingCart,
  Wallet
} from 'lucide-react';
import { maskCurrency } from '@/lib/masks';

interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

const KPICard = ({ title, value, description, icon, trend, trendValue, className }: KPICardProps) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {trend && getTrendIcon()}
          {trendValue && <span className={`text-xs ${getTrendColor()}`}>{trendValue}</span>}
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
};

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

export default function BusinessPage() {
  const { orders, transactions, clients, fetchOrders, fetchTransactions, fetchClients } = useManagement();
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear].map(y => ({
      value: String(y),
      label: String(y)
    }));
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchTransactions();
    fetchClients();
  }, [fetchOrders, fetchTransactions, fetchClients]);

  const kpis = useMemo(() => {
    const filterYear = parseInt(selectedYear, 10);
    const isAllYear = selectedMonth === 'all';
    const filterMonth = isAllYear ? null : parseInt(selectedMonth, 10);
    const previousYear = filterYear - 1;
    const previousMonth = filterMonth !== null ? filterMonth : null;

    // Filter data by year and optionally month
    const filterByPeriod = (date: Date, year: number, month: number | null) => {
      if (month === null) {
        return date.getFullYear() === year;
      }
      return date.getFullYear() === year && date.getMonth() === month;
    };

    const yearTransactions = transactions.filter(t => 
      filterByPeriod(new Date(t.date), filterYear, filterMonth)
    );
    const previousYearTransactions = transactions.filter(t => 
      filterByPeriod(new Date(t.date), previousYear, previousMonth)
    );

    const yearOrders = orders.filter(o => 
      filterByPeriod(new Date(o.created_at), filterYear, filterMonth)
    );
    const previousYearOrders = orders.filter(o => 
      filterByPeriod(new Date(o.created_at), previousYear, previousMonth)
    );

    const yearClients = clients.filter(c => 
      filterByPeriod(new Date(c.created_at), filterYear, filterMonth)
    );

    // Calculate revenue and expenses
    const revenue = yearTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + Number(t.amount), 0);
    
    const previousRevenue = previousYearTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const expenses = yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const previousExpenses = previousYearTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const profit = revenue - expenses;
    const previousProfit = previousRevenue - previousExpenses;

    // Marketing expenses for CAC calculation
    const marketingExpenses = yearTransactions
      .filter(t => t.type === 'expense' && 
        (t.category.toLowerCase().includes('marketing') || 
         t.category.toLowerCase().includes('publicidade') ||
         t.category.toLowerCase().includes('propaganda')))
      .reduce((acc, t) => acc + Number(t.amount), 0);

    // New customers this year
    const newCustomers = yearClients.length;

    // === CALCULATE KPIs ===

    // 1. ROI (Return on Investment)
    const roi = expenses > 0 ? ((revenue - expenses) / expenses) * 100 : 0;

    // 2. Net Margin (Margem Líquida)
    const netMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // 3. CAC (Customer Acquisition Cost)
    const cac = newCustomers > 0 ? marketingExpenses / newCustomers : 0;

    // 4. Revenue CAGR
    const revenueCAGR = previousRevenue > 0 
      ? ((revenue / previousRevenue) - 1) * 100 
      : 0;

    // 5. Profit CAGR
    const profitCAGR = previousProfit > 0 && profit > 0
      ? ((profit / previousProfit) - 1) * 100 
      : previousProfit < 0 && profit > 0 ? 100 : 0;

    // 6. Average Ticket (Ticket Médio)
    const avgTicket = yearOrders.length > 0 
      ? yearOrders.reduce((acc, o) => acc + Number(o.total || 0), 0) / yearOrders.length 
      : 0;

    // 7. Previous year average ticket for comparison
    const prevAvgTicket = previousYearOrders.length > 0
      ? previousYearOrders.reduce((acc, o) => acc + Number(o.total || 0), 0) / previousYearOrders.length
      : 0;

    // 8. Customer Lifetime Value (simplified: average revenue per customer)
    const totalCustomers = clients.length;
    const ltv = totalCustomers > 0 ? revenue / totalCustomers : 0;

    // 9. Gross Profit Margin (assuming all expenses are operational)
    const grossMargin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;

    // 10. Revenue per Order
    const revenuePerOrder = yearOrders.length > 0 ? revenue / yearOrders.length : 0;

    // 11. Orders count change
    const ordersGrowth = previousYearOrders.length > 0 
      ? ((yearOrders.length - previousYearOrders.length) / previousYearOrders.length) * 100 
      : 0;

    // 12. Break-even point (simplified)
    const breakEvenRevenue = expenses; // Revenue needed to cover all expenses

    // 13. Operating Margin (Margem Operacional)
    const operatingMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // 14. Expense Ratio
    const expenseRatio = revenue > 0 ? (expenses / revenue) * 100 : 0;

    // Monthly data for trends
    const monthlyData = Array.from({ length: 12 }, (_, month) => {
      const monthTransactions = yearTransactions.filter(t => 
        new Date(t.date).getMonth() === month
      );
      const monthRevenue = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + Number(t.amount), 0);
      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + Number(t.amount), 0);
      
      return {
        month,
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses
      };
    });

    return {
      revenue,
      previousRevenue,
      expenses,
      previousExpenses,
      profit,
      previousProfit,
      roi,
      netMargin,
      cac,
      revenueCAGR,
      profitCAGR,
      avgTicket,
      prevAvgTicket,
      ltv,
      grossMargin,
      revenuePerOrder,
      ordersGrowth,
      ordersCount: yearOrders.length,
      previousOrdersCount: previousYearOrders.length,
      newCustomers,
      totalCustomers,
      breakEvenRevenue,
      operatingMargin,
      expenseRatio,
      monthlyData,
      marketingExpenses
    };
  }, [transactions, orders, clients, selectedYear, selectedMonth]);

  const getTrend = (current: number, previous: number): 'up' | 'down' | 'neutral' => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getPeriodLabel = () => {
    if (selectedMonth === 'all') return 'do período';
    const monthName = MONTHS.find(m => m.value === selectedMonth)?.label || '';
    return `de ${monthName}`;
  };


  return (
    <ManagementLayout>
      <PageHeader
        title="Indicadores de Negócio"
        description="Análise de KPIs e métricas financeiras da empresa"
      />

      {/* Period Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
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

      {/* Main Financial KPIs */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Resumo Financeiro</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Receita Total"
            value={maskCurrency(kpis.revenue)}
            description={`Receita ${getPeriodLabel()}`}
            icon={<DollarSign className="h-4 w-4 text-primary" />}
            trend={getTrend(kpis.revenue, kpis.previousRevenue)}
            trendValue={kpis.previousRevenue > 0 ? formatPercent(kpis.revenueCAGR) : undefined}
          />
          <KPICard
            title="Despesas Totais"
            value={maskCurrency(kpis.expenses)}
            description={`Despesas ${getPeriodLabel()}`}
            icon={<Wallet className="h-4 w-4 text-primary" />}
            trend={getTrend(kpis.previousExpenses, kpis.expenses)}
            trendValue={kpis.previousExpenses > 0 ? formatPercent(((kpis.expenses - kpis.previousExpenses) / kpis.previousExpenses) * 100) : undefined}
          />
          <KPICard
            title="Lucro Líquido"
            value={maskCurrency(kpis.profit)}
            description={`Lucro ${getPeriodLabel()}`}
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            trend={getTrend(kpis.profit, kpis.previousProfit)}
            trendValue={kpis.previousProfit > 0 ? formatPercent(kpis.profitCAGR) : undefined}
          />
          <KPICard
            title="Pedidos"
            value={kpis.ordersCount}
            description={`Total ${getPeriodLabel()}`}
            icon={<ShoppingCart className="h-4 w-4 text-primary" />}
            trend={getTrend(kpis.ordersCount, kpis.previousOrdersCount)}
            trendValue={kpis.previousOrdersCount > 0 ? formatPercent(kpis.ordersGrowth) : undefined}
          />
        </div>
      </div>

      {/* Profitability KPIs */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Indicadores de Rentabilidade</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="ROI"
            value={`${kpis.roi.toFixed(1)}%`}
            description="Retorno sobre Investimento"
            icon={<Target className="h-4 w-4 text-primary" />}
            trend={kpis.roi > 0 ? 'up' : kpis.roi < 0 ? 'down' : 'neutral'}
          />
          <KPICard
            title="Margem Líquida"
            value={`${kpis.netMargin.toFixed(1)}%`}
            description="Lucro / Receita"
            icon={<Percent className="h-4 w-4 text-primary" />}
            trend={kpis.netMargin > 15 ? 'up' : kpis.netMargin < 5 ? 'down' : 'neutral'}
          />
          <KPICard
            title="Margem Bruta"
            value={`${kpis.grossMargin.toFixed(1)}%`}
            description="Margem sobre vendas"
            icon={<BarChart3 className="h-4 w-4 text-primary" />}
            trend={kpis.grossMargin > 30 ? 'up' : kpis.grossMargin < 10 ? 'down' : 'neutral'}
          />
          <KPICard
            title="Taxa de Despesas"
            value={`${kpis.expenseRatio.toFixed(1)}%`}
            description="Despesas / Receita"
            icon={<TrendingDown className="h-4 w-4 text-primary" />}
            trend={kpis.expenseRatio < 70 ? 'up' : kpis.expenseRatio > 90 ? 'down' : 'neutral'}
          />
        </div>
      </div>

      {/* Growth KPIs */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Indicadores de Crescimento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="CAGR Receita"
            value={`${kpis.revenueCAGR >= 0 ? '+' : ''}${kpis.revenueCAGR.toFixed(1)}%`}
            description="Crescimento anual de receita"
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            trend={kpis.revenueCAGR > 0 ? 'up' : kpis.revenueCAGR < 0 ? 'down' : 'neutral'}
          />
          <KPICard
            title="CAGR Lucro"
            value={`${kpis.profitCAGR >= 0 ? '+' : ''}${kpis.profitCAGR.toFixed(1)}%`}
            description="Crescimento anual de lucro"
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            trend={kpis.profitCAGR > 0 ? 'up' : kpis.profitCAGR < 0 ? 'down' : 'neutral'}
          />
          <KPICard
            title="Crescimento de Pedidos"
            value={`${kpis.ordersGrowth >= 0 ? '+' : ''}${kpis.ordersGrowth.toFixed(1)}%`}
            description="vs. ano anterior"
            icon={<ShoppingCart className="h-4 w-4 text-primary" />}
            trend={kpis.ordersGrowth > 0 ? 'up' : kpis.ordersGrowth < 0 ? 'down' : 'neutral'}
          />
          <KPICard
            title="Novos Clientes"
            value={kpis.newCustomers}
            description="Clientes adquiridos no ano"
            icon={<Users className="h-4 w-4 text-primary" />}
            trend={kpis.newCustomers > 0 ? 'up' : 'neutral'}
          />
        </div>
      </div>

      {/* Customer KPIs */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Indicadores de Clientes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="CAC"
            value={maskCurrency(kpis.cac)}
            description="Custo de Aquisição de Cliente"
            icon={<Users className="h-4 w-4 text-primary" />}
            trend={kpis.cac < kpis.ltv ? 'up' : 'down'}
          />
          <KPICard
            title="LTV"
            value={maskCurrency(kpis.ltv)}
            description="Lifetime Value por cliente"
            icon={<DollarSign className="h-4 w-4 text-primary" />}
            trend={kpis.ltv > kpis.cac ? 'up' : 'neutral'}
          />
          <KPICard
            title="LTV/CAC"
            value={kpis.cac > 0 ? (kpis.ltv / kpis.cac).toFixed(2) : '∞'}
            description="Relação valor/custo de cliente"
            icon={<Calculator className="h-4 w-4 text-primary" />}
            trend={kpis.cac > 0 && kpis.ltv / kpis.cac > 3 ? 'up' : kpis.ltv / kpis.cac < 1 ? 'down' : 'neutral'}
          />
          <KPICard
            title="Total de Clientes"
            value={kpis.totalCustomers}
            description="Base total de clientes"
            icon={<Users className="h-4 w-4 text-primary" />}
            trend="neutral"
          />
        </div>
      </div>

      {/* Ticket and Performance KPIs */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Performance de Vendas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Ticket Médio"
            value={maskCurrency(kpis.avgTicket)}
            description="Valor médio por pedido"
            icon={<ShoppingCart className="h-4 w-4 text-primary" />}
            trend={getTrend(kpis.avgTicket, kpis.prevAvgTicket)}
            trendValue={kpis.prevAvgTicket > 0 ? formatPercent(((kpis.avgTicket - kpis.prevAvgTicket) / kpis.prevAvgTicket) * 100) : undefined}
          />
          <KPICard
            title="Receita por Pedido"
            value={maskCurrency(kpis.revenuePerOrder)}
            description="Receita média por pedido"
            icon={<DollarSign className="h-4 w-4 text-primary" />}
            trend="neutral"
          />
          <KPICard
            title="Ponto de Equilíbrio"
            value={maskCurrency(kpis.breakEvenRevenue)}
            description="Receita necessária para cobrir despesas"
            icon={<Target className="h-4 w-4 text-primary" />}
            trend={kpis.revenue >= kpis.breakEvenRevenue ? 'up' : 'down'}
          />
          <KPICard
            title="Despesas de Marketing"
            value={maskCurrency(kpis.marketingExpenses)}
            description="Investimento em marketing"
            icon={<Wallet className="h-4 w-4 text-primary" />}
            trend="neutral"
          />
        </div>
      </div>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Mensal</CardTitle>
          <CardDescription>Evolução mês a mês no ano de {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Mês</th>
                  <th className="text-right py-2 px-3 font-medium">Receita</th>
                  <th className="text-right py-2 px-3 font-medium">Despesas</th>
                  <th className="text-right py-2 px-3 font-medium">Lucro</th>
                  <th className="text-right py-2 px-3 font-medium">Margem</th>
                </tr>
              </thead>
              <tbody>
                {kpis.monthlyData.map((data, index) => {
                  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                  const margin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
                  const hasData = data.revenue > 0 || data.expenses > 0;
                  
                  return (
                    <tr key={index} className={`border-b ${!hasData ? 'opacity-50' : ''}`}>
                      <td className="py-2 px-3">{monthNames[data.month]}</td>
                      <td className="text-right py-2 px-3 text-green-600">{maskCurrency(data.revenue)}</td>
                      <td className="text-right py-2 px-3 text-red-600">{maskCurrency(data.expenses)}</td>
                      <td className={`text-right py-2 px-3 font-medium ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {maskCurrency(data.profit)}
                      </td>
                      <td className={`text-right py-2 px-3 ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {margin.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-muted/50">
                  <td className="py-2 px-3">Total</td>
                  <td className="text-right py-2 px-3 text-green-600">{maskCurrency(kpis.revenue)}</td>
                  <td className="text-right py-2 px-3 text-red-600">{maskCurrency(kpis.expenses)}</td>
                  <td className={`text-right py-2 px-3 ${kpis.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {maskCurrency(kpis.profit)}
                  </td>
                  <td className={`text-right py-2 px-3 ${kpis.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis.netMargin.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </ManagementLayout>
  );
}
