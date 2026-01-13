import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

const WHATSAPP_NUMBER = '5574981138033';

/**
 * Uploads a PDF to Supabase storage and returns the public URL
 */
export const uploadPdfToStorage = async (
  doc: jsPDF,
  fileName: string
): Promise<string | null> => {
  try {
    // Convert PDF to blob
    const pdfBlob = doc.output('blob');
    
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${fileName}_${timestamp}.pdf`;
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('pdf-exports')
      .upload(uniqueFileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false,
      });
    
    if (error) {
      console.error('Error uploading PDF:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('pdf-exports')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadPdfToStorage:', error);
    return null;
  }
};

/**
 * Opens WhatsApp with a pre-filled message containing the PDF link
 */
export const shareViaWhatsApp = (
  pdfUrl: string,
  documentType: 'order' | 'quote',
  documentNumber: string,
  clientName: string,
  clientPhone?: string
): void => {
  const typeLabel = documentType === 'order' ? 'Pedido' : 'Orçamento';
  const docNumber = documentType === 'order' 
    ? documentNumber.replace('PED', '') 
    : documentNumber.replace('ORC', '');
  
  const message = encodeURIComponent(
    `Olá${clientName ? `, ${clientName}` : ''}! 🙂\n\n` +
    `Segue o link do seu *${typeLabel} #${docNumber}*:\n\n` +
    `📄 ${pdfUrl}\n\n` +
    `Qualquer dúvida, estamos à disposição!`
  );
  
  // Use client phone if available, otherwise use company's WhatsApp
  const phone = clientPhone?.replace(/\D/g, '') || WHATSAPP_NUMBER;
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
  
  window.open(whatsappUrl, '_blank');
};

/**
 * Generates PDF, uploads to storage, and opens WhatsApp share
 */
export const uploadAndSharePdf = async (
  doc: jsPDF,
  documentType: 'order' | 'quote',
  documentNumber: string,
  clientName: string,
  clientPhone?: string
): Promise<boolean> => {
  const typeLabel = documentType === 'order' ? 'Pedido' : 'Orcamento';
  const docNumber = documentType === 'order' 
    ? documentNumber.replace('PED', '') 
    : documentNumber.replace('ORC', '');
  
  const fileName = `${typeLabel}_${docNumber}`;
  
  const pdfUrl = await uploadPdfToStorage(doc, fileName);
  
  if (!pdfUrl) {
    return false;
  }
  
  shareViaWhatsApp(pdfUrl, documentType, documentNumber, clientName, clientPhone);
  
  return true;
};
