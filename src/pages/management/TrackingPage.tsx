import { useEffect, useState } from 'react';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { PageHeader } from '@/components/management/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Truck, Copy, ExternalLink, Trash2, Loader2, RefreshCw, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useManagement } from '@/contexts/ManagementContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  description: string;
}

interface TrackingItem {
  id: string;
  order_id?: string;
  order_number?: string;
  client_name: string;
  client_email?: string;
  tracking_code: string;
  carrier: string;
  status: string;
  last_update?: string;
  events: TrackingEvent[];
  created_at: string;
  updated_at: string;
}

export default function TrackingPage() {
  const { orders, fetchOrders } = useManagement();
  const [trackings, setTrackings] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    order_id: '',
    client_name: '',
    client_email: '',
    tracking_code: '',
    carrier: 'correios',
  });

  useEffect(() => {
    fetchTrackings();
    fetchOrders();
  }, []);

  const fetchTrackings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_trackings' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrackings((data || []).map((t: any) => ({
        ...t,
        events: (t.events as TrackingEvent[]) || [],
      })));
    } catch (error) {
      console.error('Error fetching trackings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    if (orderId === 'none') {
      setFormData(prev => ({ ...prev, order_id: '' }));
      return;
    }
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setFormData(prev => ({
        ...prev,
        order_id: orderId,
        client_name: order.client_name,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tracking_code || !formData.client_name) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const order = orders.find(o => o.id === formData.order_id);
      const { data, error } = await supabase
        .from('order_trackings' as any)
        .insert([{
          order_id: formData.order_id || null,
          order_number: order?.number || null,
          client_name: formData.client_name,
          client_email: formData.client_email || null,
          tracking_code: formData.tracking_code,
          carrier: formData.carrier,
          status: 'pending',
          events: [],
        }])
        .select()
        .single();

      if (error) throw error;

      setTrackings(prev => [{
        ...(data as any),
        events: [],
      }, ...prev]);
      setDialogOpen(false);
      setFormData({
        order_id: '',
        client_name: '',
        client_email: '',
        tracking_code: '',
        carrier: 'correios',
      });
      toast.success('Rastreio adicionado!');
    } catch (error) {
      console.error('Error adding tracking:', error);
      toast.error('Erro ao adicionar rastreio');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este rastreio?')) return;

    try {
      const { error } = await supabase
        .from('order_trackings' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTrackings(prev => prev.filter(t => t.id !== id));
      toast.success('Rastreio excluído!');
    } catch (error) {
      console.error('Error deleting tracking:', error);
      toast.error('Erro ao excluir rastreio');
    }
  };

  const handleRefresh = async (tracking: TrackingItem) => {
    setRefreshing(tracking.id);
    try {
      const { data, error } = await supabase.functions.invoke('check-tracking', {
        body: { trackingCode: tracking.tracking_code, carrier: tracking.carrier },
      });

      if (error) throw error;

      if (data?.events) {
        // Update tracking with new events
        const { error: updateError } = await supabase
          .from('order_trackings' as any)
          .update({
            events: data.events,
            status: data.status || tracking.status,
            last_update: new Date().toISOString(),
          })
          .eq('id', tracking.id);

        if (updateError) throw updateError;

        setTrackings(prev => prev.map(t => 
          t.id === tracking.id 
            ? { ...t, events: data.events, status: data.status || t.status, last_update: new Date().toISOString() }
            : t
        ));

        // Send email notification if there are new events
        if (tracking.client_email && data.events.length > (tracking.events?.length || 0)) {
          await supabase.functions.invoke('send-tracking-notification', {
            body: {
              email: tracking.client_email,
              clientName: tracking.client_name,
              trackingCode: tracking.tracking_code,
              orderNumber: tracking.order_number,
              latestEvent: data.events[0],
            },
          });
          toast.success('Notificação enviada por email!');
        } else {
          toast.success('Rastreio atualizado!');
        }
      }
    } catch (error) {
      console.error('Error refreshing tracking:', error);
      toast.error('Erro ao atualizar rastreio');
    } finally {
      setRefreshing(null);
    }
  };

  const copyShareLink = (tracking: TrackingItem) => {
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/rastreio/${tracking.id}`;
    navigator.clipboard.writeText(shareLink);
    toast.success('Link copiado!');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Aguardando', variant: 'secondary' },
      in_transit: { label: 'Em Trânsito', variant: 'default' },
      out_for_delivery: { label: 'Saiu para Entrega', variant: 'default' },
      delivered: { label: 'Entregue', variant: 'outline' },
      error: { label: 'Erro', variant: 'destructive' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <ManagementLayout>
      <PageHeader
        title="Rastreio de Pedidos"
        description="Monitore os códigos de rastreio dos Correios"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Rastreio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Rastreio</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Pedido (opcional)</Label>
                  <Select value={formData.order_id || 'none'} onValueChange={handleOrderSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar pedido" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {orders.map(order => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.number} - {order.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nome do Cliente *</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder="Nome do cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email do Cliente (para notificações)</Label>
                  <Input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
                    placeholder="cliente@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Código de Rastreio *</Label>
                  <Input
                    value={formData.tracking_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, tracking_code: e.target.value.toUpperCase() }))}
                    placeholder="Ex: AA123456789BR"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Transportadora</Label>
                  <Select value={formData.carrier} onValueChange={(v) => setFormData(prev => ({ ...prev, carrier: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="correios">Correios</SelectItem>
                      <SelectItem value="jadlog">Jadlog</SelectItem>
                      <SelectItem value="sedex">Sedex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Adicionar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : trackings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum rastreio cadastrado</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Rastreio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trackings.map(tracking => (
            <Card key={tracking.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="w-5 h-5 text-primary" />
                      {tracking.tracking_code}
                      {getStatusBadge(tracking.status)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tracking.client_name}
                      {tracking.order_number && ` • ${tracking.order_number}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRefresh(tracking)}
                      disabled={refreshing === tracking.id}
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing === tracking.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyShareLink(tracking)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(`/rastreio/${tracking.id}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(tracking.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tracking.events && tracking.events.length > 0 ? (
                  <div className="space-y-3">
                    {tracking.events.slice(0, 3).map((event, idx) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <div className="text-muted-foreground whitespace-nowrap">
                          {event.date} {event.time}
                        </div>
                        <div>
                          <p className="font-medium">{event.description}</p>
                          {event.location && (
                            <p className="text-muted-foreground">{event.location}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {tracking.events.length > 3 && (
                      <p className="text-sm text-muted-foreground">
                        + {tracking.events.length - 3} eventos anteriores
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum evento registrado. Clique em atualizar para buscar informações.
                  </p>
                )}
                {tracking.last_update && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Última atualização: {format(new Date(tracking.last_update), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ManagementLayout>
  );
}
