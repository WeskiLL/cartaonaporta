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

// Helper to sanitize filename (remove special characters)
const sanitizeFileName = (name: string): string => {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length
};

export const exportQuoteToPDF = async (quote: Quote, company: Company | null, client?: Client | null) => {
  const doc = await generateQuotePDF(quote, company, client);
  const quoteNumber = quote.number.replace('ORC', '');
  const clientName = sanitizeFileName(client?.name || quote.client_name);
  doc.save(`Orcamento_${quoteNumber}_${clientName}.pdf`);
};

// ============= NEW ORDER PDF LAYOUT - CLEAN & PROFESSIONAL =============
export const generateOrderPDF = async (order: Order, company: Company | null, client?: Client | null): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const margin = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;
  
  // ==================== HEADER BAR ====================
  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, pageWidth, 6, 'F');
  
  y = 14;
  
  // ==================== LOGO AND ORDER INFO HEADER ====================
  const logoMaxWidth = 40;
  const logoMaxHeight = 20;
  let logoEndX = margin;
  
  // Add logo if available
  if (company?.logo_url) {
    try {
      const imgData = await loadImageAsBase64(company.logo_url);
      if (imgData) {
        doc.addImage(imgData, 'PNG', margin, y, logoMaxWidth, logoMaxHeight);
        logoEndX = margin + logoMaxWidth + 8;
      }
    } catch {
      // Logo failed, continue without it
    }
  }
  
  // Order info box on right side
  const orderBoxWidth = 60;
  const orderBoxX = pageWidth - margin - orderBoxWidth;
  
  // Order number and date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_ORANGE);
  doc.text('PEDIDO', orderBoxX, y + 4);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  const orderNumber = order.number.replace('PED', '#');
  doc.text(orderNumber, orderBoxX, y + 12);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Emitido em: ${formatDateTime(order.created_at)}`, orderBoxX, y + 18);
  
  y = y + logoMaxHeight + 8;
  
  // ==================== COMPANY INFO SECTION ====================
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F');
  
  const companyPadding = 4;
  let companyY = y + companyPadding + 4;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_ORANGE);
  doc.text(company?.name || 'Empresa', margin + companyPadding, companyY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  const col1X = margin + companyPadding;
  const col2X = margin + contentWidth / 2;
  companyY += 6;
  
  if (company?.cnpj) {
    doc.text(`CNPJ: ${company.cnpj}`, col1X, companyY);
  }
  if (company?.phone) {
    doc.text(`WhatsApp: ${company.phone}`, col2X, companyY);
  }
  companyY += 5;
  
  if (company?.email) {
    doc.text(`E-mail: ${company.email}`, col1X, companyY);
  }
  if (company?.website) {
    doc.text(`Site: ${company.website}`, col2X, companyY);
  }
  companyY += 5;
  
  if (company?.address) {
    const fullAddr = [company.address, company.city, company.state, company.zip_code].filter(Boolean).join(' - ');
    doc.text(`Endereço: ${fullAddr}`, col1X, companyY);
  }
  
  y += 32;
  
  // ==================== CLIENT AND DELIVERY - SIDE BY SIDE ====================
  const boxHeight = 38;
  const boxWidth = (contentWidth - 4) / 2;
  
  // Client box
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, 'S');
  
  // Delivery box
  doc.roundedRect(margin + boxWidth + 4, y, boxWidth, boxHeight, 2, 2, 'S');
  
  // Client section header
  doc.setFillColor(...BRAND_ORANGE);
  doc.roundedRect(margin, y, boxWidth, 7, 2, 2, 'F');
  doc.rect(margin, y + 3, boxWidth, 4, 'F'); // Square off bottom corners
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DADOS DO CLIENTE', margin + 4, y + 5);
  
  // Delivery section header
  doc.setFillColor(...BRAND_ORANGE);
  doc.roundedRect(margin + boxWidth + 4, y, boxWidth, 7, 2, 2, 'F');
  doc.rect(margin + boxWidth + 4, y + 3, boxWidth, 4, 'F');
  
  doc.text('ENDEREÇO DE ENTREGA', margin + boxWidth + 8, y + 5);
  
  // Client content
  let clientY = y + 13;
  const clientX = margin + 4;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  
  doc.setFont('helvetica', 'bold');
  doc.text(client?.name || order.client_name, clientX, clientY);
  doc.setFont('helvetica', 'normal');
  
  if (client?.document) {
    clientY += 5;
    doc.text(`CPF/CNPJ: ${client.document}`, clientX, clientY);
  }
  if (client?.phone) {
    clientY += 5;
    doc.text(`WhatsApp: ${client.phone}`, clientX, clientY);
  }
  if (client?.email) {
    clientY += 5;
    doc.text(`E-mail: ${client.email}`, clientX, clientY);
  }
  
  // Delivery content
  let addrY = y + 13;
  const addrX = margin + boxWidth + 8;
  const addr = order.delivery_address as unknown as DeliveryAddress | null;
  
  if (addr) {
    const streetLine = `${addr.street || ''}${addr.number ? ', ' + addr.number : ''}${addr.complement ? ' - ' + addr.complement : ''}`;
    doc.text(streetLine.substring(0, 50), addrX, addrY);
    
    if (addr.neighborhood) {
      addrY += 5;
      doc.text(`Bairro: ${addr.neighborhood}`, addrX, addrY);
    }
    
    addrY += 5;
    doc.text(`${addr.city || ''} - ${addr.state || ''}`, addrX, addrY);
    
    if (addr.zip_code) {
      addrY += 5;
      doc.text(`CEP: ${addr.zip_code}`, addrX, addrY);
    }
  } else {
    doc.setTextColor(150, 150, 150);
    doc.text('Não informado', addrX, addrY);
  }
  
  y += boxHeight + 6;
  
  // ==================== STATUS BAR ====================
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  
  // Status
  doc.text('STATUS:', margin + 4, y + 6.5);
  doc.setTextColor(...BRAND_ORANGE);
  doc.text(getOrderStatusLabel(order.status).toUpperCase(), margin + 22, y + 6.5);
  
  // Notes indicator if present
  if (order.notes) {
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('(com observações)', margin + 75, y + 6.5);
  }
  
  y += 14;
  
  // ==================== PRODUCTS TABLE ====================
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_ORANGE);
  doc.text('ITENS DO PEDIDO', margin, y);
  y += 4;
  
  if (order.items && order.items.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Produto/Serviço', 'Qtd', 'Valor Unit.', 'Subtotal']],
      body: order.items.map(item => [
        item.product_name,
        item.quantity.toString(),
        formatCurrency(item.unit_price),
        formatCurrency(item.total),
      ]),
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: BRAND_ORANGE,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [255, 248, 245],
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 'auto' },
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'right', cellWidth: 28 },
        3: { halign: 'right', cellWidth: 28 },
      },
      margin: { left: margin, right: margin },
    });
    
    y = (doc as any).lastAutoTable.finalY + 6;
  }
  
  // ==================== TOTALS SECTION ====================
  const totalsBoxWidth = 70;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;
  
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(totalsBoxX, y, totalsBoxWidth, 34, 2, 2, 'F');
  
  const labelX = totalsBoxX + 4;
  const valueX = totalsBoxX + totalsBoxWidth - 4;
  let totalsY = y + 7;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  // Subtotal
  doc.text('Subtotal:', labelX, totalsY);
  doc.text(formatCurrency(order.subtotal), valueX, totalsY, { align: 'right' });
  totalsY += 6;
  
  // Discount
  if (order.discount > 0) {
    doc.text('Desconto:', labelX, totalsY);
    doc.setTextColor(220, 38, 38);
    doc.text(`- ${formatCurrency(order.discount)}`, valueX, totalsY, { align: 'right' });
    doc.setTextColor(80, 80, 80);
    totalsY += 6;
  }
  
  // Shipping
  if (order.shipping && order.shipping > 0) {
    doc.text('Frete:', labelX, totalsY);
    doc.text(formatCurrency(order.shipping), valueX, totalsY, { align: 'right' });
    totalsY += 6;
  }
  
  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(labelX, totalsY, valueX, totalsY);
  totalsY += 5;
  
  // Total
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_ORANGE);
  doc.text('TOTAL:', labelX, totalsY);
  doc.text(formatCurrency(order.total), valueX, totalsY, { align: 'right' });
  
  y += 40;
  
  // ==================== NOTES SECTION (if present) ====================
  if (order.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_ORANGE);
    doc.text('OBSERVAÇÕES', margin, y);
    
    y += 5;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'S');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    // Wrap text within box
    const notesLines = doc.splitTextToSize(order.notes, contentWidth - 8);
    doc.text(notesLines.slice(0, 3), margin + 4, y + 6);
  }
  
  // ==================== FOOTER BAR ====================
  doc.setFillColor(...BRAND_ORANGE_LIGHT);
  doc.rect(0, 287, pageWidth, 10, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text('Documento gerado automaticamente pelo sistema', pageWidth / 2, 293, { align: 'center' });
  
  return doc;
};

export const exportOrderToPDF = async (order: Order, company: Company | null, client?: Client | null) => {
  const doc = await generateOrderPDF(order, company, client);
  const orderNumber = order.number.replace('PED', '');
  const clientName = sanitizeFileName(client?.name || order.client_name);
  doc.save(`Pedido_${orderNumber}_${clientName}.pdf`);
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
