import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PurchaseRequestPrint } from '@/app/dashboard/purchase-requests/components/PurchaseRequestPrint';
import { exportNodeAsPdf, exportNodeAsPng } from '@/lib/print-export';

const toastMocks = vi.hoisted(() => ({ addToast: vi.fn() }));

vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({ addToast: toastMocks.addToast }),
}));

vi.mock('@/lib/print-export', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/print-export')>();
  return {
    ...actual,
    exportNodeAsPdf: vi.fn(),
    exportNodeAsPng: vi.fn(),
  };
});

function makeRequest(overrides: { notes?: string | null; status?: string } = {}) {
  return {
    id: 'pr-1',
    pr_number: 'PR-20261008-ABCD',
    status: 'APPROVED',
    notes: 'For Lab 2 monitors',
    created_at: new Date('2026-10-08T00:00:00Z'),
    updated_at: new Date('2026-10-08T00:00:00Z'),
    items: [
      { id: 'item-1', item_name: 'Monitor', quantity: 2, unit_price: '150.00', total: '300.00' },
      { id: 'item-2', item_name: 'HDMI Cable', quantity: 5, unit_price: null, total: null },
    ],
    ...overrides,
  };
}

describe('PurchaseRequestPrint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.print = vi.fn();
  });

  it('renders the letter header, PR number, and items table', () => {
    render(<PurchaseRequestPrint request={makeRequest()} onClose={() => {}} />);

    expect(screen.getAllByText('College of Computer Studies').length).toBeGreaterThan(0);
    expect(screen.getAllByAltText('College of Computer Studies logo').length).toBeGreaterThan(0);
    expect(screen.getAllByAltText('University of Luzon logo').length).toBeGreaterThan(0);
    expect(screen.queryByText('Procurvin')).not.toBeInTheDocument();
    expect(screen.queryByText(/Laboratory Procurement/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('PURCHASE REQUEST').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PR-20261008-ABCD').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Monitor').length).toBeGreaterThan(0);
    expect(screen.getAllByText('HDMI Cable').length).toBeGreaterThan(0);
  });

  it('shows line totals, grand total, and notes', () => {
    render(<PurchaseRequestPrint request={makeRequest()} onClose={() => {}} />);

    expect(screen.getAllByText('₱300.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('For Lab 2 monitors').length).toBeGreaterThan(0);
  });

  it('renders the four signatory roles with signer titles and no name inputs', () => {
    render(<PurchaseRequestPrint request={makeRequest()} onClose={() => {}} />);

    for (const role of ['Prepared by', 'Checked by', 'Recommended by', 'Approved by']) {
      expect(screen.getAllByText(role).length).toBeGreaterThan(0);
    }
    for (const signer of ['SA', 'Technician', 'Lab Admin', 'Dean']) {
      expect(screen.getAllByText(signer).length).toBeGreaterThan(0);
    }
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.getAllByText('Diosdado C. Caronongan').length).toBeGreaterThan(0);
  });

  it('renders the four signatories in a compact aligned row', () => {
    const { container } = render(<PurchaseRequestPrint request={makeRequest()} onClose={() => {}} />);

    const printArea = container.querySelector('.print-only');
    expect(printArea?.querySelector('.pr-print-letter-paged')).not.toBeNull();
    const columns = printArea?.querySelectorAll('.signature-blocks');
    expect(columns?.length).toBe(1);
    const rowBlock = columns?.[0];
    expect(rowBlock?.className).toContain('grid');
    expect(rowBlock?.className).toContain('grid-cols-4');
    expect(rowBlock?.className).not.toContain('flex-col');
    expect(rowBlock?.children.length).toBe(4);
    const text = rowBlock?.textContent ?? '';
    const order = ['Prepared by', 'Checked by', 'Recommended by', 'Approved by'];
    const indexes = order.map((role) => text.indexOf(role));
    expect(indexes.every((i) => i >= 0)).toBe(true);
    expect([...indexes].sort((a, b) => a - b)).toEqual(indexes);
  });

  it('omits the notes section when notes are null', () => {
    render(<PurchaseRequestPrint request={makeRequest({ notes: null })} onClose={() => {}} />);

    expect(screen.queryByText('Notes:')).not.toBeInTheDocument();
  });

  it('calls window.print when the Print button is clicked', async () => {
    const user = userEvent.setup();
    render(<PurchaseRequestPrint request={makeRequest()} onClose={() => {}} />);

    await user.click(screen.getByRole('button', { name: /^print$/i }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it.each(['REJECTED', 'FULFILLED'])('disables printing for %s requests', async (status) => {
    const user = userEvent.setup();
    const { container } = render(
      <PurchaseRequestPrint request={makeRequest({ status })} onClose={() => {}} />,
    );

    const printButton = screen.getByRole('button', { name: /^print$/i });
    expect(printButton).toBeDisabled();
    await user.click(printButton);
    expect(window.print).not.toHaveBeenCalled();
    expect(container.querySelector('.print-only')).toBeNull();
  });

  it('calls onClose when the Close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PurchaseRequestPrint request={makeRequest()} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PurchaseRequestPrint request={makeRequest()} onClose={onClose} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<PurchaseRequestPrint request={makeRequest()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('document downloads', () => {
    it('shows download controls for approved requests', () => {
      render(<PurchaseRequestPrint request={makeRequest()} onClose={() => {}} />);

      expect(
        screen.getByRole('button', { name: /download pr-20261008-abcd as pdf/i }),
      ).toBeEnabled();
      expect(
        screen.getByRole('button', { name: /download pr-20261008-abcd as image/i }),
      ).toBeEnabled();
    });

    it.each(['REJECTED', 'FULFILLED'])('disables downloads for %s requests', (status) => {
      render(<PurchaseRequestPrint request={makeRequest({ status })} onClose={() => {}} />);

      expect(
        screen.getByRole('button', { name: /download pr-20261008-abcd as pdf/i }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: /download pr-20261008-abcd as image/i }),
      ).toBeDisabled();
    });

    it('exports the previewed letter as a PDF', async () => {
      const user = userEvent.setup();
      vi.mocked(exportNodeAsPdf).mockResolvedValue(undefined);
      render(<PurchaseRequestPrint request={makeRequest()} onClose={() => {}} />);

      await user.click(screen.getByRole('button', { name: /download pr-20261008-abcd as pdf/i }));

      expect(exportNodeAsPdf).toHaveBeenCalledTimes(1);
      const [node, filename] = vi.mocked(exportNodeAsPdf).mock.calls[0];
      expect((node as HTMLElement).className).toContain('pr-print-letter');
      expect(node).toHaveTextContent('PURCHASE REQUEST');
      expect(filename).toBe('PR-20261008-ABCD.pdf');
      expect(exportNodeAsPng).not.toHaveBeenCalled();
    });

    it('shows a preparing state and blocks both exports while working', async () => {
      const user = userEvent.setup();
      let finishExport: (() => void) | undefined;
      vi.mocked(exportNodeAsPng).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finishExport = resolve;
          }),
      );
      render(<PurchaseRequestPrint request={makeRequest()} onClose={() => {}} />);

      const pdfButton = screen.getByRole('button', { name: /download pr-20261008-abcd as pdf/i });
      const imageButton = screen.getByRole('button', { name: /download pr-20261008-abcd as image/i });

      await user.click(imageButton);

      expect(await screen.findByText('Preparing…')).toBeInTheDocument();
      expect(imageButton).toBeDisabled();
      expect(pdfButton).toBeDisabled();

      finishExport?.();

      await waitFor(() => expect(imageButton).toHaveTextContent('Download Image'));
      expect(imageButton).toBeEnabled();
    });

    it('shows an error toast when an export fails', async () => {
      const user = userEvent.setup();
      vi.mocked(exportNodeAsPdf).mockRejectedValue(new Error('render failed'));
      render(<PurchaseRequestPrint request={makeRequest()} onClose={() => {}} />);

      await user.click(screen.getByRole('button', { name: /download pr-20261008-abcd as pdf/i }));

      await waitFor(() =>
        expect(toastMocks.addToast).toHaveBeenCalledWith(
          'Could not generate the file. Please try again.',
          'error',
        ),
      );
      expect(
        screen.getByRole('button', { name: /download pr-20261008-abcd as pdf/i }),
      ).toBeEnabled();
    });
  });
});
