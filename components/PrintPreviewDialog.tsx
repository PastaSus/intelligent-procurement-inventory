"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FileDown, ImageDown, Loader2, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printDocument } from "@/lib/print";
import {
  A4,
  exportNodeAsPdf,
  exportNodeAsPng,
  type DocumentExtension,
} from "@/lib/print-export";
import { useToast } from "@/lib/toast-context";

interface PrintPreviewDialogProps {
  title: string;
  fileName: (extension: DocumentExtension) => string;
  onClose: () => void;
  canExport?: boolean;
  children: React.ReactNode;
}

const PREVIEW_PADDING = 16;

export function PrintPreviewDialog({
  title,
  fileName,
  onClose,
  canExport = true,
  children,
}: PrintPreviewDialogProps) {
  const { addToast } = useToast();
  const paperRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const exportingRef = useRef(false);
  const [scale, setScale] = useState(1);
  const [paperHeight, setPaperHeight] = useState<number>(A4.heightPx);
  const [pendingExport, setPendingExport] = useState<DocumentExtension | null>(
    null,
  );

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !exportingRef.current) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const paper = paperRef.current;
    if (!frame || !paper) return;

    const measure = () => {
      const available = frame.clientWidth - PREVIEW_PADDING * 2;
      setScale(available > 0 ? Math.min(1, available / A4.widthPx) : 1);
      if (paper.offsetHeight > 0) setPaperHeight(paper.offsetHeight);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(paper);
    return () => observer.disconnect();
  }, []);

  const handleExport = useCallback(
    async (extension: DocumentExtension) => {
      const node = paperRef.current;
      if (!node || exportingRef.current) return;

      exportingRef.current = true;
      setPendingExport(extension);
      try {
        const filename = fileName(extension);
        if (extension === "pdf") {
          await exportNodeAsPdf(node, filename);
        } else {
          await exportNodeAsPng(node, filename);
        }
      } catch {
        addToast("Could not generate the file. Please try again.", "error");
      } finally {
        exportingRef.current = false;
        setPendingExport(null);
      }
    },
    [addToast, fileName],
  );

  const handleTab = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [],
  );

  const exportDisabled = pendingExport !== null || !canExport;
  const closeDisabled = pendingExport !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-preview-dialog-title"
      className="report-no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => {
        if (!closeDisabled && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={handleTab}
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-card shadow-xl outline-none"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <h3
            id="print-preview-dialog-title"
            className="min-w-0 flex-1 break-words text-lg font-semibold"
          >
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleExport("pdf")}
              disabled={exportDisabled}
              className="gap-2"
              aria-label={`Download ${title} as PDF`}
            >
              {pendingExport === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              {pendingExport === "pdf" ? "Preparing…" : "Download PDF"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleExport("png")}
              disabled={exportDisabled}
              className="gap-2"
              aria-label={`Download ${title} as image`}
            >
              {pendingExport === "png" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageDown className="h-4 w-4" />
              )}
              {pendingExport === "png" ? "Preparing…" : "Download Image"}
            </Button>
            <Button type="button" onClick={printDocument} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="gap-2"
              disabled={closeDisabled}
            >
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
            <div
              style={{
                width: A4.widthPx,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <div
                ref={paperRef}
                className="pr-print-letter pr-print-letter-paged bg-white text-black shadow-sm"
                style={{
                  width: A4.widthPx,
                  minHeight: A4.heightPx,
                  padding: A4.marginPx,
                  boxSizing: "border-box",
                }}
              >
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
