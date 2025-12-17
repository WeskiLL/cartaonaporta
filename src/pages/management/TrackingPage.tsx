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
import { Plus, Truck, Copy, ExternalLink, Trash2, Loader2, Package, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useManagement } from '@/contexts/ManagementContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { maskPhone } from '@/lib/masks';

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
  client_phone?: string;
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
  // Removido: refreshing state não é mais necessário

  // Form state
  const [formData, setFormData] = useState({
    order_id: '',
    client_name: '',
    client_phone: '',
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
          client_phone: formData.client_phone || null,
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
        client_phone: '',
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

  const handleRefresh = (tracking: TrackingItem) => {
    // Abre o site de rastreamento dos Correios em uma nova aba
    window.open(`https://www.linkcorreios.com.br/${tracking.tracking_code}`, '_blank');
    toast.info('Site dos Correios aberto em nova aba');
  };

  const copyShareLink = (tracking: TrackingItem) => {
    // Link direto para o site de rastreamento dos Correios
    const shareLink = `https://www.linkcorreios.com.br/${tracking.tracking_code}`;
    navigator.clipboard.writeText(shareLink);
    toast.success('Link copiado!');
  };

  const sendWhatsAppNotification = (tracking: TrackingItem, latestEvent?: TrackingEvent) => {
    const phone = tracking.client_phone?.replace(/\D/g, '');
    if (!phone) {
      toast.error('Cliente não tem WhatsApp cadastrado');
      return;
    }
    
    // Link direto para o site de rastreamento dos Correios
    const shareLink = `https://www.linkcorreios.com.br/${tracking.tracking_code}`;
    
    let message = `Olá ${tracking.client_name}! 📦\n\n`;
    message += `Seu pedido${tracking.order_number ? ` ${tracking.order_number}` : ''} foi enviado!\n\n`;
    message += `📦 Código de rastreio: *${tracking.tracking_code}*\n\n`;
    message += `Acompanhe seu pedido clicando no link:\n${shareLink}\n\n`;
    message += `Prime Print - Sua marca, nossa impressão! ✨`;
    
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
                  <Label>WhatsApp do Cliente (para notificações)</Label>
                  <Input
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_phone: maskPhone(e.target.value) }))}
                    placeholder="(74) 98113-8033"
                    maxLength={15}
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
        <div className="grid gap-3 sm:gap-4">
          {trackings.map(tracking => (
            <Card key={tracking.id}>
              <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                        <span className="font-mono text-xs sm:text-sm tracking-wider text-primary font-bold break-all">
                          {tracking.tracking_code}
                        </span>
                        {getStatusBadge(tracking.status)}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {tracking.client_name}
                        {tracking.order_number && ` • ${tracking.order_number}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRefresh(tracking)}
                      title="Ver rastreio no site dos Correios"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:text-green-700"
                      onClick={() => sendWhatsAppNotification(tracking)}
                      title="Enviar WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyShareLink(tracking)}
                      title="Copiar link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(tracking.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                {tracking.events && tracking.events.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {tracking.events.slice(0, 3).map((event, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-xs sm:text-sm">
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
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        + {tracking.events.length - 3} eventos anteriores
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Nenhum evento registrado. Clique em atualizar para buscar informações.
                  </p>
                )}
                {tracking.last_update && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3">
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
