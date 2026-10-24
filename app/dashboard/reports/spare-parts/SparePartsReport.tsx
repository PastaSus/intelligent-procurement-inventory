'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Package, Printer, Wrench } from 'lucide-react';
import { getSparePartsReport, type SparePartsReportRow } from '@/app/_actions/reports';
import { SparePartsReportPrint } from './SparePartsReportPrint';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMPONENT_TYPE_ORDER } from '@/lib/spare-parts';
import { printDocument } from '@/lib/print';

interface RoomOption {
  id: string;
  name: string;
}

interface SparePartsTotals {
  forReplacement: number;
  spareQty: number;
  netShortage: number;
}

interface Filters {
  roomId: string;
  componentType: string;
  shortagesOnly: boolean;
}

const DEFAULT_FILTERS: Filters = {
  roomId: 'all',
  componentType: 'all',
  shortagesOnly: false,
};

interface SparePartsReportProps {
  rows: SparePartsReportRow[];
  requestRows: SparePartsReportRow[];
  totals: SparePartsTotals;
  roomOptions: RoomOption[];
  generatedAt: Date;
}

export function SparePartsReport({
  rows: initialRows,
  requestRows: initialRequestRows,
  totals: initialTotals,
  roomOptions: initialRoomOptions,
  generatedAt: initialGeneratedAt,
}: SparePartsReportProps) {
  const [rows, setRows] = useState(initialRows);
  const [requestRows, setRequestRows] = useState(initialRequestRows);
  const [totals, setTotals] = useState(initialTotals);
  const [roomOptions, setRoomOptions] = useState(initialRoomOptions);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [isPending, startTransition] = useTransition();
  const [generatedAt, setGeneratedAt] = useState(() => initialGeneratedAt);
  const [filterError, setFilterError] = useState<string | null>(null);
  const requestRef = useRef(0);

  function applyFilters(next: Filters) {
    const requestId = ++requestRef.current;
    const previous = filters;
    setFilters(next);
    setFilterError(null);
    startTransition(async () => {
      try {
        const result = await getSparePartsReport({
          ...(next.roomId !== 'all' && { roomId: next.roomId }),
          ...(next.componentType !== 'all' && { componentType: next.componentType }),
          ...(next.shortagesOnly && { shortagesOnly: true }),
        });
        if (requestId !== requestRef.current) return;
        if (result.success && result.data) {
          setRows(result.data.rows);
          setRequestRows(result.data.requestRows);
          setTotals(result.data.totals);
          setRoomOptions(result.data.roomOptions);
          setGeneratedAt(new Date());
        } else {
          setFilters(previous);
          setFilterError(result.error || 'Failed to apply filters');
        }
      } catch {
        if (requestId !== requestRef.current) return;
        setFilters(previous);
        setFilterError('Failed to apply filters');
      }
    });
  }

  const { roomId, componentType, shortagesOnly } = filters;

  const roomLabel = roomId === 'all'
    ? 'All rooms'
    : roomOptions.find((room) => room.id === roomId)?.name ?? 'Unknown room';
  const typeLabel = componentType === 'all' ? 'All types' : componentType.replace(/_/g, ' ');
  const showingLabel = shortagesOnly ? 'Shortages only' : 'All items';

  const summaryCards = [
    {
      label: 'For Replacement',
      value: totals.forReplacement,
      icon: Wrench,
      href: '/dashboard/component-status?status=NEEDS_REPLACEMENT#component-filter',
    },
    {
      label: 'Spare Units in Stock',
      value: totals.spareQty,
      icon: Package,
      href: '/dashboard/inventory',
    },
    {
      label: 'Net Shortage to Request',
      value: totals.netShortage,
      icon: AlertTriangle,
      href: '/dashboard/purchase-requests',
    },
  ];

  return (
    <div className="space-y-6 hardware-report">
      <div className="report-no-print space-y-6" aria-busy={isPending}>
        <div className="flex flex-col items-start gap-3 text-left sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Spare Parts &amp; Replacement Report</h2>
            <p className="text-muted-foreground">
              Generated {generatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' '}· {rows.length} categories · {totals.forReplacement} for replacement · {totals.spareQty} spare units · {totals.netShortage} to request
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/reports" className="gap-2">
                <Package className="h-4 w-4" />
                Hardware Inventory Report
              </Link>
            </Button>
            <Button onClick={printDocument} className="gap-2" disabled={isPending}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                href={card.href}
                className="flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="rounded-full bg-muted p-2">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="w-48">
            <Select
              value={roomId}
              disabled={isPending}
              onValueChange={v => applyFilters({ ...filters, roomId: v })}
            >
              <SelectTrigger className="w-full" aria-label="Filter by room">
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
            <Select
              value={componentType}
              disabled={isPending}
              onValueChange={v => applyFilters({ ...filters, componentType: v })}
            >
              <SelectTrigger className="w-full" aria-label="Filter by component type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {COMPONENT_TYPE_ORDER.map(t => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select
              value={shortagesOnly ? 'shortages' : 'all'}
              disabled={isPending}
              onValueChange={v => applyFilters({ ...filters, shortagesOnly: v === 'shortages' })}
            >
              <SelectTrigger className="w-full" aria-label="Filter by shortages">
                <SelectValue placeholder="All items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All items</SelectItem>
                <SelectItem value="shortages">Shortages only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filterError && (
          <p role="alert" className="text-sm text-destructive">{filterError}</p>
        )}

        {isPending && (
          <p className="text-sm text-muted-foreground" aria-live="polite">Loading report...</p>
        )}

        {rows.length === 0 ? (
          <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No records match the selected filters.</p>
          </div>
        ) : (
          <>
            <div className="bg-card rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Replacement &amp; Spare Parts by Category</h3>
              </div>
              <div className="overflow-x-auto">
                <table aria-label="Spare parts and replacement by category" className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th scope="col" className="px-4 py-2 text-left text-sm font-medium">Item</th>
                      <th scope="col" className="px-4 py-2 text-center text-sm font-medium text-red-700">For Replacement</th>
                      <th scope="col" className="px-4 py-2 text-center text-sm font-medium text-green-700">Spare Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.type} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="px-4 py-2 text-sm font-medium">
                          <Link
                            href={`/dashboard/component-status?type=${encodeURIComponent(row.type)}#component-filter`}
                            className="hover:text-primary hover:underline"
                          >
                            {row.label}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Link
                            href={`/dashboard/component-status?type=${encodeURIComponent(row.type)}&status=NEEDS_REPLACEMENT#component-filter`}
                            aria-label={`View ${row.forReplacement} ${row.label} component${row.forReplacement !== 1 ? 's' : ''} needing replacement`}
                            className={`inline-flex min-w-8 items-center justify-center text-sm font-semibold tabular-nums transition-colors hover:underline ${
                              row.forReplacement > 0 ? 'text-red-700' : 'text-muted-foreground'
                            }`}
                          >
                            {row.forReplacement}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Link
                            href={`/dashboard/inventory?component_type=${encodeURIComponent(row.type)}`}
                            aria-label={`View ${row.label} spare parts in inventory`}
                            className={`inline-flex min-w-8 items-center justify-center text-sm font-semibold tabular-nums transition-colors hover:underline ${
                              row.spareQty > 0 ? 'text-green-700' : 'text-muted-foreground'
                            }`}
                          >
                            {row.spareQty}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-foreground/20 bg-muted/30">
                      <td className="px-4 py-2 text-sm font-semibold">Total</td>
                      <td className="px-4 py-2 text-center text-sm font-bold tabular-nums">{totals.forReplacement}</td>
                      <td className="px-4 py-2 text-center text-sm font-bold tabular-nums">{totals.spareQty}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="bg-card rounded-lg border">
              <div className="flex flex-col gap-1 p-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">Replenishment Request List</h3>
                  <p className="text-sm text-muted-foreground">
                    Request Qty = For Replacement Qty − Spare Qty. Items covered by spare stock are hidden.
                  </p>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {requestRows.length} item{requestRows.length !== 1 ? 's' : ''} to request
                </span>
              </div>
              {requestRows.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
                  No shortages to request.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table aria-label="Replenishment request list" className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-2 text-left text-sm font-medium">Item</th>
                        <th scope="col" className="px-4 py-2 text-center text-sm font-medium">For Replacement</th>
                        <th scope="col" className="px-4 py-2 text-center text-sm font-medium">Spare Qty</th>
                        <th scope="col" className="px-4 py-2 text-center text-sm font-medium">Request Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestRows.map((row) => (
                        <tr key={row.type} className="border-b last:border-b-0 hover:bg-muted/30">
                          <td className="px-4 py-2 text-sm font-medium">
                            <Link
                              href={`/dashboard/component-status?type=${encodeURIComponent(row.type)}&status=NEEDS_REPLACEMENT#component-filter`}
                              className="hover:text-primary hover:underline"
                            >
                              {row.label}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-center text-sm tabular-nums">{row.forReplacement}</td>
                          <td className="px-4 py-2 text-center text-sm tabular-nums">{row.spareQty}</td>
                          <td className="px-4 py-2 text-center text-sm font-bold tabular-nums">{row.netShortage}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-foreground/20 bg-muted/30">
                        <td className="px-4 py-2 text-sm font-semibold" colSpan={3}>Total Request Qty</td>
                        <td className="px-4 py-2 text-center text-sm font-bold tabular-nums">{totals.netShortage}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          For Replacement counts components marked NEEDS_REPLACEMENT. Spare Qty sums available inventory quantities by component type across all rooms. Request Qty is the net shortage after spare stock. Totals reflect the current filters.
        </p>
      </div>

      <div className="print-only hidden">
        <SparePartsReportPrint
          rows={rows}
          requestRows={requestRows}
          totals={totals}
          generatedAt={generatedAt}
          roomLabel={roomLabel}
          typeLabel={typeLabel}
          showingLabel={showingLabel}
        />
      </div>
    </div>
  );
}
