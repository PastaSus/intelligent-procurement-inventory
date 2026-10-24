'use client';

import type { SparePartsReportRow } from '@/app/_actions/reports';

interface SparePartsTotals {
  forReplacement: number;
  spareQty: number;
  netShortage: number;
}

interface SparePartsReportPrintProps {
  rows: SparePartsReportRow[];
  requestRows: SparePartsReportRow[];
  totals: SparePartsTotals;
  generatedAt: Date;
  roomLabel: string;
  typeLabel: string;
  showingLabel: string;
}

export function SparePartsReportPrint({
  rows,
  requestRows,
  totals,
  generatedAt,
  roomLabel,
  typeLabel,
  showingLabel,
}: SparePartsReportPrintProps) {
  const dateStr = generatedAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="hardware-report-print pr-print-letter pr-print-letter-paged bg-white text-black p-8 max-w-[210mm] mx-auto">
      <div className="border-b-4 border-double border-black pb-4 mb-5">
        <div className="flex items-center justify-between gap-4">
          <img
            src="/university_of_luzon_logo-upscaled.png"
            alt="University of Luzon logo"
            width={64}
            height={64}
            className="shrink-0 object-contain"
          />
          <h1 className="flex-1 text-center text-2xl font-bold tracking-wide">College of Computer Studies</h1>
          <img
            src="/ccs-logo-upscaled.png"
            alt="College of Computer Studies logo"
            width={64}
            height={64}
            className="shrink-0 object-contain"
          />
        </div>
      </div>

      <div className="text-center mb-5">
        <h2 className="text-xl font-bold tracking-[0.2em]">SPARE PARTS &amp; REPLACEMENT REPORT</h2>
      </div>

      <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm border-y-2 border-black py-2 px-1 mb-6">
        <p><span className="font-semibold">Date:</span> {dateStr}</p>
        <p><span className="font-semibold">Room:</span> {roomLabel}</p>
        <p><span className="font-semibold">Component Type:</span> {typeLabel}</p>
        <p><span className="font-semibold">Showing:</span> {showingLabel}</p>
        <p><span className="font-semibold">For Replacement:</span> {totals.forReplacement}</p>
        <p><span className="font-semibold">Spare Units (all rooms):</span> {totals.spareQty}</p>
        <p><span className="font-semibold">Net Shortage:</span> {totals.netShortage}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm mb-8">No records match the selected filters.</p>
      ) : (
        <>
          <table className="w-full text-sm border-collapse mb-8">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 pr-2">Item</th>
                <th className="text-center py-2 pr-2">For Replacement</th>
                <th className="text-center py-2">Spare Qty</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.type} className="border-b border-gray-100">
                  <td className="py-2 pr-2 font-medium">{row.label}</td>
                  <td className="py-2 pr-2 text-center">{row.forReplacement}</td>
                  <td className="py-2 text-center">{row.spareQty}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black font-semibold">
                <td className="py-2 pr-2">Total</td>
                <td className="py-2 pr-2 text-center">{totals.forReplacement}</td>
                <td className="py-2 text-center">{totals.spareQty}</td>
              </tr>
            </tfoot>
          </table>

          <h3 className="text-sm font-bold mb-2">Replenishment Request List</h3>
          {requestRows.length === 0 ? (
            <p className="text-sm mb-8">No shortages to request; spare stock covers all replacement needs.</p>
          ) : (
            <table className="w-full text-sm border-collapse mb-8">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 pr-2">Item</th>
                  <th className="text-center py-2 pr-2">For Replacement</th>
                  <th className="text-center py-2 pr-2">Spare Qty</th>
                  <th className="text-center py-2">Request Qty</th>
                </tr>
              </thead>
              <tbody>
                {requestRows.map((row) => (
                  <tr key={row.type} className="border-b border-gray-100">
                    <td className="py-2 pr-2 font-medium">{row.label}</td>
                    <td className="py-2 pr-2 text-center">{row.forReplacement}</td>
                    <td className="py-2 pr-2 text-center">{row.spareQty}</td>
                    <td className="py-2 text-center">{row.netShortage}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-semibold">
                  <td className="py-2 pr-2" colSpan={3}>Total Request Qty</td>
                  <td className="py-2 text-center">{totals.netShortage}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </>
      )}

      <p className="text-[11px] leading-snug border-t border-gray-300 pt-2">
        For Replacement counts components marked NEEDS_REPLACEMENT. Spare Qty sums available inventory across all rooms. Request Qty is the net shortage after spare stock. Totals reflect the current filters.
      </p>
    </div>
  );
}
