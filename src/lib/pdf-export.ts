import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Quote, Order, Transaction, Company } from '@/types/management';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: string) =>
  format(new Date(date), "dd/MM/yyyy", { locale: ptBR });

// Helper to add company header
const addHeader = (doc: jsPDF, company: Company | null, title: string) => {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(company?.name || 'Empresa', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (company?.cnpj) doc.text(`CNPJ: ${company.cnpj}`, 14, 28);
  if (company?.phone) doc.text(`Tel: ${company.phone}`, 14, 34);
  if (company?.email) doc.text(`Email: ${company.email}`, 14, 40);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 55);
  
  return 60;
};

export const exportQuoteToPDF = (quote: Quote, company: Company | null) => {
  const doc = new jsPDF();
  let y = addHeader(doc, company, `Orçamento ${quote.number}`);
  
  // Quote info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${quote.client_name}`, 14, y);
  doc.text(`Data: ${formatDate(quote.created_at)}`, 14, y + 6);
  if (quote.valid_until) {
    doc.text(`Válido até: ${formatDate(quote.valid_until)}`, 14, y + 12);
  }
  
  y += 25;
  
  // Items table
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
      headStyles: { fillColor: [232, 86, 22] },
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Totals
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: ${formatCurrency(quote.subtotal)}`, 140, y, { align: 'left' });
  if (quote.discount > 0) {
    doc.text(`Desconto: ${formatCurrency(quote.discount)}`, 140, y + 6, { align: 'left' });
    y += 6;
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${formatCurrency(quote.total)}`, 140, y + 6, { align: 'left' });
  
  // Notes
  if (quote.notes) {
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Observações:', 14, y);
    doc.text(quote.notes, 14, y + 5);
  }
  
  doc.save(`orcamento-${quote.number}.pdf`);
};

export const exportOrderToPDF = (order: Order, company: Company | null) => {
  const doc = new jsPDF();
  let y = addHeader(doc, company, `Pedido ${order.number}`);
  
  // Order info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${order.client_name}`, 14, y);
  doc.text(`Data: ${formatDate(order.created_at)}`, 14, y + 6);
  doc.text(`Status: ${getOrderStatusLabel(order.status)}`, 14, y + 12);
  
  y += 25;
  
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
      headStyles: { fillColor: [232, 86, 22] },
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Totals
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: ${formatCurrency(order.subtotal)}`, 140, y, { align: 'left' });
  if (order.discount > 0) {
    doc.text(`Desconto: ${formatCurrency(order.discount)}`, 140, y + 6, { align: 'left' });
    y += 6;
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${formatCurrency(order.total)}`, 140, y + 6, { align: 'left' });
  
  doc.save(`pedido-${order.number}.pdf`);
};

export const exportFinancialReportToPDF = (
  transactions: Transaction[],
  company: Company | null,
  period: { start: string; end: string }
) => {
  const doc = new jsPDF();
  let y = addHeader(doc, company, 'Relatório Financeiro');
  
  // Period
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${formatDate(period.start)} a ${formatDate(period.end)}`, 14, y);
  
  y += 15;
  
  // Summary
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receitas: ${formatCurrency(income)}`, 14, y + 8);
  doc.text(`Despesas: ${formatCurrency(expense)}`, 14, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Saldo: ${formatCurrency(balance)}`, 14, y + 22);
  
  y += 35;
  
  // Transactions table
  if (transactions.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
      body: transactions.map(t => [
        formatDate(t.date),
        t.type === 'income' ? 'Receita' : 'Despesa',
        t.category,
        t.description,
        formatCurrency(t.amount),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [232, 86, 22] },
      columnStyles: {
        4: { halign: 'right' },
      },
    });
  }
  
  doc.save(`relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
