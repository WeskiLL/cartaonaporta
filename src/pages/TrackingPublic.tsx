import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoPrimePrint from '@/assets/logo-prime-print.png';

export default function TrackingPublic() {
  const { trackingCode } = useParams<{ trackingCode: string }>();

  // Redirecionar automaticamente para o site de rastreamento
  useEffect(() => {
    if (trackingCode) {
      // Aguarda um momento para mostrar a página e depois redireciona
      const timer = setTimeout(() => {
        window.location.href = `https://www.linkcorreios.com.br/${trackingCode}`;
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [trackingCode]);

  const handleRedirect = () => {
    if (trackingCode) {
      window.location.href = `https://www.linkcorreios.com.br/${trackingCode}`;
    }
  };

  if (!trackingCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Truck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Código não informado</h2>
            <p className="text-gray-500">
              O código de rastreio não foi informado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-center">
          <img src={logoPrimePrint} alt="Prime Print" className="h-10" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#e85616]/10 rounded-full flex items-center justify-center">
                <Truck className="w-8 h-8 text-[#e85616]" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Rastreamento de Pedido
            </h2>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Código de Rastreio</p>
              <p className="text-xl font-mono font-bold text-[#e85616]">{trackingCode}</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-500 mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Redirecionando para o site dos Correios...</span>
            </div>

            <Button 
              onClick={handleRedirect}
              className="bg-[#e85616] hover:bg-[#ee7e1a]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Rastrear nos Correios
            </Button>

            <p className="text-xs text-gray-400 mt-6">
              Você será redirecionado automaticamente em alguns segundos.
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-400">
        <p>Powered by Prime Print</p>
      </footer>
    </div>
  );
}
