import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Order } from '@/types/management';
import { maskCurrency } from '@/lib/masks';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ORDER_STATUSES = [
  { id: 'awaiting_payment', label: 'Aguardando Pagamento', color: 'bg-amber-500' },
  { id: 'creating_art', label: 'Criando Arte', color: 'bg-blue-500' },
  { id: 'production', label: 'Em Produção', color: 'bg-orange-500' },
  { id: 'shipping', label: 'Em Transporte', color: 'bg-emerald-500' },
  { id: 'delivered', label: 'Entregue', color: 'bg-green-500' },
] as const;

type OrderStatus = typeof ORDER_STATUSES[number]['id'];

interface OrderKanbanProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: OrderStatus, revenueAction: 'add' | 'remove' | 'none') => Promise<void>;
  onViewOrder?: (order: Order) => void;
}

export function OrderKanban({ orders, onStatusChange, onViewOrder }: OrderKanbanProps) {
  // Local state for optimistic updates
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

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

    // Optimistic update - immediately update local state
    setLocalOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
    setPendingUpdates(prev => new Set(prev).add(orderId));

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

    try {
      await onStatusChange(orderId, newStatus, revenueAction);
      toast.success(`Pedido ${order.number} atualizado`);
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

  return (
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
  );
}
