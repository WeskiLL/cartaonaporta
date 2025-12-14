import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Order } from '@/types/management';
import { maskCurrency } from '@/lib/masks';
import { GripVertical, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  onStatusChange: (orderId: string, newStatus: OrderStatus, addRevenue: boolean) => Promise<void>;
  onViewOrder?: (order: Order) => void;
}

export function OrderKanban({ orders, onStatusChange, onViewOrder }: OrderKanbanProps) {
  const getOrdersByStatus = (status: OrderStatus) => 
    orders.filter(order => order.status === status);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const orderId = result.draggableId;
    const newStatus = result.destination.droppableId as OrderStatus;
    const oldStatus = result.source.droppableId as OrderStatus;

    if (newStatus === oldStatus) return;

    // Add revenue when moving to "creating_art"
    const addRevenue = newStatus === 'creating_art' && oldStatus === 'awaiting_payment';
    
    await onStatusChange(orderId, newStatus, addRevenue);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Status tabs header */}
      <div className="flex items-center gap-6 mb-4 border-b pb-3">
        {ORDER_STATUSES.map((status) => {
          const count = getOrdersByStatus(status.id).length;
          return (
            <div key={status.id} className="flex items-center gap-2">
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
                      ? 'bg-muted/50' 
                      : 'bg-transparent'
                  }`}
                >
                  {statusOrders.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      Nenhum pedido
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {statusOrders.map((order, index) => (
                        <Draggable key={order.id} draggableId={order.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all ${
                                snapshot.isDragging 
                                  ? 'shadow-lg scale-105 rotate-1' 
                                  : 'hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div 
                                  {...provided.dragHandleProps}
                                  className="mt-1 text-muted-foreground"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
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
                      ))}
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
