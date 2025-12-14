import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoPrimePrint from '@/assets/logo-prime-print.png';

interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  description: string;
}

interface TrackingData {
  id: string;
  order_number?: string;
  client_name: string;
  tracking_code: string;
  carrier: string;
  status: string;
  events: TrackingEvent[];
  last_update?: string;
}

export default function TrackingPublic() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTracking = async () => {
      if (!trackingCode) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        // Search by tracking_code instead of id
        const { data, error: fetchError } = await supabase
          .from('order_trackings' as any)
          .select('id, order_number, client_name, tracking_code, carrier, status, events, last_update')
          .eq('tracking_code', trackingCode.toUpperCase())
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) {
          setError(true);
          return;
        }
        
        setTracking({
          id: (data as any).id,
          order_number: (data as any).order_number,
          client_name: (data as any).client_name,
          tracking_code: (data as any).tracking_code,
          carrier: (data as any).carrier,
          status: (data as any).status,
          events: ((data as any).events as TrackingEvent[]) || [],
          last_update: (data as any).last_update,
        });
      } catch (err) {
        console.error('Error fetching tracking:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [trackingCode]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: 'Aguardando Postagem', color: 'bg-gray-500' },
      in_transit: { label: 'Em Trânsito', color: 'bg-blue-500' },
      out_for_delivery: { label: 'Saiu para Entrega', color: 'bg-green-500' },
      delivered: { label: 'Entregue', color: 'bg-emerald-600' },
      error: { label: 'Erro', color: 'bg-red-500' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#e85616]" />
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Rastreio não encontrado</h2>
            <p className="text-gray-500">
              O código de rastreio solicitado não foi encontrado ou o link expirou.
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
        <Card className="mb-6">
          <CardHeader className="text-center border-b pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#e85616]/10 rounded-full flex items-center justify-center">
                <Truck className="w-8 h-8 text-[#e85616]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Rastreamento de Pedido
            </CardTitle>
            {tracking.order_number && (
              <p className="text-gray-500 mt-1">{tracking.order_number}</p>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">Código de Rastreio</p>
              <p className="text-xl font-mono font-bold text-gray-900">{tracking.tracking_code}</p>
              <div className="mt-3">{getStatusBadge(tracking.status)}</div>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-1">Cliente</p>
              <p className="font-medium text-gray-900">{tracking.client_name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Movimentação</CardTitle>
          </CardHeader>
          <CardContent>
            {tracking.events && tracking.events.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
                
                <div className="space-y-6">
                  {tracking.events.map((event, idx) => (
                    <div key={idx} className="relative flex gap-4">
                      {/* Dot */}
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        idx === 0 ? 'bg-[#e85616] text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {idx === 0 ? (
                          <Truck className="w-4 h-4" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {event.date}
                          </span>
                          <span className="text-sm text-gray-500">{event.time}</span>
                        </div>
                        <p className="font-medium text-gray-900">{event.description}</p>
                        {event.location && (
                          <p className="text-sm text-gray-500">{event.location}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">
                  Ainda não há movimentações registradas para este rastreio.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  As informações serão atualizadas assim que o pacote for despachado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {tracking.last_update && (
          <p className="text-center text-sm text-gray-400 mt-4">
            Última atualização: {format(new Date(tracking.last_update), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-400">
        <p>Powered by Prime Print</p>
      </footer>
    </div>
  );
}
