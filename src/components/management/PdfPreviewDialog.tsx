import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, X } from 'lucide-react';
import jsPDF from 'jspdf';

interface PdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  generatePdf: () => jsPDF | Promise<jsPDF>;
}

export function PdfPreviewDialog({ 
  open, 
  onOpenChange, 
  title, 
  generatePdf
}: PdfPreviewDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<jsPDF | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      const generate = async () => {
        try {
          const pdfDoc = await generatePdf();
          setDoc(pdfDoc);
          const blob = pdfDoc.output('blob');
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        } catch (error) {
          console.error('Error generating PDF preview:', error);
        } finally {
          setLoading(false);
        }
      };
      generate();
    } else {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      setDoc(null);
    }
  }, [open, generatePdf]);

  const handleDownload = () => {
    if (doc) {
      doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Pré-visualização: {title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-lg border border-border bg-muted/50 min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full min-h-[500px]"
              title="PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Erro ao gerar pré-visualização
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Fechar
          </Button>
          <Button onClick={handleDownload} disabled={!doc}>
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
