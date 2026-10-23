'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, CheckCircle, Package, Printer, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { printDocument } from '@/lib/print';
import type { SparePartsReportRow } from '@/app/_actions/reports';

interface SparePartsReportProps {
  rows: SparePartsReportRow[];
  requestRows: SparePartsReportRow[];
  totals: {
    forReplacement: number;
    spareQty: number;
    netShortage: number;
  };
  generatedAt: Date;
}

export function SparePartsReport({ rows, requestRows, totals, generatedAt }: SparePartsReportProps) {
  const dateLabel = generatedAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const summaryCards = [
    {
      label: 'For Replacement',
      value: totals.forReplacement,
      icon: Wrench,
      tone: 'text-red-700',
      href: '/dashboard/component-status?status=NEEDS_REPLACEMENT#component-filter',
    },
    {
      label: 'Spare Units in Stock',
      value: totals.spareQty,
      icon: Package,
      tone: 'text-green-700',
      href: '/dashboard/inventory',
    },
    {
      label: 'Net Shortage to Request',
      value: totals.netShortage,
      icon: AlertTriangle,
      tone: 'text-destructive',
      href: '/dashboard/purchase-requests',
    },
  ];

  return (
    <div className="space-y-6 hardware-report">
      <div className="report-no-print flex flex-col items-start gap-3 text-left sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/reports"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Hardware Inventory Report
          </Link>
          <h2 className="text-3xl font-bold">Spare Parts &amp; Replacement Report</h2>
          <p className="text-muted-foreground">
            Generated {dateLabel} · {rows.length} categories · {totals.forReplacement} for replacement · {totals.spareQty} spare units · {totals.netShortage} to request
          </p>
        </div>
        <Button onClick={printDocument} className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      <div className="report-no-print grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <div className={`rounded-lg bg-muted p-3 ${card.tone}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className={`text-2xl font-bold tabular-nums ${card.tone}`}>{card.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="print-only hidden mb-6 text-center">
        <h1 className="text-xl font-bold tracking-[0.2em]">SPARE PARTS &amp; REPLACEMENT REPORT</h1>
        <p className="mt-1 text-sm">Generated {dateLabel}</p>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Replacement &amp; Spare Parts by Category</h3>
        </div>
        <div className="overflow-x-auto">
          <table aria-label="Spare parts and replacement by category" className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th scope="col" className="p-4 text-left text-sm font-medium">Item</th>
                <th scope="col" className="p-4 text-center text-sm font-medium text-red-700">For Replacement</th>
                <th scope="col" className="p-4 text-center text-sm font-medium text-green-700">Spare Qty</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.type} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="p-4 text-sm font-medium">
                    <Link
                      href={`/dashboard/component-status?type=${encodeURIComponent(row.type)}#component-filter`}
                      className="hover:text-primary hover:underline"
                    >
                      {row.label}
                    </Link>
                  </td>
                  <td className="p-4 text-center">
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
                  <td className="p-4 text-center">
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
                <td className="p-4 text-sm font-semibold">Total</td>
                <td className="p-4 text-center text-sm font-bold tabular-nums">{totals.forReplacement}</td>
                <td className="p-4 text-center text-sm font-bold tabular-nums">{totals.spareQty}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
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
            Spare stock covers all replacement needs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table aria-label="Replenishment request list" className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th scope="col" className="p-4 text-left text-sm font-medium">Item</th>
                  <th scope="col" className="p-4 text-center text-sm font-medium">For Replacement</th>
                  <th scope="col" className="p-4 text-center text-sm font-medium">Spare Qty</th>
                  <th scope="col" className="p-4 text-center text-sm font-medium text-destructive">Request Qty</th>
                </tr>
              </thead>
              <tbody>
                {requestRows.map((row) => (
                  <tr key={row.type} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="p-4 text-sm font-medium">
                      <Link
                        href={`/dashboard/component-status?type=${encodeURIComponent(row.type)}&status=NEEDS_REPLACEMENT#component-filter`}
                        className="hover:text-primary hover:underline"
                      >
                        {row.label}
                      </Link>
                    </td>
                    <td className="p-4 text-center text-sm tabular-nums">{row.forReplacement}</td>
                    <td className="p-4 text-center text-sm tabular-nums">{row.spareQty}</td>
                    <td className="p-4 text-center text-sm font-bold tabular-nums text-destructive">{row.netShortage}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-foreground/20 bg-muted/30">
                  <td className="p-4 text-sm font-semibold" colSpan={3}>Total Request Qty</td>
                  <td className="p-4 text-center text-sm font-bold tabular-nums text-destructive">{totals.netShortage}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <p className="report-no-print text-xs text-muted-foreground">
        For Replacement counts components marked NEEDS_REPLACEMENT. Spare Qty sums available inventory quantities by component type. Request Qty is the net shortage after spare stock.
      </p>
    </div>
  );
}
