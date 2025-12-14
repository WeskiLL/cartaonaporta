import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-3 sm:p-6 transition-all hover:shadow-brand-sm",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-display font-bold text-foreground truncate">
            {value}
          </p>
          {trend && (
            <p className={cn(
              "mt-1 text-xs sm:text-sm font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 sm:p-3 rounded-lg bg-primary/10 text-primary shrink-0 ml-2">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
