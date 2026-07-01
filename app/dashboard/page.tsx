import { Building2, Monitor, AlertTriangle, ShoppingCart, Wrench } from 'lucide-react';
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
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Lab asset management overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6" role="list" aria-label="Lab asset statistics">
        <StatCard icon={Building2} label="Laboratory Rooms" value={stats?.totalRooms ?? 0} variant="primary" />
        <StatCard icon={Monitor} label="Computer Units" value={stats?.totalUnits ?? 0} variant="primary" />
        <StatCard icon={Wrench} label="Needs Repair" value={stats?.needsRepair ?? 0} variant="info" />
        <StatCard icon={AlertTriangle} label="Needs Replacement" value={stats?.needsReplacement ?? 0} variant="warning" />
        <StatCard icon={ShoppingCart} label="Pending Requests" value={stats?.pendingRequests ?? 0} variant="secondary" />
      </div>
    </div>
  );
}
