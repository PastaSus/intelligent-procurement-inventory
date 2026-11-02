'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileDown, Loader2, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { printDocument } from '@/lib/print';
import { formatPeso } from '@/lib/format';
import {
  A4,
  exportNodeAsPdf,
  requestDocumentFileName,
} from '@/lib/print-export';
import { useToast } from '@/lib/toast-context';
import { SignatoryBlocks } from './SignatoryBlocks';

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

const PREVIEW_PADDING = 16;

function itemTotal(item: PrintRequestItem): number {
  if (item.total) return parseFloat(item.total);
  const price = item.unit_price ? parseFloat(item.unit_price) : 0;
  return price * item.quantity;
}

function LetterContent({ request }: { request: PrintPurchaseRequest }) {
  const grandTotal = request.items.reduce((sum, i) => sum + itemTotal(i), 0);
  const dateStr = new Date(request.updated_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
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
        <h2 className="text-xl font-bold tracking-[0.2em]">PURCHASE REQUEST</h2>
      </div>

      <div className="flex justify-between gap-4 text-sm border-y-2 border-black py-2 px-1 mb-6">
        <p><span className="font-semibold">PR Number:</span> <span className="font-mono">{request.pr_number}</span></p>
        <p><span className="font-semibold">Date:</span> {dateStr}</p>
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
                {item.unit_price ? formatPeso(parseFloat(item.unit_price)) : '-'}
              </td>
              <td className="py-2 text-right tabular-nums">
                {itemTotal(item) > 0 ? formatPeso(itemTotal(item)) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="py-2 pr-2 text-right font-bold">GRAND TOTAL</td>
            <td className="py-2 text-right font-bold tabular-nums">{formatPeso(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>

      {request.notes && (
        <div className="text-sm mb-8">
          <p className="font-semibold">Notes:</p>
          <p className="whitespace-pre-wrap">{request.notes}</p>
        </div>
      )}

      <SignatoryBlocks />
    </>
  );
}

function LetterBody({ request }: { request: PrintPurchaseRequest }) {
  return (
    <div className="pr-print-letter pr-print-letter-paged bg-white text-black p-8 max-w-[210mm] mx-auto">
      <LetterContent request={request} />
    </div>
  );
}

export function PurchaseRequestPrint({ request, onClose }: PurchaseRequestPrintProps) {
  const canPrint = request.status === 'APPROVED';
  const { addToast } = useToast();
  const paperRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const exportingRef = useRef(false);
  const [scale, setScale] = useState(1);
  const [paperHeight, setPaperHeight] = useState<number>(A4.heightPx);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const frame = frameRef.current;
    const paper = paperRef.current;
    if (!frame || !paper) return;

    const measure = () => {
      const available = frame.clientWidth - PREVIEW_PADDING * 2;
      setScale(available > 0 ? Math.min(1, available / A4.widthPx) : 1);
      if (paper.offsetHeight > 0) setPaperHeight(paper.offsetHeight);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(paper);
    return () => observer.disconnect();
  }, []);

  const handleExport = useCallback(async () => {
    const node = paperRef.current;
    if (!node || exportingRef.current) return;

    exportingRef.current = true;
    setIsExporting(true);
    try {
      const filename = requestDocumentFileName(request.pr_number, 'pdf');
      await exportNodeAsPdf(node, filename);
    } catch {
      addToast('Could not generate the file. Please try again.', 'error');
    } finally {
      exportingRef.current = false;
      setIsExporting(false);
    }
  }, [addToast, request.pr_number]);

  const exportDisabled = !canPrint || isExporting;
  const exportTitle = canPrint
    ? 'Download this request letter'
    : 'Only approved requests can be downloaded';

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-request-print-title"
        className="report-no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-card shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <h3 id="purchase-request-print-title" className="min-w-0 flex-1 break-words text-lg font-semibold">
              Print Preview — {request.pr_number}
            </h3>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleExport()}
                disabled={exportDisabled}
                className="gap-2"
                aria-label={`Download ${request.pr_number} as PDF`}
                title={exportTitle}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                {isExporting ? 'Preparing…' : 'Download PDF'}
              </Button>
              <Button
                type="button"
                onClick={printDocument}
                className="gap-2"
                disabled={!canPrint}
                title={canPrint ? 'Print request letter' : 'Only approved requests can be printed'}
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="gap-2">
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
          <div ref={frameRef} className="overflow-y-auto bg-muted/30 p-4">
            <div
              className="mx-auto"
              style={{ width: A4.widthPx * scale, height: paperHeight * scale }}
            >
              <div style={{ width: A4.widthPx, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <div
                  ref={paperRef}
                  className="pr-print-letter pr-print-letter-paged bg-white text-black shadow-sm"
                  style={{
                    width: A4.widthPx,
                    minHeight: A4.heightPx,
                    padding: A4.marginPx,
                    boxSizing: 'border-box',
                  }}
                >
                  <LetterContent request={request} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {canPrint && (
        <div className="print-only hidden">
          <LetterBody request={request} />
        </div>
      )}
    </>
  );
}
