'use client';

import { useMemo, useState, useTransition } from 'react';
import { getHardwareReport } from '@/app/_actions/reports';
import { ReportSummary } from './ReportSummary';
import { HardwareReportPrint } from './HardwareReportPrint';
import {
  getDetailedRows,
  getReportTotals,
  getUnitRows,
  getVisibleRooms,
  isRoomEnd,
  type ReportDetail,
  type ReportRoom,
} from './report-rows';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Cpu } from 'lucide-react';
import { printDocument } from '@/lib/print';

interface RoomOption {
  id: string;
  name: string;
}

interface HardwareReportProps {
  initialRooms: ReportRoom[];
  roomOptions: RoomOption[];
}

const COMPONENT_TYPES = [
  'MOTHERBOARD', 'PROCESSOR', 'MEMORY', 'STORAGE',
  'MONITOR', 'KEYBOARD', 'MOUSE', 'AVR', 'OPTICAL_DRIVE',
] as const;

const STATUSES = ['FUNCTIONAL', 'NEEDS_REPAIR', 'NEEDS_REPLACEMENT'] as const;

const statusClasses: Record<string, string> = {
  FUNCTIONAL: 'text-green-600',
  NEEDS_REPAIR: 'text-yellow-600',
  NEEDS_REPLACEMENT: 'text-red-600',
};

export function HardwareReport({ initialRooms, roomOptions }: HardwareReportProps) {
  const [rooms, setRooms] = useState(initialRooms);
  const [roomOpts, setRoomOpts] = useState(roomOptions);
  const [roomId, setRoomId] = useState('all');
  const [status, setStatus] = useState('all');
  const [componentType, setComponentType] = useState('all');
  const [detail, setDetail] = useState<ReportDetail>('detailed');
  const [isPending, startTransition] = useTransition();
  const [generatedAt, setGeneratedAt] = useState(() => new Date());
  const [filterError, setFilterError] = useState<string | null>(null);

  function applyFilters(next?: { roomId?: string; status?: string; componentType?: string }) {
    const f = {
      roomId: next?.roomId ?? roomId,
      status: next?.status ?? status,
      componentType: next?.componentType ?? componentType,
    };
    setFilterError(null);
    startTransition(async () => {
      const result = await getHardwareReport({
        ...(f.roomId !== 'all' && { roomId: f.roomId }),
        ...(f.status !== 'all' && { status: f.status }),
        ...(f.componentType !== 'all' && { componentType: f.componentType }),
      });
      if (result.success && result.data) {
        setRooms(result.data.rooms);
        setRoomOpts(result.data.roomOptions);
        setGeneratedAt(new Date());
      } else {
        setFilterError(result.error || 'Failed to apply filters');
      }
    });
  }

  const visibleRooms = useMemo(() => getVisibleRooms(rooms), [rooms]);
  const totals = useMemo(() => getReportTotals(visibleRooms), [visibleRooms]);
  const detailedRows = useMemo(() => getDetailedRows(visibleRooms), [visibleRooms]);
  const unitRows = useMemo(() => getUnitRows(visibleRooms), [visibleRooms]);

  const roomLabel = roomId === 'all'
    ? 'All rooms'
    : roomOpts.find((room) => room.id === roomId)?.name ?? 'All rooms';
  const statusLabel = status === 'all' ? 'All statuses' : status.replace(/_/g, ' ');
  const typeLabel = componentType === 'all' ? 'All types' : componentType;

  function handleResetFilters() {
    setRoomId('all');
    setStatus('all');
    setComponentType('all');
    applyFilters({ roomId: 'all', status: 'all', componentType: 'all' });
  }

  const hasRows = detail === 'detailed' ? detailedRows.length > 0 : unitRows.length > 0;

  return (
    <div className="space-y-6 hardware-report">
      <div className="report-no-print space-y-6">
        <div className="flex flex-col items-start gap-3 text-left sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Hardware Inventory Report</h2>
            <p className="text-muted-foreground">
              Generated {generatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' '}· {totals.rooms} rooms · {totals.units} units · {totals.components} components
            </p>
          </div>
          <Button onClick={printDocument} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>

        <ReportSummary rooms={visibleRooms} onReset={handleResetFilters} />

        <div className="flex flex-wrap gap-3">
          <div className="w-48">
            <Select value={roomId} onValueChange={v => { setRoomId(v); applyFilters({ roomId: v }); }}>
              <SelectTrigger className="w-full" aria-label="Filter by room">
                <SelectValue placeholder="All rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rooms</SelectItem>
                {roomOpts.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select value={status} onValueChange={v => { setStatus(v); applyFilters({ status: v }); }}>
              <SelectTrigger className="w-full" aria-label="Filter by status">
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
              <SelectTrigger className="w-full" aria-label="Filter by component type">
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
          <div className="w-48">
            <Select value={detail} onValueChange={v => setDetail(v as ReportDetail)}>
              <SelectTrigger className="w-full" aria-label="Report detail level">
                <SelectValue placeholder="Detailed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="non-detailed">Non-Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filterError && (
          <p className="text-sm text-destructive">{filterError}</p>
        )}

        {isPending && (
          <p className="text-sm text-muted-foreground">Loading report...</p>
        )}

        {!hasRows ? (
          <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">
            <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No records match the selected filters.</p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="font-semibold">
                {detail === 'detailed' ? 'Component Details' : 'Unit Status Summary'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              {detail === 'detailed' ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2 text-sm font-medium">Room No.</th>
                      <th className="text-left px-4 py-2 text-sm font-medium">Unit No.</th>
                      <th className="text-left px-4 py-2 text-sm font-medium">Component</th>
                      <th className="text-left px-4 py-2 text-sm font-medium">Specifications</th>
                      <th className="text-center px-4 py-2 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedRows.map((row, index) => {
                      const prev = detailedRows[index - 1];
                      const showRoom = index === 0 || row.roomName !== prev.roomName;
                      const showUnit = index === 0 || row.unitName !== prev.unitName;
                      return (
                        <tr
                          key={row.id}
                          className={isRoomEnd(detailedRows, index) ? 'border-b-4 border-black' : 'border-b border-gray-100 last:border-b-0'}
                        >
                          <td className="px-4 py-2 text-sm">
                            {showRoom ? row.roomName : ''}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {showUnit ? row.unitName : ''}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">{row.type}</td>
                          <td className="px-4 py-2 text-sm">{row.specifications}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={statusClasses[row.status] || ""}>{row.status.replace(/_/g, ' ')}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2 text-sm font-medium">Room No.</th>
                      <th className="text-left px-4 py-2 text-sm font-medium">Unit No.</th>
                      <th className="text-center px-4 py-2 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitRows.map((row, index) => {
                      const prev = unitRows[index - 1];
                      const showRoom = index === 0 || row.roomName !== prev.roomName;
                      const showUnit = index === 0 || row.unitName !== prev.unitName;
                      return (
                        <tr
                          key={row.id}
                          className={isRoomEnd(unitRows, index) ? 'border-b-4 border-black' : 'border-b border-gray-100 last:border-b-0'}
                        >
                          <td className="px-4 py-2 text-sm">
                            {showRoom ? row.roomName : ''}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {showUnit ? row.unitName : ''}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={statusClasses[row.status] || ""}>{row.status.replace(/_/g, ' ')}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="print-only hidden">
        <HardwareReportPrint
          rooms={visibleRooms}
          detail={detail}
          generatedAt={generatedAt}
          roomLabel={roomLabel}
          statusLabel={statusLabel}
          typeLabel={typeLabel}
        />
      </div>
    </div>
  );
}
