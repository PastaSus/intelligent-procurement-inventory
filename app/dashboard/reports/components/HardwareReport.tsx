'use client';

import { useState, useTransition } from 'react';
import { getHardwareReport } from '@/app/_actions/reports';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Cpu } from 'lucide-react';

interface ReportComponent {
  id: string;
  type: string;
  serial_number: string;
  specifications: string;
  status: string;
}

interface ReportUnit {
  id: string;
  unit_name: string;
  components: ReportComponent[];
}

interface ReportRoom {
  id: string;
  name: string;
  units: ReportUnit[];
}

interface RoomOption {
  id: string;
  name: string;
}

interface HardwareReportProps {
  initialRooms: ReportRoom[];
  roomOptions: RoomOption[];
}

const COMPONENT_TYPES = [
  'MOTHERBOARD', 'PROCESSOR', 'MEMORY', 'HDD',
  'MONITOR', 'KEYBOARD', 'MOUSE', 'AVR', 'OPTICAL_DRIVE',
] as const;

const STATUSES = ['FUNCTIONAL', 'NEEDS_REPAIR', 'NEEDS_REPLACEMENT'] as const;

const statusStyles: Record<string, string> = {
  FUNCTIONAL: 'bg-green-100 text-green-800',
  NEEDS_REPAIR: 'bg-yellow-100 text-yellow-800',
  NEEDS_REPLACEMENT: 'bg-red-100 text-red-800',
};

export function HardwareReport({ initialRooms, roomOptions }: HardwareReportProps) {
  const [rooms, setRooms] = useState(initialRooms);
  const [roomId, setRoomId] = useState('all');
  const [status, setStatus] = useState('all');
  const [componentType, setComponentType] = useState('all');
  const [isPending, startTransition] = useTransition();
  const [generatedAt] = useState(() => new Date());

  function applyFilters(next?: { roomId?: string; status?: string; componentType?: string }) {
    const f = {
      roomId: next?.roomId ?? roomId,
      status: next?.status ?? status,
      componentType: next?.componentType ?? componentType,
    };
    startTransition(async () => {
      const result = await getHardwareReport({
        ...(f.roomId !== 'all' && { roomId: f.roomId }),
        ...(f.status !== 'all' && { status: f.status }),
        ...(f.componentType !== 'all' && { componentType: f.componentType }),
      });
      if (result.success && result.data) {
        setRooms(result.data.rooms);
      }
    });
  }

  const totalUnits = rooms.reduce((sum, r) => sum + r.units.length, 0);
  const totalComponents = rooms.reduce(
    (sum, r) => sum + r.units.reduce((uSum, u) => uSum + u.components.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between report-no-print">
        <div>
          <h2 className="text-3xl font-bold">Hardware Inventory Report</h2>
          <p className="text-muted-foreground">
            Generated {generatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' '}· {rooms.length} rooms · {totalUnits} units · {totalComponents} components
          </p>
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      <div className="print-only hidden">
        <h1 className="text-2xl font-bold">Hardware Inventory Report</h1>
        <p>
          Generated {generatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {' '}· {rooms.length} rooms · {totalUnits} units · {totalComponents} components
        </p>
      </div>

      <div className="flex flex-wrap gap-3 report-no-print">
        <div className="w-48">
          <Select value={roomId} onValueChange={v => { setRoomId(v); applyFilters({ roomId: v }); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rooms</SelectItem>
              {roomOptions.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={status} onValueChange={v => { setStatus(v); applyFilters({ status: v }); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map(s => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={componentType} onValueChange={v => { setComponentType(v); applyFilters({ componentType: v }); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {COMPONENT_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending && (
        <p className="text-sm text-muted-foreground report-no-print">Loading report...</p>
      )}

      {rooms.length === 0 ? (
        <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">
          <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No records match the selected filters.</p>
        </div>
      ) : (
        rooms.map(room => (
          <div key={room.id} className="bg-card rounded-lg border report-section">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-semibold text-lg">{room.name}</h3>
              <p className="text-sm text-muted-foreground">
                {room.units.length} unit{room.units.length !== 1 ? 's' : ''}
              </p>
            </div>
            {room.units.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No units in this room.</p>
            ) : (
              room.units.map(unit => (
                <div key={unit.id} className="border-b last:border-b-0">
                  <div className="px-4 pt-3">
                    <h4 className="font-medium">{unit.unit_name}</h4>
                  </div>
                  {unit.components.length === 0 ? (
                    <p className="px-4 pb-3 text-sm text-muted-foreground">No components recorded.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left px-4 py-2 text-sm font-medium">Type</th>
                            <th className="text-left px-4 py-2 text-sm font-medium">Serial Number</th>
                            <th className="text-left px-4 py-2 text-sm font-medium">Specifications</th>
                            <th className="text-center px-4 py-2 text-sm font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unit.components.map(comp => (
                            <tr key={comp.id} className="border-b last:border-b-0">
                              <td className="px-4 py-2 font-medium">{comp.type}</td>
                              <td className="px-4 py-2 font-mono text-sm">{comp.serial_number}</td>
                              <td className="px-4 py-2 text-sm">{comp.specifications}</td>
                              <td className="px-4 py-2 text-center">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyles[comp.status] || ''}`}>
                                  {comp.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ))
      )}
    </div>
  );
}
