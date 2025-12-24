import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Quote, Order, Transaction, Company, DeliveryAddress, Client } from '@/types/management';

// Brand colors
const BRAND_ORANGE = [232, 86, 22] as [number, number, number]; // #e85616
const BRAND_ORANGE_LIGHT = [238, 126, 26] as [number, number, number]; // #ee7e1a

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: string) =>
  format(new Date(date), "dd/MM/yyyy", { locale: ptBR });

const formatDateTime = (date: string) =>
  format(new Date(date), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });

// Helper to load image as base64
const loadImageAsBase64 = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

// Helper to add company header with logo and complete data (OLD VERSION for quotes/financial)
const addHeader = async (doc: jsPDF, company: Company | null, title: string): Promise<number> => {
  // Orange header bar
  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, 210, 8, 'F');
  
  let startY = 15;
  
  // Add company logo if available
  if (company?.logo_url) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // Calculate proportional dimensions (max height 25mm)
          const maxHeight = 25;
          const maxWidth = 50;
          let width = img.width;
          let height = img.height;
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          doc.addImage(img, 'PNG', 14, startY, width, height);
          resolve();
        };
        img.onerror = () => reject();
        img.src = company.logo_url!;
      });
      
      startY += 30;
    } catch {
      // If logo fails, continue without it
    }
  }
  
  // Company name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_ORANGE);
  doc.text(company?.name || 'Empresa', 14, startY);
  
  // Company details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  let detailY = startY + 6;
  
  if (company?.cnpj) {
    doc.text(`CNPJ: ${company.cnpj}`, 14, detailY);
    detailY += 4;
  }
  if (company?.phone) {
    doc.text(`Tel: ${company.phone}`, 14, detailY);
    detailY += 4;
  }
  if (company?.email) {
    doc.text(`Email: ${company.email}`, 14, detailY);
    detailY += 4;
  }
  if (company?.address) {
    const fullAddress = [
      company.address,
      company.city,
      company.state,
      company.zip_code
    ].filter(Boolean).join(' - ');
    doc.text(fullAddress, 14, detailY);
    detailY += 4;
  }
  if (company?.website) {
    doc.text(company.website, 14, detailY);
    detailY += 4;
  }
  
  // Document title
  detailY += 6;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_ORANGE);
  doc.text(title, 14, detailY);
  
  doc.setTextColor(0, 0, 0);
  return detailY + 8;
};

// Helper to add client info section (OLD VERSION for quotes)
const addClientInfo = (doc: jsPDF, client: Client | null, clientName: string, y: number): number => {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_ORANGE);
  doc.text('Dados do Cliente', 14, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  
  y += 6;
  doc.text(`Nome: ${client?.name || clientName}`, 14, y);
  
  if (client?.document) {
    y += 4;
    doc.text(`CPF/CNPJ: ${client.document}`, 14, y);
  }
  if (client?.phone) {
    y += 4;
    doc.text(`Telefone: ${client.phone}`, 14, y);
  }
  if (client?.email) {
    y += 4;
    doc.text(`Email: ${client.email}`, 14, y);
  }
  if (client?.address) {
    y += 4;
    const fullAddress = [
      client.address,
      client.city,
      client.state,
      client.zip_code
    ].filter(Boolean).join(' - ');
    doc.text(`Endereço: ${fullAddress}`, 14, y);
  }
  
  return y + 8;
};

export const generateQuotePDF = async (quote: Quote, company: Company | null, client?: Client | null): Promise<jsPDF> => {
  const doc = new jsPDF();
  const quoteNumber = quote.number.replace('ORC', '');
  let y = await addHeader(doc, company, `Orçamento_${quoteNumber}`);
  
  // Client info
  y = addClientInfo(doc, client || null, quote.client_name, y);
  
  // Quote dates
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Data: ${formatDate(quote.created_at)}`, 14, y);
  if (quote.valid_until) {
    doc.text(`Válido até: ${formatDate(quote.valid_until)}`, 80, y);
  }
  
  y += 10;
  
  // Items table - using total price per item (not unit price)
  if (quote.items && quote.items.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Produto', 'Qtd', 'Valor']],
      body: quote.items.map(item => [
        item.product_name,
        item.quantity.toString(),
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
  
  return doc;
};

export const exportQuoteToPDF = async (quote: Quote, company: Company | null, client?: Client | null) => {
  const doc = await generateQuotePDF(quote, company, client);
  const quoteNumber = quote.number.replace('ORC', '');
  doc.save(`Orçamento_${quoteNumber}.pdf`);
};

// ============= NEW ORDER PDF LAYOUT =============
export const generateOrderPDF = async (order: Order, company: Company | null, client?: Client | null): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const margin = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;
  
  // ==================== HEADER ====================
  // Line 1: Date/Time on left, Order number on right
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  // Created date on left
  doc.text(`CRIANDO EM: ${formatDateTime(order.created_at)}`, margin, y);
  
  // Order number on right
  const orderNumber = order.number.replace('PED', '');
  doc.text(`PEDIDO: ${orderNumber}`, pageWidth - margin, y, { align: 'right' });
  
  y += 8;
  
  // ==================== LOGO AND COMPANY INFO ====================
  const logoHeight = 25;
  const logoWidth = 35;
  const companyInfoX = margin + logoWidth + 10;
  
  // Add logo if available
  if (company?.logo_url) {
    try {
      const imgData = await loadImageAsBase64(company.logo_url);
      if (imgData) {
        doc.addImage(imgData, 'PNG', margin, y, logoWidth, logoHeight);
      }
    } catch {
      // Logo failed, continue without it
    }
  }
  
  // Company info aligned to right of logo
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(company?.name || '', pageWidth - margin, y + 4, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  let companyY = y + 9;
  
  if (company?.cnpj) {
    doc.text(`CNPJ: `, pageWidth - margin - 50, companyY);
    doc.setTextColor(...BRAND_ORANGE);
    doc.text(company.cnpj, pageWidth - margin, companyY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    companyY += 5;
  }
  
  if (company?.phone) {
    doc.text(`WhatsApp: `, pageWidth - margin - 50, companyY);
    doc.setTextColor(...BRAND_ORANGE);
    doc.text(company.phone, pageWidth - margin, companyY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    companyY += 5;
  }
  
  if (company?.email) {
    doc.text(`E-mail: `, pageWidth - margin - 50, companyY);
    doc.setTextColor(...BRAND_ORANGE);
    doc.text(company.email, pageWidth - margin, companyY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    companyY += 5;
  }
  
  if (company?.address) {
    doc.text(`Endereço: `, pageWidth - margin - 50, companyY);
    doc.setTextColor(...BRAND_ORANGE);
    doc.text(company.address, pageWidth - margin, companyY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    companyY += 5;
  }
  
  if (company?.city) {
    doc.text(`Cidade: `, pageWidth - margin - 50, companyY);
    doc.setTextColor(...BRAND_ORANGE);
    doc.text(`${company.city}${company.state ? '-' + company.state : ''}`, pageWidth - margin, companyY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    companyY += 5;
  }
  
  y += logoHeight + 10;
  
  // ==================== DADOS DO CLIENTE (Section Title) ====================
  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 8;
  
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('DADOS DO CLIENTE', margin, y);
  
  // Horizontal line below title
  y += 3;
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 8;
  
  // ==================== CLIENT INFO AND DELIVERY ADDRESS (side by side) ====================
  const halfWidth = contentWidth / 2;
  const deliveryAddrX = margin + halfWidth + 5;
  
  // Client info (left side)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  doc.text(`Cliente: `, margin, y);
  doc.setTextColor(...BRAND_ORANGE);
  doc.text(client?.name || order.client_name, margin + 18, y);
  doc.setTextColor(0, 0, 0);
  
  let clientY = y + 5;
  
  if (client?.document) {
    doc.text(`CPF/CNPJ: `, margin, clientY);
    doc.setTextColor(...BRAND_ORANGE);
    doc.text(client.document, margin + 22, clientY);
    doc.setTextColor(0, 0, 0);
    clientY += 5;
  }
  
  if (client?.phone) {
    doc.text(`WhatsApp: `, margin, clientY);
    doc.setTextColor(...BRAND_ORANGE);
    doc.text(client.phone, margin + 22, clientY);
    doc.setTextColor(0, 0, 0);
    clientY += 5;
  }
  
  // Delivery address (right side)
  const addr = order.delivery_address as unknown as DeliveryAddress | null;
  
  doc.setFont('helvetica', 'bold');
  doc.text('ENDEREÇO DE ENTREGA', deliveryAddrX, y);
  doc.setFont('helvetica', 'normal');
  
  let addrY = y + 5;
  
  if (addr) {
    doc.text(`Endereço: `, deliveryAddrX, addrY);
    doc.setTextColor(...BRAND_ORANGE);
    doc.text(`${addr.street || ''}${addr.number ? ', ' + addr.number : ''}`, deliveryAddrX + 22, addrY);
    doc.setTextColor(0, 0, 0);
    addrY += 5;
    
    if (addr.neighborhood) {
      doc.text(`Bairro: `, deliveryAddrX, addrY);
      doc.setTextColor(...BRAND_ORANGE);
      doc.text(addr.neighborhood, deliveryAddrX + 16, addrY);
      doc.setTextColor(0, 0, 0);
      addrY += 5;
    }
    
    doc.text(`Cidade: `, deliveryAddrX, addrY);
    doc.setTextColor(...BRAND_ORANGE);
    doc.text(`${addr.city || ''}/${addr.state || ''}`, deliveryAddrX + 16, addrY);
    doc.setTextColor(0, 0, 0);
    addrY += 5;
    
    if (addr.zip_code) {
      doc.text(`CEP: `, deliveryAddrX, addrY);
      doc.setTextColor(...BRAND_ORANGE);
      doc.text(addr.zip_code, deliveryAddrX + 12, addrY);
      doc.setTextColor(0, 0, 0);
      addrY += 5;
    }
  }
  
  y = Math.max(clientY, addrY) + 8;
  
  // ==================== STATUS AND PAYMENT METHOD ====================
  // Horizontal line
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`STATUS: ${getOrderStatusLabel(order.status).toUpperCase()}`, margin, y);
  
  // Payment method - placeholder (can be extended later)
  doc.text(`MÉTODO DE PAG: PIX`, pageWidth - margin, y, { align: 'right' });
  
  y += 4;
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  
  // ==================== PRODUCTS TABLE ====================
  if (order.items && order.items.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Produto/Serviço', 'Quanti', 'Valor Uni.', 'Sub-Total']],
      body: order.items.map(item => [
        item.product_name,
        item.quantity.toString(),
        formatCurrency(item.unit_price),
        formatCurrency(item.total),
      ]),
      theme: 'plain',
      styles: {
        fontSize: 11,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: { bottom: 0.5 },
        lineColor: [200, 200, 200],
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 90 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
    });
    
    y = (doc as any).lastAutoTable.finalY + 5;
  }
  
  // ==================== TOTALS (right aligned) ====================
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const totalsX = pageWidth - margin - 50;
  const valuesX = pageWidth - margin;
  
  // Sub-total
  doc.text('Sub-total:', totalsX, y, { align: 'right' });
  doc.text(formatCurrency(order.subtotal), valuesX, y, { align: 'right' });
  y += 6;
  
  // Discount (if any)
  if (order.discount > 0) {
    doc.text('Desconto:', totalsX, y, { align: 'right' });
    doc.text(formatCurrency(order.discount), valuesX, y, { align: 'right' });
    y += 6;
  }
  
  // Shipping (if any)
  if (order.shipping && order.shipping > 0) {
    doc.text('Frete:', totalsX, y, { align: 'right' });
    doc.text(formatCurrency(order.shipping), valuesX, y, { align: 'right' });
    y += 6;
  }
  
  // Total
  y += 4;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Valor pago:', totalsX, y, { align: 'right' });
  doc.text(formatCurrency(order.total), valuesX, y, { align: 'right' });
  
  return doc;
};

export const exportOrderToPDF = async (order: Order, company: Company | null, client?: Client | null) => {
  const doc = await generateOrderPDF(order, company, client);
  const orderNumber = order.number.replace('PED', '');
  doc.save(`Pedido_${orderNumber}.pdf`);
};

export const generateFinancialReportPDF = async (
  transactions: Transaction[],
  company: Company | null,
  period: { start: string; end: string },
  reportType: 'all' | 'income' | 'expense' = 'all'
): Promise<jsPDF> => {
  const doc = new jsPDF();
  
  const titleMap = {
    all: 'Relatório Financeiro',
    income: 'Relatório de Receitas',
    expense: 'Relatório de Despesas',
  };
  
  let y = await addHeader(doc, company, titleMap[reportType]);
  
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
  
  return doc;
};

export const exportFinancialReportToPDF = async (
  transactions: Transaction[],
  company: Company | null,
  period: { start: string; end: string },
  reportType: 'all' | 'income' | 'expense' = 'all'
) => {
  const doc = await generateFinancialReportPDF(transactions, company, period, reportType);
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
