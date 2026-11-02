import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  A4,
  approvedRequestsFileName,
  deliverBlob,
  exportNodeAsPdf,
  exportNodeAsPng,
  planPageSlices,
  requestDocumentFileName,
} from './print-export';

const mocks = vi.hoisted(() => {
  const canvas = {
    width: 2382,
    height: 3369,
    toDataURL: vi.fn(() => 'data:image/png;base64,AAAA'),
    toBlob: vi.fn((callback: (blob: Blob | null) => void) =>
      callback(new Blob(['png'], { type: 'image/png' })),
    ),
  };
  const doc = {
    addPage: vi.fn(),
    addImage: vi.fn(),
    output: vi.fn(() => new Blob(['%PDF-1.4'], { type: 'application/pdf' })),
  };

  return { canvas, doc, toCanvas: vi.fn(async () => canvas) };
});

vi.mock('html-to-image', () => ({ toCanvas: mocks.toCanvas }));
vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function () {
    return mocks.doc;
  }),
}));

function makeNode() {
  const node = document.createElement('div');
  document.body.appendChild(node);
  return node;
}

describe('A4 paper constants', () => {
  it('maps 96dpi pixels to A4 millimetres', () => {
    expect(Math.round(A4.widthPx / A4.pxPerMm)).toBe(210);
    expect(Math.round(A4.heightPx / A4.pxPerMm)).toBe(297);
    expect(A4.marginPx / A4.pxPerMm).toBeCloseTo(12, 0);
  });
});

describe('document file names', () => {
  it('uses the PR number for request documents', () => {
    expect(requestDocumentFileName('PR-20261008-ABCD', 'pdf')).toBe('PR-20261008-ABCD.pdf');
    expect(requestDocumentFileName('PR-20261008-ABCD', 'png')).toBe('PR-20261008-ABCD.png');
  });

  it('sanitizes unsafe characters and falls back to a default name', () => {
    expect(requestDocumentFileName('PR 2026/10 #4', 'pdf')).toBe('PR-2026-10-4.pdf');
    expect(requestDocumentFileName('   ', 'png')).toBe('document.png');
  });

  it('dates the approved requests list in local time', () => {
    expect(approvedRequestsFileName(new Date(2026, 9, 8), 'pdf')).toBe(
      'procurvin-approved-requests-2026-10-08.pdf',
    );
    expect(approvedRequestsFileName(new Date(2026, 0, 5), 'png')).toBe(
      'procurvin-approved-requests-2026-01-05.png',
    );
  });
});

describe('planPageSlices', () => {
  it('keeps short documents on a single page', () => {
    expect(planPageSlices(500)).toEqual([{ sourceY: 0, sourceHeight: 500, destY: 0 }]);
    expect(planPageSlices(A4.heightPx)).toEqual([
      { sourceY: 0, sourceHeight: A4.heightPx, destY: 0 },
    ]);
  });

  it('returns no pages for empty content', () => {
    expect(planPageSlices(0)).toEqual([]);
  });

  it('breaks pages at row boundaries and applies continuation padding', () => {
    const slices = planPageSlices(2500, [900, 1750, 2400]);

    expect(slices).toEqual([
      { sourceY: 0, sourceHeight: 900, destY: 0 },
      { sourceY: 900, sourceHeight: 850, destY: A4.marginPx },
      { sourceY: 1750, sourceHeight: 750, destY: A4.marginPx },
    ]);
  });

  it('fills a full page when no useful row boundary is available', () => {
    const slices = planPageSlices(2000);

    expect(slices).toHaveLength(2);
    expect(slices[0]).toEqual({ sourceY: 0, sourceHeight: A4.heightPx - A4.marginPx, destY: 0 });
    expect(slices[1].sourceY).toBe(A4.heightPx - A4.marginPx);
    expect(slices[1].destY).toBe(A4.marginPx);
    expect(slices[1].sourceY + slices[1].sourceHeight).toBe(2000);
  });

  it('ignores row boundaries that would leave a nearly empty page', () => {
    const slices = planPageSlices(2000, [100]);

    expect(slices).toHaveLength(2);
    expect(slices[0].sourceHeight).toBe(A4.heightPx - A4.marginPx);
  });
});

describe('PDF and image export', () => {
  let downloadSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.toCanvas.mockResolvedValue(mocks.canvas);

    const downloads: string[] = [];
    downloadSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloads.push(this.download);
      });
    Object.assign(mocks, { downloads });
  });

  afterEach(() => {
    delete (navigator as { userAgent?: unknown }).userAgent;
    delete (navigator as { maxTouchPoints?: unknown }).maxTouchPoints;
    delete (navigator as { canShare?: unknown }).canShare;
    delete (navigator as { share?: unknown }).share;
  });

  it('places a single-page letter on one A4 PDF page and downloads it', async () => {
    await exportNodeAsPdf(makeNode(), 'PR-20261008-ABCD.pdf');

    expect(mocks.toCanvas).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ pixelRatio: 3, backgroundColor: '#ffffff' }),
    );
    expect(mocks.doc.addImage).toHaveBeenCalledTimes(1);

    const call = mocks.doc.addImage.mock.calls[0];
    expect(call[0]).toBe('data:image/png;base64,AAAA');
    expect(call[1]).toBe('PNG');
    expect(call[2]).toBe(0);
    expect(call[3]).toBe(0);
    expect(call[4]).toBe(210);
    expect(call[5]).toBeCloseTo(297, 1);
    expect(mocks.doc.output).toHaveBeenCalledWith('blob');
    expect((mocks as unknown as { downloads: string[] }).downloads).toEqual([
      'PR-20261008-ABCD.pdf',
    ]);
  });

  it('downloads a PNG named after the request', async () => {
    await exportNodeAsPng(makeNode(), 'PR-20261008-ABCD.png');

    expect((mocks as unknown as { downloads: string[] }).downloads).toEqual([
      'PR-20261008-ABCD.png',
    ]);
    expect(mocks.doc.addImage).not.toHaveBeenCalled();
  });

  it('prefers the Web Share sheet when files can be shared on mobile', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });

    await deliverBlob(new Blob(['x'], { type: 'image/png' }), 'PR-20261008-ABCD.png');

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ files: [expect.any(File)] }),
    );
    expect(downloadSpy).not.toHaveBeenCalled();
  });

  it('downloads instead of sharing on a desktop user agent', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });

    await deliverBlob(new Blob(['x'], { type: 'image/png' }), 'PR-20261008-ABCD.png');

    expect(share).not.toHaveBeenCalled();
    expect(downloadSpy).toHaveBeenCalledTimes(1);
    expect((mocks as unknown as { downloads: string[] }).downloads).toEqual([
      'PR-20261008-ABCD.png',
    ]);
  });

  it('treats an iPadOS desktop-mode user agent as mobile', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    });
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });

    await deliverBlob(new Blob(['x'], { type: 'image/png' }), 'PR-20261008-ABCD.png');

    expect(share).toHaveBeenCalledTimes(1);
    expect(downloadSpy).not.toHaveBeenCalled();
  });

  it('downloads on a mobile user agent without file sharing support', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    });

    await deliverBlob(new Blob(['x'], { type: 'image/png' }), 'PR-20261008-ABCD.png');

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    expect((mocks as unknown as { downloads: string[] }).downloads).toEqual([
      'PR-20261008-ABCD.png',
    ]);
  });

  it('downloads on a mobile user agent when sharing rejects without AbortError', async () => {
    const share = vi.fn().mockRejectedValue(new Error('share failed'));
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });

    await deliverBlob(new Blob(['x'], { type: 'image/png' }), 'PR-20261008-ABCD.png');

    expect(share).toHaveBeenCalledTimes(1);
    expect(downloadSpy).toHaveBeenCalledTimes(1);
    expect((mocks as unknown as { downloads: string[] }).downloads).toEqual([
      'PR-20261008-ABCD.png',
    ]);
  });

  it('stays silent on a mobile user agent when sharing is aborted', async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException('Share canceled', 'AbortError'));
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });

    await deliverBlob(new Blob(['x'], { type: 'image/png' }), 'PR-20261008-ABCD.png');

    expect(share).toHaveBeenCalledTimes(1);
    expect(downloadSpy).not.toHaveBeenCalled();
  });
});
