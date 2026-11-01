'use client';

import {
  getDetailedRowClass,
  getDetailedRows,
  getReportTotals,
  getUnitRows,
  isRoomEnd,
  type ReportDetail,
  type ReportRoom,
} from './report-rows';

interface HardwareReportPrintProps {
  rooms: ReportRoom[];
  detail: ReportDetail;
  generatedAt: Date;
  roomLabel: string;
  statusLabel: string;
  typeLabel: string;
  embedded?: boolean;
}

function humanize(value: string): string {
  return value.replace(/_/g, ' ');
}

export function HardwareReportPrint({
  rooms,
  detail,
  generatedAt,
  roomLabel,
  statusLabel,
  typeLabel,
  embedded = false,
}: HardwareReportPrintProps) {
  const totals = getReportTotals(rooms);
  const detailedRows = detail === 'detailed' ? getDetailedRows(rooms) : [];
  const unitRows = detail === 'non-detailed' ? getUnitRows(rooms) : [];
  const dateStr = generatedAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={
        embedded
          ? 'hardware-report-print pr-print-letter pr-print-letter-paged bg-white text-black'
          : 'hardware-report-print pr-print-letter pr-print-letter-paged bg-white text-black p-8 max-w-[210mm] mx-auto'
      }
    >
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
        <h2 className="text-xl font-bold tracking-[0.2em]">HARDWARE INVENTORY REPORT</h2>
      </div>

      <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm border-y-2 border-black py-2 px-1 mb-3">
        <p><span className="font-semibold">Date:</span> {dateStr}</p>
        <p><span className="font-semibold">View:</span> {detail === 'detailed' ? 'Per Unit' : 'Summary'}</p>
        <p><span className="font-semibold">Rooms:</span> {totals.rooms}</p>
        <p><span className="font-semibold">Units:</span> {totals.units}</p>
        <p><span className="font-semibold">Components:</span> {totals.components}</p>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs px-1 mb-6">
        <p><span className="font-semibold">Room:</span> {roomLabel}</p>
        <p><span className="font-semibold">Status:</span> {statusLabel}</p>
        <p><span className="font-semibold">Component Type:</span> {typeLabel}</p>
      </div>

      {detail === 'detailed' ? (
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-2 pr-2">Room No.</th>
              <th className="text-left py-2 pr-2">Unit No.</th>
              <th className="text-left py-2 pr-2">Component</th>
              <th className="text-left py-2 pr-2">Specifications</th>
              <th className="text-center py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {detailedRows.map((row, index) => (
              <tr
                key={row.id}
                className={`${getDetailedRowClass(detailedRows, index, {
                  lastRowClass: 'border-b border-gray-100',
                })} align-top`}
              >
                <td className="py-2 pr-2">{row.roomName}</td>
                <td className="py-2 pr-2">{row.unitName}</td>
                <td className="py-2 pr-2 font-medium">{row.type}</td>
                <td className="py-2 pr-2">{row.specifications}</td>
                <td className="py-2 text-center">{humanize(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-2 pr-2">Room No.</th>
              <th className="text-left py-2 pr-2">Unit No.</th>
              <th className="text-center py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {unitRows.map((row, index) => (
              <tr
                key={row.id}
                className={isRoomEnd(unitRows, index) ? 'border-b-4 border-[#820503] print:border-black' : 'border-b border-gray-100'}
              >
                <td className="py-2 pr-2">{row.roomName}</td>
                <td className="py-2 pr-2">{row.unitName}</td>
                <td className="py-2 text-center">{humanize(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {detailedRows.length === 0 && unitRows.length === 0 && (
        <p className="text-sm mb-8">No records match the selected filters.</p>
      )}
    </div>
  );
}
