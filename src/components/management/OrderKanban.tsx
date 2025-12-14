import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Order, Transaction } from '@/types/management';
import { maskCurrency } from '@/lib/masks';
import { 
  Clock, 
  Palette, 
  Factory, 
  Truck, 
  CheckCircle,
  Package
} from 'lucide-react';

const ORDER_STATUSES = [
  { id: 'awaiting_payment', label: 'Aguardando Pagamento', icon: Clock, color: 'bg-yellow-500' },
  { id: 'creating_art', label: 'Criando Arte', icon: Palette, color: 'bg-blue-500' },
  { id: 'production', label: 'Em Produção', icon: Factory, color: 'bg-purple-500' },
  { id: 'shipping', label: 'Em Transporte', icon: Truck, color: 'bg-orange-500' },
  { id: 'delivered', label: 'Entregue', icon: CheckCircle, color: 'bg-green-500' },
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {ORDER_STATUSES.map((status) => {
          const StatusIcon = status.icon;
          const statusOrders = getOrdersByStatus(status.id);
          
          return (
            <div key={status.id} className="flex flex-col">
              <div className={`flex items-center gap-2 p-3 rounded-t-lg ${status.color} text-white`}>
                <StatusIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{status.label}</span>
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white">
                  {statusOrders.length}
                </Badge>
              </div>
              
              <Droppable droppableId={status.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-h-[200px] p-2 rounded-b-lg border border-t-0 border-border space-y-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-card'
                    }`}
                  >
                    {statusOrders.map((order, index) => (
                      <Draggable key={order.id} draggableId={order.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 rounded-lg border border-border bg-background shadow-sm transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium text-foreground">{order.number}</span>
                            </div>
                            <p className="text-sm text-foreground truncate">{order.client_name}</p>
                            <p className="text-sm font-semibold text-primary mt-1">
                              {maskCurrency(Number(order.total))}
                            </p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {statusOrders.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground py-8">
                        Arraste pedidos aqui
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
