import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/types/management';
import { maskCurrency } from '@/lib/masks';
import { 
  Clock, 
  Palette, 
  Factory, 
  Truck, 
  CheckCircle,
  Package,
  GripVertical
} from 'lucide-react';
import { format } from 'date-fns';

const ORDER_STATUSES = [
  { id: 'awaiting_payment', label: 'Aguardando Pagamento', icon: Clock, color: 'bg-amber-500', borderColor: 'border-amber-500' },
  { id: 'creating_art', label: 'Criando Arte', icon: Palette, color: 'bg-blue-500', borderColor: 'border-blue-500' },
  { id: 'production', label: 'Em Produção', icon: Factory, color: 'bg-purple-500', borderColor: 'border-purple-500' },
  { id: 'shipping', label: 'Em Transporte', icon: Truck, color: 'bg-orange-500', borderColor: 'border-orange-500' },
  { id: 'delivered', label: 'Entregue', icon: CheckCircle, color: 'bg-green-500', borderColor: 'border-green-500' },
] as const;

type OrderStatus = typeof ORDER_STATUSES[number]['id'];

interface OrderKanbanProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: OrderStatus, addRevenue: boolean) => Promise<void>;
}

export function OrderKanban({ orders, onStatusChange }: OrderKanbanProps) {
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
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ORDER_STATUSES.map((status) => {
          const StatusIcon = status.icon;
          const statusOrders = getOrdersByStatus(status.id);
          
          return (
            <div key={status.id} className="flex flex-col min-w-[240px] w-[240px]">
              {/* Column Header */}
              <div className={`flex items-center gap-2 p-3 rounded-t-xl ${status.color} text-white shadow-sm`}>
                <StatusIcon className="h-5 w-5" />
                <span className="text-sm font-semibold truncate">{status.label}</span>
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white text-xs px-2">
                  {statusOrders.length}
                </Badge>
              </div>
              
              {/* Droppable Area */}
              <Droppable droppableId={status.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-h-[300px] max-h-[500px] overflow-y-auto p-2 rounded-b-xl border-2 border-t-0 space-y-2 transition-all duration-200 ${
                      snapshot.isDraggingOver 
                        ? `${status.borderColor} bg-muted/70 scale-[1.02]` 
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    {statusOrders.map((order, index) => (
                      <Draggable key={order.id} draggableId={order.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group p-3 rounded-lg border bg-card shadow-sm cursor-grab active:cursor-grabbing transition-all duration-200 ${
                              snapshot.isDragging 
                                ? 'shadow-xl scale-105 rotate-2 border-primary z-50' 
                                : 'hover:shadow-md hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div 
                                {...provided.dragHandleProps}
                                className="mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Package className="h-3.5 w-3.5 text-primary" />
                                  <span className="text-xs font-bold text-primary">{order.number}</span>
                                </div>
                                <p className="text-sm font-medium text-foreground truncate mb-1">
                                  {order.client_name}
                                </p>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-bold text-green-600">
                                    {maskCurrency(Number(order.total))}
                                  </p>
                                  <span className="text-[10px] text-muted-foreground">
                                    {format(new Date(order.created_at), 'dd/MM')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {statusOrders.length === 0 && (
                      <div className={`flex flex-col items-center justify-center h-32 text-center p-4 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
                      }`}>
                        <StatusIcon className={`h-8 w-8 mb-2 ${snapshot.isDraggingOver ? 'text-primary' : 'text-muted-foreground/40'}`} />
                        <span className={`text-xs ${snapshot.isDraggingOver ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {snapshot.isDraggingOver ? 'Solte aqui!' : 'Arraste pedidos aqui'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
