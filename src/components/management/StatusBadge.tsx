import { cn } from '@/lib/utils';
import { OrderStatus, QuoteStatus } from '@/types/management';

interface StatusBadgeProps {
  status: OrderStatus | QuoteStatus | string;
  type?: 'order' | 'quote';
}

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  awaiting_payment: { label: 'Aguardando Pagamento', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  creating_art: { label: 'Criando Arte', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  production: { label: 'Em Produção', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  shipping: { label: 'Em Transporte', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  delivered: { label: 'Entregue', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
};

const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: 'Aprovado', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Rejeitado', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  converted: { label: 'Convertido', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
};

export function StatusBadge({ status, type = 'order' }: StatusBadgeProps) {
  const config = type === 'order' 
    ? ORDER_STATUS_CONFIG[status as OrderStatus] 
    : QUOTE_STATUS_CONFIG[status as QuoteStatus];
  
  if (!config) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status}
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      config.className
    )}>
      {config.label}
    </span>
  );
}
