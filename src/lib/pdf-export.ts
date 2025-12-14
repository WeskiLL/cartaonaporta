import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Quote, Order, Transaction, Company, DeliveryAddress } from '@/types/management';

// Brand colors
const BRAND_ORANGE = [232, 86, 22] as [number, number, number]; // #e85616
const BRAND_ORANGE_LIGHT = [238, 126, 26] as [number, number, number]; // #ee7e1a

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: string) =>
  format(new Date(date), "dd/MM/yyyy", { locale: ptBR });

// Helper to add company header with brand colors
const addHeader = (doc: jsPDF, company: Company | null, title: string) => {
  // Orange header bar
  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, 210, 8, 'F');
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_ORANGE);
  doc.text(company?.name || 'Empresa', 14, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  if (company?.cnpj) doc.text(`CNPJ: ${company.cnpj}`, 14, 30);
  if (company?.phone) doc.text(`Tel: ${company.phone}`, 14, 36);
  if (company?.email) doc.text(`Email: ${company.email}`, 14, 42);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_ORANGE);
  doc.text(title, 14, 57);
  
  doc.setTextColor(0, 0, 0);
  return 62;
};

export const exportQuoteToPDF = (quote: Quote, company: Company | null) => {
  const doc = new jsPDF();
  let y = addHeader(doc, company, `Orçamento ${quote.number}`);
  
  // Quote info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Cliente: ${quote.client_name}`, 14, y);
  doc.text(`Data: ${formatDate(quote.created_at)}`, 14, y + 6);
  if (quote.valid_until) {
    doc.text(`Válido até: ${formatDate(quote.valid_until)}`, 14, y + 12);
  }
  
  y += 25;
  
  // Items table with brand colors
  if (quote.items && quote.items.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Produto', 'Qtd', 'Valor Unit.', 'Total']],
      body: quote.items.map(item => [
        item.product_name,
        item.quantity.toString(),
        formatCurrency(item.unit_price),
        formatCurrency(item.total),
      ]),
      theme: 'grid',
      headStyles: { fillColor: BRAND_ORANGE, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [255, 245, 240] },
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Totals
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Subtotal: ${formatCurrency(quote.subtotal)}`, 140, y, { align: 'left' });
  if (quote.discount > 0) {
    doc.text(`Desconto: ${formatCurrency(quote.discount)}`, 140, y + 6, { align: 'left' });
    y += 6;
  }
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_ORANGE);
  doc.text(`Total: ${formatCurrency(quote.total)}`, 140, y + 6, { align: 'left' });
  
  // Notes
  if (quote.notes) {
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Observações:', 14, y);
    doc.text(quote.notes, 14, y + 5);
  }
  
  // Footer bar
  doc.setFillColor(...BRAND_ORANGE_LIGHT);
  doc.rect(0, 285, 210, 12, 'F');
  
  doc.save(`orcamento-${quote.number}.pdf`);
};

export const exportOrderToPDF = (order: Order, company: Company | null) => {
  const doc = new jsPDF();
  let y = addHeader(doc, company, `Pedido ${order.number}`);
  
  // Order info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Cliente: ${order.client_name}`, 14, y);
  doc.text(`Data: ${formatDate(order.created_at)}`, 14, y + 6);
  doc.text(`Status: ${getOrderStatusLabel(order.status)}`, 14, y + 12);
  
  y += 20;
  
  // Delivery address if exists
  if (order.delivery_address) {
    const addr = order.delivery_address as unknown as DeliveryAddress;
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_ORANGE);
    doc.text('Endereço de Entrega:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    y += 6;
    doc.text(`${addr.street || ''}${addr.number ? ', ' + addr.number : ''}`, 14, y);
    y += 5;
    if (addr.complement) {
      doc.text(addr.complement, 14, y);
      y += 5;
    }
    doc.text(`${addr.neighborhood || ''} - ${addr.city || ''}/${addr.state || ''}`, 14, y);
    y += 5;
    doc.text(`CEP: ${addr.zip_code || ''}`, 14, y);
    y += 10;
  }
  
  y += 5;
  
  // Items table
  if (order.items && order.items.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Produto', 'Qtd', 'Valor Unit.', 'Total']],
      body: order.items.map(item => [
        item.product_name,
        item.quantity.toString(),
        formatCurrency(item.unit_price),
        formatCurrency(item.total),
      ]),
      theme: 'grid',
      headStyles: { fillColor: BRAND_ORANGE, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [255, 245, 240] },
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Totals
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Subtotal: ${formatCurrency(order.subtotal)}`, 140, y, { align: 'left' });
  if (order.discount > 0) {
    doc.text(`Desconto: ${formatCurrency(order.discount)}`, 140, y + 6, { align: 'left' });
    y += 6;
  }
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_ORANGE);
  doc.text(`Total: ${formatCurrency(order.total)}`, 140, y + 6, { align: 'left' });
  
  // Footer bar
  doc.setFillColor(...BRAND_ORANGE_LIGHT);
  doc.rect(0, 285, 210, 12, 'F');
  
  doc.save(`pedido-${order.number}.pdf`);
};

export const exportFinancialReportToPDF = (
  transactions: Transaction[],
  company: Company | null,
  period: { start: string; end: string },
  reportType: 'all' | 'income' | 'expense' = 'all'
) => {
  const doc = new jsPDF();
  
  const titleMap = {
    all: 'Relatório Financeiro',
    income: 'Relatório de Receitas',
    expense: 'Relatório de Despesas',
  };
  
  let y = addHeader(doc, company, titleMap[reportType]);
  
  // Period
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Período: ${formatDate(period.start)} a ${formatDate(period.end)}`, 14, y);
  
  y += 15;
  
  // Filter by type
  const filteredTransactions = reportType === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === reportType);
  
  // Summary
  const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_ORANGE);
  doc.text('Resumo', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  if (reportType === 'all' || reportType === 'income') {
    doc.text(`Receitas: ${formatCurrency(income)}`, 14, y + 8);
  }
  if (reportType === 'all' || reportType === 'expense') {
    doc.text(`Despesas: ${formatCurrency(expense)}`, 14, y + (reportType === 'all' ? 14 : 8));
  }
  if (reportType === 'all') {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(balance >= 0 ? 34 : 220, balance >= 0 ? 139 : 38, balance >= 0 ? 34 : 38);
    doc.text(`Saldo: ${formatCurrency(balance)}`, 14, y + 22);
  }
  
  y += reportType === 'all' ? 35 : 20;
  
  // Transactions table
  if (filteredTransactions.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
      body: filteredTransactions.map(t => [
        formatDate(t.date),
        t.type === 'income' ? 'Receita' : 'Despesa',
        t.category,
        t.description,
        formatCurrency(t.amount),
      ]),
      theme: 'grid',
      headStyles: { fillColor: BRAND_ORANGE, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [255, 245, 240] },
      columnStyles: {
        4: { halign: 'right' },
      },
    });
  }
  
  // Footer bar
  doc.setFillColor(...BRAND_ORANGE_LIGHT);
  doc.rect(0, 285, 210, 12, 'F');
  
  doc.save(`relatorio-${reportType === 'all' ? 'financeiro' : reportType === 'income' ? 'receitas' : 'despesas'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

const getOrderStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    awaiting_payment: 'Aguardando Pagamento',
    creating_art: 'Criando Arte',
    production: 'Em Produção',
    shipping: 'Enviado',
    delivered: 'Entregue',
  };
  return labels[status] || status;
};
