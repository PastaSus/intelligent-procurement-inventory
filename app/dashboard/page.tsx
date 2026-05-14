import { Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import { getDashboardStats, getLowStockItems } from '@/app/_actions/dashboard';
import { StockIndicator } from './components/StockIndicators';

function StatCard({ icon: Icon, label, value, variant }: { icon: React.ElementType; label: string; value: number; variant: 'primary' | 'warning' | 'secondary' }) {
  const variantStyles = {
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-red-100 text-red-600',
    secondary: 'bg-secondary/10 text-secondary',
  };

  return (
    <div className="bg-card p-6 rounded-lg border">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${variantStyles[variant]}`}>
          <Icon className="h-8 w-8" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const [statsResult, lowStockResult] = await Promise.all([
    getDashboardStats(),
    getLowStockItems(),
  ]);

  const stats = statsResult.success ? statsResult.data : null;
  const lowStockItems = lowStockResult.success ? lowStockResult.data : [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to your procurement dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="list" aria-label="Inventory statistics">
        <StatCard
          icon={Package}
          label="Total Items"
          value={stats?.totalInventory ?? 0}
          variant="primary"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Alerts"
          value={stats?.lowStockCount ?? 0}
          variant="warning"
        />
        <StatCard
          icon={ShoppingCart}
          label="Pending Orders"
          value={stats?.pendingPOs ?? 0}
          variant="secondary"
        />
      </div>

      {lowStockItems.length > 0 && (
        <section aria-labelledby="low-stock-heading">
          <h3 id="low-stock-heading" className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
            Low Stock Items
          </h3>
          <div className="bg-card rounded-lg border divide-y">
            {lowStockItems.map((item) => (
              <div key={item.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.sku}{item.category ? ` · ${item.category}` : ''}</p>
                  </div>
                </div>
                <StockIndicator quantity={item.quantity} reorderPoint={item.reorder_point} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
