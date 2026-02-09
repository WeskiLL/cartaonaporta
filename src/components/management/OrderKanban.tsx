import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Order, Client, Company, ManagementProduct } from '@/types/management';
import { maskCurrency } from '@/lib/masks';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ExternalLink, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportOrderToPDF } from '@/lib/pdf-export';
import whatsappIcon from '@/assets/whatsapp-icon.png';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const ORDER_STATUSES = [
  { id: 'awaiting_payment', label: 'Aguardando Pagamento', color: 'bg-amber-500' },
  { id: 'creating_art', label: 'Criando Arte', color: 'bg-blue-500' },
  { id: 'production', label: 'Em Produção', color: 'bg-orange-500' },
  { id: 'shipping', label: 'Em Transporte', color: 'bg-emerald-500' },
  { id: 'delivered', label: 'Entregue', color: 'bg-green-500' },
] as const;

type OrderStatus = typeof ORDER_STATUSES[number]['id'];

interface ExpenseAction {
  type: 'add' | 'remove';
  orderId: string;
  orderNumber: string;
}

interface OrderKanbanProps {
  orders: Order[];
  clients?: Client[];
  company?: Company | null;
  products?: ManagementProduct[];
  onStatusChange: (
    orderId: string,
    newStatus: OrderStatus,
    revenueAction: 'add' | 'remove' | 'none',
    expenseAction?: { type: 'add' | 'remove'; amount?: number }
  ) => Promise<void>;
  onViewOrder?: (order: Order) => void;
}

export function OrderKanban({ orders, clients, company, products, onStatusChange, onViewOrder }: OrderKanbanProps) {
  // Local state for optimistic updates
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  
  // Expense modal state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [productLink, setProductLink] = useState('');
  const [pendingDrag, setPendingDrag] = useState<{
    orderId: string;
    orderNumber: string;
    clientName: string;
    newStatus: OrderStatus;
    oldStatus: OrderStatus;
    revenueAction: 'add' | 'remove' | 'none';
  } | null>(null);

  // Tracking modal state
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date | undefined>(undefined);
  const [pendingShippingDrag, setPendingShippingDrag] = useState<{
    orderId: string;
    orderNumber: string;
    clientName: string;
    newStatus: OrderStatus;
    oldStatus: OrderStatus;
    revenueAction: 'add' | 'remove' | 'none';
  } | null>(null);

  // Sync with props when orders change from external source
  if (orders !== localOrders && pendingUpdates.size === 0) {
    setLocalOrders(orders);
  }

  const getOrdersByStatus = (status: OrderStatus) => 
    localOrders.filter(order => order.status === status);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const orderId = result.draggableId;
    const newStatus = result.destination.droppableId as OrderStatus;
    const oldStatus = result.source.droppableId as OrderStatus;

    if (newStatus === oldStatus) return;

    const order = localOrders.find(o => o.id === orderId);
    if (!order) return;

    // Determine revenue action
    let revenueAction: 'add' | 'remove' | 'none' = 'none';
    
    // Add revenue when moving from awaiting_payment to any other status (and revenue wasn't added yet)
    if (oldStatus === 'awaiting_payment' && newStatus !== 'awaiting_payment' && !order.revenue_added) {
      revenueAction = 'add';
    }
    // Remove revenue when moving back to awaiting_payment (and revenue was previously added)
    else if (newStatus === 'awaiting_payment' && oldStatus !== 'awaiting_payment' && order.revenue_added) {
      revenueAction = 'remove';
    }

    // Check if moving to production - need to ask for expense amount
    if (newStatus === 'production' && oldStatus !== 'production') {
      setPendingDrag({
        orderId,
        orderNumber: order.number,
        clientName: order.client_name,
        newStatus,
        oldStatus,
        revenueAction,
      });
      setExpenseAmount('');
      setProductLink('');
      setExpenseModalOpen(true);
      return;
    }

    // Check if moving to shipping - need to ask for tracking code
    if (newStatus === 'shipping' && oldStatus !== 'shipping') {
      setPendingShippingDrag({
        orderId,
        orderNumber: order.number,
        clientName: order.client_name,
        newStatus,
        oldStatus,
        revenueAction,
      });
      setTrackingCode('');
      setEstimatedDelivery(undefined);
      setTrackingModalOpen(true);
      return;
    }

    // Check if moving from production to creating_art - remove expense
    const expenseAction = oldStatus === 'production' && newStatus === 'creating_art' 
      ? { type: 'remove' as const } 
      : undefined;

    await executeStatusChange(orderId, order.number, newStatus, oldStatus, revenueAction, expenseAction);
  };

  const executeStatusChange = async (
    orderId: string,
    orderNumber: string,
    newStatus: OrderStatus,
    oldStatus: OrderStatus,
    revenueAction: 'add' | 'remove' | 'none',
    expenseAction?: { type: 'add' | 'remove'; amount?: number }
  ) => {
    // Optimistic update - immediately update local state
    setLocalOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
    setPendingUpdates(prev => new Set(prev).add(orderId));

    try {
      await onStatusChange(orderId, newStatus, revenueAction, expenseAction);
      toast.success(`Pedido ${orderNumber} atualizado`);
    } catch (error) {
      // Rollback on error
      setLocalOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: oldStatus } : o
      ));
      toast.error('Erro ao atualizar status');
    } finally {
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleExpenseConfirm = async () => {
    if (!pendingDrag) return;

    const amount = parseFloat(expenseAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error('Informe um valor válido para a despesa');
      return;
    }

    setExpenseModalOpen(false);

    // Save product link to order notes if provided
    const link = productLink.trim();
    if (link) {
      try {
        const order = localOrders.find(o => o.id === pendingDrag.orderId);
        const existingNotes = order?.notes || '';
        const newNotes = existingNotes 
          ? `${existingNotes}\nLink do pedido: ${link}` 
          : `Link do pedido: ${link}`;
        await supabase
          .from('orders')
          .update({ notes: newNotes })
          .eq('id', pendingDrag.orderId);
      } catch (error) {
        console.error('Error saving product link:', error);
      }
    }
    
    await executeStatusChange(
      pendingDrag.orderId,
      pendingDrag.orderNumber,
      pendingDrag.newStatus,
      pendingDrag.oldStatus,
      pendingDrag.revenueAction,
      { type: 'add', amount }
    );

    setPendingDrag(null);
  };

  const handleExpenseCancel = () => {
    setExpenseModalOpen(false);
    setPendingDrag(null);
  };

  const handleTrackingConfirm = async () => {
    if (!pendingShippingDrag) return;

    const code = trackingCode.trim().toUpperCase();
    if (!code) {
      toast.error('Informe o código de rastreio');
      return;
    }

    setTrackingModalOpen(false);

    // Add tracking to order_trackings table
    try {
      await supabase
        .from('order_trackings')
        .insert([{
          order_id: pendingShippingDrag.orderId,
          order_number: pendingShippingDrag.orderNumber,
          client_name: pendingShippingDrag.clientName,
          tracking_code: code,
          carrier: 'correios',
          status: 'pending',
          events: [],
          estimated_delivery: estimatedDelivery ? format(estimatedDelivery, 'yyyy-MM-dd') : null,
        }]);
      
      toast.success('Rastreio adicionado automaticamente!');
    } catch (error) {
      console.error('Error adding tracking:', error);
      // Continue with status change even if tracking fails
    }
    
    await executeStatusChange(
      pendingShippingDrag.orderId,
      pendingShippingDrag.orderNumber,
      pendingShippingDrag.newStatus,
      pendingShippingDrag.oldStatus,
      pendingShippingDrag.revenueAction
    );

    setPendingShippingDrag(null);
    setEstimatedDelivery(undefined);
  };

  const handleTrackingCancel = () => {
    setTrackingModalOpen(false);
    setPendingShippingDrag(null);
  };

  const handleTrackingSkip = async () => {
    if (!pendingShippingDrag) return;

    setTrackingModalOpen(false);
    
    await executeStatusChange(
      pendingShippingDrag.orderId,
      pendingShippingDrag.orderNumber,
      pendingShippingDrag.newStatus,
      pendingShippingDrag.oldStatus,
      pendingShippingDrag.revenueAction
    );

    setPendingShippingDrag(null);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Status tabs header */}
        <div className="flex items-center gap-6 mb-4 border-b pb-3 overflow-x-auto">
          {ORDER_STATUSES.map((status) => {
            const count = getOrdersByStatus(status.id).length;
            return (
              <div key={status.id} className="flex items-center gap-2 shrink-0">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <span className="text-sm font-medium text-foreground">{status.label}</span>
                <span className="text-sm text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Kanban columns */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ORDER_STATUSES.map((status) => {
            const statusOrders = getOrdersByStatus(status.id);
            
            return (
              <Droppable key={status.id} droppableId={status.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-w-[200px] min-h-[200px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver 
                        ? 'bg-primary/10 border-2 border-dashed border-primary' 
                        : 'bg-muted/30'
                    }`}
                  >
                    {statusOrders.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                        Nenhum pedido
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {statusOrders.map((order, index) => {
                          const isPending = pendingUpdates.has(order.id);
                          const client = clients?.find(c => c.id === order.client_id);
                          const orderLink = order.notes?.match(/Link do pedido:\s*(https?:\/\/\S+)/)?.[1];
                          return (
                            <Draggable key={order.id} draggableId={order.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all ${
                                    snapshot.isDragging 
                                      ? 'shadow-lg scale-105 rotate-1 ring-2 ring-primary' 
                                      : 'hover:shadow-md'
                                  } ${isPending ? 'opacity-70' : ''}`}
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-sm text-foreground">
                                        {order.number}
                                      </div>
                                      <div className="text-sm text-muted-foreground truncate">
                                        {order.client_name}
                                      </div>
                                      <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm font-bold text-primary">
                                          {maskCurrency(Number(order.total))}
                                        </span>
                                        {onViewOrder && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onViewOrder(order);
                                            }}
                                          >
                                            Ver
                                          </Button>
                                        )}
                                      </div>
                                      {/* Action icons */}
                                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                                        {/* WhatsApp */}
                                        <button
                                          title="WhatsApp do cliente"
                                          className="p-1 rounded hover:bg-muted transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const phone = client?.phone?.replace(/\D/g, '');
                                            if (phone) {
                                              window.open(`https://wa.me/55${phone}`, '_blank');
                                            } else {
                                              toast.error('Telefone do cliente não encontrado');
                                            }
                                          }}
                                        >
                                          <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4" />
                                        </button>
                                        {/* Link do pedido */}
                                        <button
                                          title="Link do pedido"
                                          className={`p-1 rounded hover:bg-muted transition-colors ${!orderLink ? 'opacity-40 cursor-not-allowed' : ''}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (orderLink) {
                                              window.open(orderLink, '_blank');
                                            } else {
                                              toast.error('Nenhum link cadastrado para este pedido');
                                            }
                                          }}
                                        >
                                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                        {/* Download PDF */}
                                        <button
                                          title="Baixar PDF do pedido"
                                          className="p-1 rounded hover:bg-muted transition-colors"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              await exportOrderToPDF(order, company || null, client || null, products);
                                              toast.success('PDF baixado!');
                                            } catch (error) {
                                              toast.error('Erro ao gerar PDF');
                                            }
                                          }}
                                        >
                                          <Download className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {/* Expense Modal */}
      <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Despesa de Produção</DialogTitle>
          </DialogHeader>
         <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="expense-amount">
                Valor da despesa para o pedido {pendingDrag?.orderNumber}:
              </Label>
              <Input
                id="expense-amount"
                type="text"
                placeholder="0,00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="mt-2"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="product-link">
                Link do pedido:
              </Label>
              <Input
                id="product-link"
                type="url"
                placeholder="https://..."
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleExpenseCancel}>
              Cancelar
            </Button>
            <Button onClick={handleExpenseConfirm}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracking Modal */}
      <Dialog open={trackingModalOpen} onOpenChange={setTrackingModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Informações de Envio</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="tracking-code">
                Código de Rastreio para o pedido {pendingShippingDrag?.orderNumber}:
              </Label>
              <Input
                id="tracking-code"
                type="text"
                placeholder="Ex: AA123456789BR"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                className="mt-2"
                autoFocus
              />
            </div>
            
            <div>
              <Label>Previsão de Entrega:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-2 justify-start text-left font-normal",
                      !estimatedDelivery && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {estimatedDelivery ? (
                      format(estimatedDelivery, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[200]" align="start">
                  <Calendar
                    mode="single"
                    selected={estimatedDelivery}
                    onSelect={setEstimatedDelivery}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <p className="text-xs text-muted-foreground">
              O rastreio será adicionado automaticamente na aba "Rastreio de Pedidos"
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleTrackingCancel}>
              Cancelar
            </Button>
            <Button variant="ghost" onClick={handleTrackingSkip}>
              Pular
            </Button>
            <Button onClick={handleTrackingConfirm}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
