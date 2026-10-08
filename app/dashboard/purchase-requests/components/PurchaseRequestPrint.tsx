'use client';

import { Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrintRequestItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: string | null;
  total: string | null;
}

interface PrintPurchaseRequest {
  id: string;
  pr_number: string;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  items: PrintRequestItem[];
}

interface PurchaseRequestPrintProps {
  request: PrintPurchaseRequest;
  onClose: () => void;
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function itemTotal(item: PrintRequestItem): number {
  if (item.total) return parseFloat(item.total);
  const price = item.unit_price ? parseFloat(item.unit_price) : 0;
  return price * item.quantity;
}

function LetterBody({ request }: { request: PrintPurchaseRequest }) {
  const grandTotal = request.items.reduce((sum, i) => sum + itemTotal(i), 0);
  const dateStr = new Date(request.updated_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="pr-print-letter bg-white text-black p-8 max-w-[210mm] mx-auto">
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold">Procurvin</h1>
        <p className="text-sm">Laboratory Procurement &amp; Inventory System</p>
        <h2 className="text-xl font-bold mt-3 underline underline-offset-4">PURCHASE REQUEST</h2>
      </div>

      <div className="flex justify-between text-sm mb-6">
        <div>
          <p><span className="font-semibold">PR Number:</span> <span className="font-mono">{request.pr_number}</span></p>
          <p><span className="font-semibold">Status:</span> {request.status}</p>
        </div>
        <div className="text-right">
          <p><span className="font-semibold">Date:</span> {dateStr}</p>
        </div>
      </div>

      <table className="w-full text-sm border-collapse mb-6">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2 pr-2">#</th>
            <th className="text-left py-2 pr-2">Item</th>
            <th className="text-center py-2 pr-2">Qty</th>
            <th className="text-right py-2 pr-2">Unit Price</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {request.items.map((item, idx) => (
            <tr key={item.id} className="border-b border-gray-300">
              <td className="py-2 pr-2">{idx + 1}</td>
              <td className="py-2 pr-2">{item.item_name}</td>
              <td className="py-2 pr-2 text-center">{item.quantity}</td>
              <td className="py-2 pr-2 text-right tabular-nums">
                {item.unit_price ? formatMoney(parseFloat(item.unit_price)) : '-'}
              </td>
              <td className="py-2 text-right tabular-nums">
                {itemTotal(item) > 0 ? formatMoney(itemTotal(item)) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="py-2 pr-2 text-right font-bold">GRAND TOTAL</td>
            <td className="py-2 text-right font-bold tabular-nums">{formatMoney(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>

      {request.notes && (
        <div className="text-sm mb-8">
          <p className="font-semibold">Notes:</p>
          <p className="whitespace-pre-wrap">{request.notes}</p>
        </div>
      )}

      <div className="signature-blocks flex justify-between gap-6 mt-12 text-sm">
        <div className="flex-1 text-center">
          <div className="border-t border-black pt-1 mt-16">Prepared by (Requester)</div>
        </div>
        <div className="flex-1 text-center">
          <div className="border-t border-black pt-1 mt-16">Approved by (Laboratory Head)</div>
        </div>
        <div className="flex-1 text-center">
          <div className="border-t border-black pt-1 mt-16">Vice-President</div>
        </div>
      </div>
    </div>
  );
}

export function PurchaseRequestPrint({ request, onClose }: PurchaseRequestPrintProps) {
  return (
    <>
      <div className="report-no-print fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl my-8">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Print Preview — {request.pr_number}</h3>
            <div className="flex items-center gap-2">
              <Button onClick={() => window.print()} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={onClose} className="gap-2">
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
          <div className="p-4 bg-muted/30">
            <LetterBody request={request} />
          </div>
        </div>
      </div>

      <div className="print-only hidden">
        <LetterBody request={request} />
      </div>
    </>
  );
}
