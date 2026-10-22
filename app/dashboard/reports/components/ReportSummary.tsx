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
}

export function ReportSummary({ rooms }: ReportSummaryProps) {
  const allComponents = rooms.flatMap(r => r.units.flatMap(u => u.components));
  const totalUnits = rooms.reduce((sum, r) => sum + r.units.length, 0);

  const totals = [
    { label: 'Total Rooms', value: rooms.length, icon: Building2 },
    { label: 'Total Units', value: totalUnits, icon: Monitor },
    { label: 'Total Components', value: allComponents.length, icon: Cpu },
  ];

  return (
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
              <p className="text-2xl font-bold text-foreground">{t.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
