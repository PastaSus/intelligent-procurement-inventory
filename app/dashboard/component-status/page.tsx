import { prisma } from '@/lib/prisma';
import { Cpu, Wrench, AlertTriangle, CheckCircle, Building2, Monitor } from 'lucide-react';
import Link from 'next/link';

function StatCard({ icon: Icon, label, value, variant }: { icon: React.ElementType; label: string; value: number; variant: 'green' | 'yellow' | 'red' | 'blue' }) {
  const variantStyles = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="bg-card rounded-lg border p-6">
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    FUNCTIONAL: 'bg-green-100 text-green-800',
    NEEDS_REPAIR: 'bg-yellow-100 text-yellow-800',
    NEEDS_REPLACEMENT: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default async function ComponentStatusPage() {
  const [
    totalComponents,
    componentsByStatus,
    componentsByType,
    roomsWithIssues,
    componentsWithIssues,
  ] = await Promise.all([
    prisma.computerComponent.count(),
    Promise.all([
      prisma.computerComponent.count({ where: { status: 'FUNCTIONAL' } }),
      prisma.computerComponent.count({ where: { status: 'NEEDS_REPAIR' } }),
      prisma.computerComponent.count({ where: { status: 'NEEDS_REPLACEMENT' } }),
    ]),
    prisma.computerComponent.groupBy({
      by: ['type', 'status'],
      _count: true,
    }),
    prisma.laboratoryRoom.findMany({
      where: {
        deleted: false,
        units: {
          some: {
            deleted: false,
            components: {
              some: {
                status: { in: ['NEEDS_REPAIR', 'NEEDS_REPLACEMENT'] },
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        units: {
          where: { deleted: false },
          select: {
            id: true,
            unit_name: true,
            _count: { select: { components: true } },
            components: {
              where: { status: { in: ['NEEDS_REPAIR', 'NEEDS_REPLACEMENT'] } },
              select: { status: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.computerComponent.findMany({
      orderBy: [{ type: 'asc' }, { status: 'asc' }],
      include: {
        computer_unit: {
          select: {
            unit_name: true,
            laboratory_room: { select: { name: true, id: true } },
          },
        },
      },
      where: {
        status: { in: ['NEEDS_REPAIR', 'NEEDS_REPLACEMENT'] },
      },
    }),
  ]);

  const [functional, needsRepair, needsReplacement] = componentsByStatus;

  const typeBreakdown = Object.entries(
    componentsByType.reduce<Record<string, { functional: number; repair: number; replacement: number; total: number }>>(
      (acc, { type, status, _count }) => {
        if (!acc[type]) acc[type] = { functional: 0, repair: 0, replacement: 0, total: 0 };
        const key = status === 'FUNCTIONAL' ? 'functional' : status === 'NEEDS_REPAIR' ? 'repair' : 'replacement';
        acc[type][key] += _count;
        acc[type].total += _count;
        return acc;
      },
      {}
    )
  ).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Component Health</h2>
        <p className="text-muted-foreground">Overview of all computer components across all rooms</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Cpu} label="Total Components" value={totalComponents} variant="blue" />
        <StatCard icon={CheckCircle} label="Functional" value={functional} variant="green" />
        <StatCard icon={Wrench} label="Needs Repair" value={needsRepair} variant="yellow" />
        <StatCard icon={AlertTriangle} label="Needs Replacement" value={needsReplacement} variant="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">By Component Type</h3>
          </div>
          {typeBreakdown.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No components registered.</div>
          ) : (
            <div className="divide-y">
              {typeBreakdown.map(([type, counts]) => (
                <div key={type} className="p-4 flex items-center justify-between hover:bg-muted/30">
                  <div>
                    <p className="font-medium">{type}</p>
                    <p className="text-sm text-muted-foreground">{counts.total} total</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {counts.repair > 0 && (
                      <Link href={`/dashboard/units`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors">
                        <Wrench className="h-3 w-3" />
                        {counts.repair} repair
                      </Link>
                    )}
                    {counts.replacement > 0 && (
                      <Link href={`/dashboard/units`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors">
                        <AlertTriangle className="h-3 w-3" />
                        {counts.replacement} replace
                      </Link>
                    )}
                    {counts.repair === 0 && counts.replacement === 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        All OK
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">By Laboratory Room</h3>
          </div>
          {roomsWithIssues.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>All rooms have healthy components.</p>
            </div>
          ) : (
            <div className="divide-y">
              {roomsWithIssues.map((room) => {
                const totalIssues = room.units.reduce(
                  (sum, u) => sum + u.components.length, 0
                );
                const unitsWithIssues = room.units.filter(u =>
                  u.components.some(c => c.status === 'NEEDS_REPAIR' || c.status === 'NEEDS_REPLACEMENT')
                );

                return (
                  <div key={room.id} className="p-4 hover:bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{room.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{totalIssues} issue{totalIssues !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {unitsWithIssues.map((unit) => {
                        const repairCount = unit.components.filter(c => c.status === 'NEEDS_REPAIR').length;
                        const replaceCount = unit.components.filter(c => c.status === 'NEEDS_REPLACEMENT').length;

                        return (
                          <Link
                            key={unit.id}
                            href={`/dashboard/units/${unit.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-muted transition-colors"
                          >
                            <Monitor className="h-3 w-3" />
                            {unit.unit_name}
                            {repairCount > 0 && <Wrench className="h-3 w-3 text-yellow-600" />}
                            {replaceCount > 0 && <AlertTriangle className="h-3 w-3 text-red-600" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-semibold">All Components</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">Type</th>
                <th className="text-left p-3 text-sm font-medium">Serial</th>
                <th className="text-left p-3 text-sm font-medium">Unit</th>
                <th className="text-left p-3 text-sm font-medium">Room</th>
                <th className="text-center p-3 text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {componentsWithIssues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground text-sm">
                    All components are functional.
                  </td>
                </tr>
              ) : (
                componentsWithIssues.map((comp) => (
                  <tr key={comp.id} className="border-b last:border-b-0 hover:bg-muted/30" tabIndex={0}>
                    <td className="p-3 text-sm font-medium">{comp.type}</td>
                    <td className="p-3 text-sm font-mono">{comp.serial_number}</td>
                    <td className="p-3 text-sm">{comp.computer_unit.unit_name}</td>
                    <td className="p-3 text-sm">{comp.computer_unit.laboratory_room.name}</td>
                    <td className="p-3 text-center">
                      <StatusBadge status={comp.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
