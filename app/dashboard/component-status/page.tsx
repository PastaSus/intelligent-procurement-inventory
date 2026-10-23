import { prisma } from '@/lib/prisma';
import { Cpu, Wrench, AlertTriangle, CheckCircle, Building2, Monitor, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  filterIssueComponents,
  groupIssueComponentsByRoom,
  issueStatusLabel,
  parseComponentStatus,
  parseComponentType,
} from '@/lib/component-health';
import { ComponentStatusFilters } from './ComponentStatusFilters';

function StatCard({ icon: Icon, label, value, variant, href }: { icon: React.ElementType; label: string; value: number; variant: 'green' | 'yellow' | 'red' | 'blue'; href: string }) {
  const variantStyles = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
  };

  return (
    <Link
      href={href}
      className="block bg-card rounded-lg border p-6 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${variantStyles[variant]}`}>
          <Icon className="h-8 w-8" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status, href }: { status: string; href?: string }) {
  const styles: Record<string, string> = {
    FUNCTIONAL: 'bg-green-100 text-green-800',
    NEEDS_REPAIR: 'bg-yellow-100 text-yellow-800',
    NEEDS_REPLACEMENT: 'bg-red-100 text-red-800',
  };
  const className = `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`;
  const label = status.replace(/_/g, ' ');

  if (href) {
    return (
      <Link href={href} className={`${className} hover:brightness-95 transition`}>
        {label}
      </Link>
    );
  }

  return <span className={className}>{label}</span>;
}

function filterHref(type: string, status?: string): string {
  const params = new URLSearchParams({ type });
  if (status) params.set('status', status);
  return `/dashboard/component-status?${params.toString()}#component-filter`;
}

function roomUnitsHref(roomId: string): string {
  return `/dashboard/units?room_id=${encodeURIComponent(roomId)}`;
}

type ComponentStatusSearchParams = {
  type?: string;
  status?: string;
};

export default async function ComponentStatusPage({ searchParams }: { searchParams: Promise<ComponentStatusSearchParams> }) {
  const params = await searchParams;
  const selectedType = parseComponentType(params.type);
  const selectedStatus = parseComponentStatus(params.status);

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
            id: true,
            unit_name: true,
            laboratory_room: { select: { name: true, id: true } },
          },
        },
      },
      where: {
        status: selectedStatus ?? { in: ['NEEDS_REPAIR', 'NEEDS_REPLACEMENT'] },
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

  const filteredComponents = filterIssueComponents(componentsWithIssues, selectedType, selectedStatus);
  const filteredRooms = groupIssueComponentsByRoom(filteredComponents);
  const filterActive = Boolean(selectedType || selectedStatus);
  const filterStatusLabel = selectedStatus ? issueStatusLabel(selectedStatus) : 'All issues';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Component Health</h2>
        <p className="text-muted-foreground">Overview of all computer components across all rooms</p>
      </div>

      <ComponentStatusFilters selectedType={selectedType} selectedStatus={selectedStatus} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Cpu} label="Total Components" value={totalComponents} variant="blue" href="/dashboard/component-status" />
        <StatCard icon={CheckCircle} label="Functional" value={functional} variant="green" href="/dashboard/component-status?status=FUNCTIONAL#component-filter" />
        <StatCard icon={Wrench} label="Needs Repair" value={needsRepair} variant="yellow" href="/dashboard/component-status?status=NEEDS_REPAIR#component-filter" />
        <StatCard icon={AlertTriangle} label="Needs Replacement" value={needsReplacement} variant="red" href="/dashboard/component-status?status=NEEDS_REPLACEMENT#component-filter" />
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
                <div
                  key={type}
                  className={`p-4 flex items-center justify-between gap-3 hover:bg-muted/30 ${selectedType === type ? 'bg-muted/40' : ''}`}
                >
                  <Link
                    href={filterHref(type)}
                    className="group flex min-w-0 flex-1 items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium transition-colors group-hover:text-primary">{type}</p>
                      <p className="text-sm text-muted-foreground">{counts.total} total</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    {counts.repair > 0 && (
                      <Link
                        href={filterHref(type, 'NEEDS_REPAIR')}
                        aria-label={`Show ${counts.repair} ${type} component${counts.repair !== 1 ? 's' : ''} needing repair`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                      >
                        <Wrench className="h-3 w-3" />
                        {counts.repair} repair
                      </Link>
                    )}
                    {counts.replacement > 0 && (
                      <Link
                        href={filterHref(type, 'NEEDS_REPLACEMENT')}
                        aria-label={`Show ${counts.replacement} ${type} component${counts.replacement !== 1 ? 's' : ''} needing replacement`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                      >
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

        {filterActive ? (
          <div id="component-filter" className="bg-card rounded-lg border border-primary/40">
            <div className="p-4 border-b flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">
                  {selectedType ? `${selectedType} · ${filterStatusLabel}` : filterStatusLabel}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''} across{' '}
                  {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Link
                href="/dashboard/component-status"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
                Clear filter
              </Link>
            </div>
            {filteredComponents.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No components match this filter.
              </div>
            ) : (
              <div className="divide-y">
                {filteredRooms.map((room) => {
                  const roomCount = room.units.reduce((sum, unit) => sum + unit.components.length, 0);

                  return (
                    <div key={room.roomId} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <Link href={roomUnitsHref(room.roomId)} className="font-medium hover:text-primary hover:underline">
                            {room.roomName}
                          </Link>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {roomCount} component{roomCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {room.units.map((unit) => (
                          <div key={unit.unitId} className="rounded-md border p-3">
                            <Link
                              href={`/dashboard/units/${unit.unitId}`}
                              className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                            >
                              <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                              {unit.unitName}
                            </Link>
                            <ul className="mt-2 space-y-1">
                              {unit.components.map((component) => (
                                <li key={component.id} className="flex items-center justify-between gap-2 text-xs">
                                  <Link
                                    href={filterHref(component.type, component.status)}
                                    className="font-mono text-muted-foreground hover:text-primary hover:underline"
                                  >
                                    {component.type}
                                  </Link>
                                  <StatusBadge
                                    status={component.status}
                                    href={filterHref(component.type, component.status)}
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
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
                          <Link href={roomUnitsHref(room.id)} className="font-medium hover:text-primary hover:underline">
                            {room.name}
                          </Link>
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
        )}
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
                <th className="text-left p-3 text-sm font-medium">Unit</th>
                <th className="text-left p-3 text-sm font-medium">Room</th>
                <th className="text-center p-3 text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {componentsWithIssues.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground text-sm">
                    All components are functional.
                  </td>
                </tr>
              ) : (
                componentsWithIssues.map((comp) => (
                  <tr key={comp.id} className="border-b last:border-b-0 hover:bg-muted/30" tabIndex={0}>
                    <td className="p-3 text-sm font-medium">
                      <Link href={filterHref(comp.type)} className="hover:text-primary hover:underline">
                        {comp.type}
                      </Link>
                    </td>
                    <td className="p-3 text-sm">
                      <Link href={`/dashboard/units/${comp.computer_unit.id}`} className="hover:text-primary hover:underline">
                        {comp.computer_unit.unit_name}
                      </Link>
                    </td>
                    <td className="p-3 text-sm">
                      <Link href={roomUnitsHref(comp.computer_unit.laboratory_room.id)} className="hover:text-primary hover:underline">
                        {comp.computer_unit.laboratory_room.name}
                      </Link>
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge
                        status={comp.status}
                        href={filterHref(comp.type, comp.status)}
                      />
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
