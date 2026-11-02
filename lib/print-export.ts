'use client';

export const A4 = {
  widthMm: 210,
  heightMm: 297,
  marginMm: 12,
  pxPerMm: 96 / 25.4,
  widthPx: 794,
  heightPx: 1123,
  marginPx: 45,
} as const;

const RENDER_PIXEL_RATIO = 3;
const ASSET_TIMEOUT_MS = 10000;

export type DocumentExtension = 'pdf' | 'png';

export interface PageSlice {
  sourceY: number;
  sourceHeight: number;
  destY: number;
}

function sanitizeSegment(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return cleaned || 'document';
}

export function requestDocumentFileName(prNumber: string, extension: DocumentExtension): string {
  return `${sanitizeSegment(prNumber)}.${extension}`;
}

export function approvedRequestsFileName(date: Date, extension: DocumentExtension): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `procurvin-approved-requests-${year}-${month}-${day}.${extension}`;
}

export function hardwareReportFileName(date: Date, extension: DocumentExtension): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `procurvin-hardware-report-${year}-${month}-${day}.${extension}`;
}

export function sparePartsReportFileName(date: Date, extension: DocumentExtension): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `procurvin-spare-parts-report-${year}-${month}-${day}.${extension}`;
}

/**
 * Splits a tall document into A4 pages. Page breaks prefer the provided
 * offsets (row/signature boundaries) so rows are never cut in half.
 */
export function planPageSlices(
  totalHeightPx: number,
  breakOffsetsPx: number[] = [],
  pageHeightPx: number = A4.heightPx,
  paddingPx: number = A4.marginPx,
): PageSlice[] {
  if (!(totalHeightPx > 0) || !(pageHeightPx > 0)) return [];

  if (totalHeightPx <= pageHeightPx + 2) {
    return [{ sourceY: 0, sourceHeight: totalHeightPx, destY: 0 }];
  }

  const breaks = [...new Set(breakOffsetsPx)]
    .filter((offset) => Number.isFinite(offset) && offset > 0)
    .sort((a, b) => a - b);

  const slices: PageSlice[] = [];
  let sourceY = 0;
  let isFirstPage = true;

  while (sourceY < totalHeightPx - 2) {
    const destY = isFirstPage ? 0 : paddingPx;
    const capacity = pageHeightPx - destY - paddingPx;
    let end = Math.min(totalHeightPx, sourceY + capacity);

    if (end < totalHeightPx) {
      const boundary = breaks.filter((offset) => offset > sourceY + 1 && offset <= end).pop();
      const minimumFill = sourceY + capacity * 0.6;
      if (boundary !== undefined && boundary >= minimumFill) end = boundary;
    }

    if (end <= sourceY) end = Math.min(totalHeightPx, sourceY + capacity);

    slices.push({ sourceY, sourceHeight: end - sourceY, destY });
    sourceY = end;
    isFirstPage = false;
  }

  return slices;
}

export function collectBreakOffsets(node: HTMLElement): number[] {
  const rootRect = node.getBoundingClientRect();
  const layoutWidth = node.offsetWidth || rootRect.width;
  const scaleFactor = layoutWidth > 0 && rootRect.width > 0 ? rootRect.width / layoutWidth : 1;
  const offsets: number[] = [];

  node.querySelectorAll('tr, .signature-blocks').forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.height > 0) offsets.push(Math.round((rect.bottom - rootRect.top) / scaleFactor));
  });

  return [...new Set(offsets)].sort((a, b) => a - b);
}

function waitForImage(image: HTMLImageElement, timeoutMs: number): Promise<void> {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();

  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      image.removeEventListener('load', finish);
      image.removeEventListener('error', finish);
      resolve();
    };

    const timer = setTimeout(finish, timeoutMs);
    image.addEventListener('load', finish);
    image.addEventListener('error', finish);
  });
}

export async function waitForAssets(node: HTMLElement, timeoutMs = ASSET_TIMEOUT_MS): Promise<void> {
  if (typeof document === 'undefined') return;

  if (typeof document.fonts?.ready?.then === 'function') {
    await document.fonts.ready;
  }

  const images = Array.from(node.querySelectorAll('img'));
  await Promise.all(images.map((image) => waitForImage(image, timeoutMs)));
}

export async function renderNodeToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  await waitForAssets(node);

  const { toCanvas } = await import('html-to-image');

  return toCanvas(node, {
    pixelRatio: RENDER_PIXEL_RATIO,
    backgroundColor: '#ffffff',
    cacheBust: true,
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not encode the document image.'));
    }, type);
  });
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|Firefox|FxiOS|Edg/.test(userAgent);

  return isIos && isSafari;
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile|Windows Phone/i.test(userAgent)) {
    return true;
  }

  return /Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1;
}

export async function deliverBlob(blob: Blob, filename: string): Promise<void> {
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    typeof File === 'function';

  if (canShareFiles && isMobileDevice()) {
    const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });

    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return;
      } catch (error) {
        if ((error as DOMException | undefined)?.name === 'AbortError') return;
      }
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';

  if (isIosSafari()) {
    window.open(objectUrl, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    return;
  }

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
}

export async function exportNodeAsPng(node: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderNodeToCanvas(node);
  const blob = await canvasToBlob(canvas);

  await deliverBlob(blob, filename);
}

function createPageCanvas(
  source: HTMLCanvasElement,
  slice: PageSlice,
  scale: number,
  pageWidthPx: number,
  pageHeightPx: number,
): HTMLCanvasElement {
  const page = document.createElement('canvas');
  page.width = pageWidthPx;
  page.height = pageHeightPx;

  const context = page.getContext('2d');
  if (!context) throw new Error('Could not create the PDF page canvas.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, pageWidthPx, pageHeightPx);
  context.drawImage(
    source,
    0,
    slice.sourceY * scale,
    source.width,
    slice.sourceHeight * scale,
    0,
    slice.destY * scale,
    pageWidthPx,
    slice.sourceHeight * scale,
  );

  return page;
}

export async function exportNodeAsPdf(node: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderNodeToCanvas(node);
  const { jsPDF } = await import('jspdf');

  const cssWidth = node.offsetWidth || A4.widthPx;
  const scale = canvas.width / cssWidth;
  const pageWidthPx = A4.widthPx * scale;
  const pageHeightPx = A4.heightPx * scale;
  const slices = planPageSlices(
    canvas.height / scale,
    collectBreakOffsets(node),
    A4.heightPx,
    A4.marginPx,
  );

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const mmPerCssPx = A4.heightMm / A4.heightPx;
  const isSingleFullPage =
    slices.length === 1 &&
    Math.abs(slices[0].sourceY) < 0.5 &&
    Math.abs(slices[0].sourceHeight * scale - canvas.height) < 1;

  slices.forEach((slice, index) => {
    if (index > 0) doc.addPage();

    const pageCanvas = isSingleFullPage
      ? canvas
      : createPageCanvas(canvas, slice, scale, pageWidthPx, pageHeightPx);
    const image = isSingleFullPage ? canvas.toDataURL('image/png') : pageCanvas.toDataURL('image/png');

    doc.addImage(
      image,
      'PNG',
      0,
      slice.destY * mmPerCssPx,
      A4.widthMm,
      slice.sourceHeight * mmPerCssPx,
    );
  });

  const blob = doc.output('blob');
  await deliverBlob(blob, filename);
}
