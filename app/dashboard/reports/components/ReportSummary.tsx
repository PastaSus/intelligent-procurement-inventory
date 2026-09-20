'use client';

import { Building2, Monitor, Cpu } from 'lucide-react';

interface SummaryComponent {
  type: string;
  status: string;
}

interface SummaryUnit {
  components: SummaryComponent[];
}

interface SummaryRoom {
  units: SummaryUnit[];
}

interface ReportSummaryProps {
  rooms: SummaryRoom[];
  activeStatus: string;
  activeType: string;
  onSelectStatus: (status: string) => void;
  onSelectType: (type: string) => void;
}

const statusStyles: Record<string, string> = {
  FUNCTIONAL: 'bg-green-100 text-green-800',
  NEEDS_REPAIR: 'bg-yellow-100 text-yellow-800',
  NEEDS_REPLACEMENT: 'bg-red-100 text-red-800',
};

export function ReportSummary({ rooms, activeStatus, activeType, onSelectStatus, onSelectType }: ReportSummaryProps) {
  const allComponents = rooms.flatMap(r => r.units.flatMap(u => u.components));
  const totalUnits = rooms.reduce((sum, r) => sum + r.units.length, 0);

  const statusCounts = allComponents.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeCounts = allComponents.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totals = [
    { label: 'Total Rooms', value: rooms.length, icon: Building2, color: 'text-foreground' },
    { label: 'Total Units', value: totalUnits, icon: Monitor, color: 'text-foreground' },
    { label: 'Total Components', value: allComponents.length, icon: Cpu, color: 'text-foreground' },
  ];

  return (
    <div className="space-y-4 report-no-print">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {totals.map(t => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="bg-card rounded-lg border p-4 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-full">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.label}</p>
                <p className={`text-2xl font-bold ${t.color}`}>{t.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <h4 className="font-semibold mb-3 text-sm">By Status <span className="font-normal text-muted-foreground">(click to filter)</span></h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => onSelectStatus(activeStatus === status ? 'all' : status)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${statusStyles[status] || ''} ${activeStatus === status ? 'ring-2 ring-offset-2 ring-foreground' : 'hover:opacity-80'}`}
                title={`Filter by ${status.replace(/_/g, ' ')}`}
              >
                {status.replace(/_/g, ' ')}: {count}
              </button>
            ))}
            {Object.keys(statusCounts).length === 0 && (
              <p className="text-sm text-muted-foreground">No components in current view.</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <h4 className="font-semibold mb-3 text-sm">By Type <span className="font-normal text-muted-foreground">(click to filter)</span></h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeCounts).map(([type, count]) => (
              <button
                key={type}
                onClick={() => onSelectType(activeType === type ? 'all' : type)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-foreground transition-all ${activeType === type ? 'ring-2 ring-offset-2 ring-foreground' : 'hover:bg-muted/70'}`}
                title={`Filter by ${type}`}
              >
                {type}: {count}
              </button>
            ))}
            {Object.keys(typeCounts).length === 0 && (
              <p className="text-sm text-muted-foreground">No components in current view.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
