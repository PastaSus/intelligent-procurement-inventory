import { AlertTriangle, CircleCheck, CircleX } from 'lucide-react';

interface StockIndicatorsProps {
  quantity: number;
  reorderPoint: number;
}

function getStockStatus(quantity: number, reorderPoint: number) {
  if (reorderPoint <= 0) return 'ok'; // No reorder point set, treat as OK
  if (quantity === 0 || quantity < reorderPoint * 0.5) return 'critical';
  if (quantity < reorderPoint) return 'warning';
  return 'ok';
}

export function StockIndicator({ quantity, reorderPoint }: StockIndicatorsProps) {
  const status = getStockStatus(quantity, reorderPoint);
  const safeReorder = reorderPoint > 0 ? reorderPoint : 1;
  const progress = Math.min((quantity / safeReorder) * 100, 100);

  const config = {
    critical: {
      bar: 'bg-red-700',
      text: 'text-red-800',
      icon: CircleX,
      label: 'Critical',
    },
    warning: {
      bar: 'bg-yellow-600',
      text: 'text-yellow-800',
      icon: AlertTriangle,
      label: 'Warning',
    },
    ok: {
      bar: 'bg-green-700',
      text: 'text-green-800',
      icon: CircleCheck,
      label: 'OK',
    },
  } as const;

  const { bar, text, icon: Icon, label } = config[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 text-xs font-medium ${text}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div
        className="flex-1 h-2 bg-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={quantity}
        aria-valuemin={0}
        aria-valuemax={reorderPoint > 0 ? reorderPoint : 0}
        aria-label={`Stock level: ${quantity} of ${reorderPoint}`}
      >
        <div
          className={`h-full rounded-full transition-all ${bar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className={`text-xs font-medium tabular-nums ${text}`}>
        {quantity}/{reorderPoint}
      </span>
    </div>
  );
}