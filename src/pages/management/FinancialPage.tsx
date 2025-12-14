import { useEffect, useState } from 'react';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { PageHeader } from '@/components/management/PageHeader';
import { StatCard } from '@/components/management/StatCard';
import { useManagement } from '@/contexts/ManagementContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Loader2, ArrowUpCircle, ArrowDownCircle, FileText, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Transaction, TransactionType } from '@/types/management';
import { maskCurrency, unmask } from '@/lib/masks';
import { exportFinancialReportToPDF } from '@/lib/pdf-export';

const INCOME_CATEGORIES = ['Vendas', 'Serviços', 'Outros'];
const EXPENSE_CATEGORIES = ['Material', 'Frete', 'Marketing', 'Salários', 'Aluguel', 'Impostos', 'Outros'];

export default function FinancialPage() {
  const { transactions, loadingTransactions, fetchTransactions, addTransaction, deleteTransaction, company } = useManagement();
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<TransactionType>('income');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });
  
  // Report filters
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState<'all' | 'income' | 'expense'>('all');
  const [reportStartDate, setReportStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportEndDate, setReportEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => 
    activeTab === 'all' ? true : t.type === activeTab
  );

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const openNewTransaction = (type: TransactionType) => {
    setFormType(type);
    setFormData({
      description: '',
      amount: '',
      category: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(unmask(formData.amount).replace(',', '.')) / 100;
    if (isNaN(amount) || amount <= 0) {
      toast.error('Valor inválido');
      return;
    }

    const result = await addTransaction({
      type: formType,
      description: formData.description,
      amount,
      category: formData.category,
      date: formData.date,
      notes: formData.notes || undefined,
    });

    if (result) {
      toast.success('Transação adicionada!');
      setFormOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta transação?')) {
      const success = await deleteTransaction(id);
      if (success) toast.success('Transação excluída!');
    }
  };

  const handleGenerateReport = () => {
    // Filter transactions by date range
    const start = parseISO(reportStartDate);
    const end = parseISO(reportEndDate);
    
    const filteredByDate = transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start, end });
    });
    
    if (filteredByDate.length === 0) {
      toast.error('Nenhuma transação encontrada no período selecionado');
      return;
    }
    
    exportFinancialReportToPDF(
      filteredByDate,
      company,
      { start: reportStartDate, end: reportEndDate },
      reportType
    );
    
    toast.success('Relatório gerado com sucesso!');
    setReportOpen(false);
  };

  return (
    <ManagementLayout>
      <PageHeader
        title="Financeiro"
        description="Controle de receitas e despesas"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => setReportOpen(true)}>
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Gerar</span> Relatório
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => openNewTransaction('expense')}>
              <ArrowDownCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Despesa
            </Button>
            <Button size="sm" className="text-xs sm:text-sm" onClick={() => openNewTransaction('income')}>
              <ArrowUpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Receita
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Receitas"
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp className="w-5 h-5" />}
          className="border-green-500/20"
        />
        <StatCard
          title="Despesas"
          value={formatCurrency(totalExpense)}
          icon={<TrendingDown className="w-5 h-5" />}
          className="border-red-500/20"
        />
        <StatCard
          title="Saldo"
          value={formatCurrency(balance)}
          icon={<DollarSign className="w-5 h-5" />}
          className={balance >= 0 ? 'border-green-500/20' : 'border-red-500/20'}
        />
      </div>

      {/* Transactions List */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expense">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loadingTransactions ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma transação encontrada
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map(transaction => (
                <Card key={transaction.id}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start sm:items-center justify-between gap-2">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        <div className={`p-1.5 sm:p-2 rounded-full shrink-0 ${transaction.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          {transaction.type === 'income' 
                            ? <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                            : <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground text-sm sm:text-base truncate">{transaction.description}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {transaction.category} • {format(new Date(transaction.date), "dd/MM/yy", { locale: ptBR })}
                          </p>
                          <span className={`sm:hidden text-sm font-semibold ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <span className={`hidden sm:block font-semibold ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(transaction.id)}>
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

      {/* Transaction Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formType === 'income' ? 'Nova Receita' : 'Nova Despesa'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: maskCurrency(e.target.value) }))}
                  placeholder="R$ 0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {(formType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Report Generator Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Gerar Relatório Financeiro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as typeof reportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Completo (Receitas e Despesas)</SelectItem>
                  <SelectItem value="income">Apenas Receitas</SelectItem>
                  <SelectItem value="expense">Apenas Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerateReport}>
                <FileText className="w-4 h-4 mr-2" />
                Gerar PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ManagementLayout>
  );
}
