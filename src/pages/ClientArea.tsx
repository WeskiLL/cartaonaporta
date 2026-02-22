import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Truck, CheckCircle, Clock, Paintbrush, ExternalLink, Loader2, Copy, Info } from 'lucide-react';
import { toast } from 'sonner';

import logoPrimePrint from '@/assets/logo-prime-print.png';
import logoCartaoNaPorta from '@/assets/logo-cartao-na-porta.png';

const STATUS_CONFIG = [
  { id: 'awaiting_payment', label: 'Aguardando Pagamento', icon: Clock, color: 'text-amber-500' },
  { id: 'creating_art', label: 'Criando Arte', icon: Paintbrush, color: 'text-blue-500' },
  { id: 'production', label: 'Em Produção', icon: Package, color: 'text-orange-500' },
  { id: 'shipping', label: 'Em Transporte', icon: Truck, color: 'text-emerald-500' },
  { id: 'delivered', label: 'Entregue', icon: CheckCircle, color: 'text-green-600' },
] as const;

interface OrderData {
  number: string;
  status: string;
  created_at: string;
  client_name: string;
}

interface TrackingData {
  tracking_code: string;
  status: string;
  estimated_delivery: string | null;
  tracking_url: string;
}

interface CompanyData {
  name: string;
  logo_url: string | null;
}

export default function ClientArea() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);

  useEffect(() => {
    if (!orderNumber) return;

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-order-lookup?orderNumber=${encodeURIComponent(orderNumber)}`;
        const response = await fetch(url, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });

        if (!response.ok) {
          const errData = await response.json();
          setError(errData.error || 'Pedido não encontrado');
          return;
        }

        const result = await response.json();
        setOrder(result.order);
        setTracking(result.tracking);
        setCompany(result.company);
      } catch (err) {
        setError('Erro ao buscar informações do pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  const currentStatusIndex = order
    ? STATUS_CONFIG.findIndex(s => s.id === order.status)
    : -1;

  const isDelivered = order?.status === 'delivered';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#e85616]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pedido não encontrado</h2>
            <p className="text-gray-500">{error || 'O número de pedido informado não foi localizado.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-center gap-4">
          <img src={logoPrimePrint} alt="Prime Print" className="h-8 sm:h-10" />
          <div className="w-px h-8 bg-gray-300" />
          <img src={logoCartaoNaPorta} alt="Cartão na Porta" className="h-8 sm:h-10" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Delivered banner */}
        {isDelivered && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="w-9 h-9 text-white" />
                </div>
                <h2 className="text-xl font-bold text-green-700">Pedido Entregue!</h2>
                <p className="text-sm text-green-600">
                  Seu pedido foi entregue com sucesso. Obrigado pela preferência!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mt-1">
                Cliente: <span className="font-medium text-gray-700">{order.client_name}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Criado em {new Date(order.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {/* Status timeline */}
            <div className="space-y-0">
              {STATUS_CONFIG.map((status, index) => {
                const isActive = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const Icon = status.icon;

                return (
                  <div key={status.id} className="flex items-start gap-3">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isDelivered
                          ? 'bg-green-500 border-green-500 text-white'
                          : isCurrent
                            ? 'bg-[#e85616] border-[#e85616] text-white'
                            : isActive
                              ? 'bg-green-100 border-green-500 text-green-600'
                              : 'bg-gray-100 border-gray-300 text-gray-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {index < STATUS_CONFIG.length - 1 && (
                        <div className={`w-0.5 h-8 ${
                          isDelivered || (isActive && index < currentStatusIndex) ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                    {/* Label */}
                    <div className={`pt-1 ${
                      isDelivered
                        ? 'font-bold text-green-700'
                        : isCurrent
                          ? 'font-bold text-gray-900'
                          : isActive
                            ? 'text-gray-700'
                            : 'text-gray-400'
                    }`}>
                      <p className="text-sm">{status.label}</p>
                      {isCurrent && !isDelivered && (
                        <p className="text-xs text-[#e85616] font-medium mt-0.5">Status atual</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tracking info */}
        {tracking && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-[#e85616]" />
                <h2 className="text-lg font-bold text-gray-900">Rastreamento</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Código de Rastreio</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-mono font-bold text-[#e85616]">{tracking.tracking_code}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tracking.tracking_code);
                        toast.success('Código copiado!');
                      }}
                      className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                      title="Copiar código"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {tracking.estimated_delivery && (
                  <div>
                    <p className="text-sm text-gray-500">Previsão de Entrega</p>
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(tracking.estimated_delivery + 'T12:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {order.status === 'shipping' && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>O rastreio dos Correios costuma atualizar quando o material chega no estado de destino. Fique tranquilo, seu pedido está a caminho!</p>
                  </div>
                )}

                <Button
                  className="w-full bg-[#e85616] hover:bg-[#ee7e1a] mt-2"
                  onClick={() => window.open(tracking.tracking_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Rastrear nos Correios
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-400">
        <p>Powered by Prime Print</p>
      </footer>
    </div>
  );
}
