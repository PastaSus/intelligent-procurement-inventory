import { Building2, Monitor, AlertTriangle, ShoppingCart, Wrench, Cpu, Package } from 'lucide-react';
import { getDashboardStats } from '@/app/_actions/dashboard';

function StatCard({ icon: Icon, label, value, variant }: { icon: React.ElementType; label: string; value: number; variant: 'primary' | 'warning' | 'secondary' | 'info' }) {
  const variantStyles = {
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-red-100 text-red-600',
    secondary: 'bg-secondary/10 text-secondary',
    info: 'bg-blue-100 text-blue-600',
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
  const statsResult = await getDashboardStats();

  if (!statsResult.success) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Lab asset management overview</p>
        </div>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">
          <p className="text-sm font-medium text-destructive">
            Failed to load dashboard statistics. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const stats = statsResult.data;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Lab asset management overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Building2} label="Laboratory Rooms" value={stats.totalRooms} variant="primary" />
        <StatCard icon={Monitor} label="Computer Units" value={stats.totalUnits} variant="primary" />
        <StatCard icon={Cpu} label="Total Components" value={stats.totalComponents} variant="info" />
        <StatCard icon={Package} label="Parts to Order" value={stats.lowStockCount} variant="warning" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Wrench} label="Needs Repair" value={stats.needsRepair} variant="info" />
        <StatCard icon={AlertTriangle} label="Needs Replacement" value={stats.needsReplacement} variant="warning" />
        <StatCard icon={ShoppingCart} label="Pending Requests" value={stats.pendingRequests} variant="secondary" />
      </div>
    </div>
  );
}
