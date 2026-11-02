import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PurchaseRequestsClient } from '@/app/dashboard/purchase-requests/PurchaseRequestsClient';
import { exportNodeAsPdf } from '@/lib/print-export';

const toastMocks = vi.hoisted(() => ({ addToast: vi.fn() }));

vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({ addToast: toastMocks.addToast }),
}));
vi.mock('@/lib/print-export', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/print-export')>();
  return {
    ...actual,
    exportNodeAsPdf: vi.fn(),
  };
});
vi.mock('@/app/_actions/purchase-requests', () => ({
  submitPurchaseRequest: vi.fn(),
  approvePurchaseRequest: vi.fn(),
  fulfillPurchaseRequest: vi.fn(),
}));

function makePR(overrides: Record<string, any> = {}) {
  const id = `pr-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    pr_number: `PR-20260705-${id.toUpperCase()}`,
    status: 'DRAFT',
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'admin-001',
    updated_by: 'admin-001',
    items: [{ id: 'item-1', item_name: 'Mouse', quantity: 10, unit_price: null, total: null, created_at: new Date(), updated_at: new Date() }],
    ...overrides,
  };
}

describe('PurchaseRequestsClient', () => {
  // The print-only summary duplicates PR numbers/statuses/totals in the DOM,
  // so on-screen assertions scope to the visible table.
  function onScreenTable(container: HTMLElement) {
    return within(container.querySelector('div.bg-card table') as HTMLElement);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn(), href: '' },
      writable: true,
    });
  });

  it('renders the page header and New Request button', () => {
    render(<PurchaseRequestsClient initialRequests={[]} isAdmin={true} />);

    expect(screen.getByText('Purchase Requests')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new request/i })).toBeInTheDocument();
  });

  it('shows empty state when no requests', () => {
    render(<PurchaseRequestsClient initialRequests={[]} isAdmin={true} />);

    expect(screen.getByText(/no purchase requests found/i)).toBeInTheDocument();
  });

  it('renders request rows with PR numbers', () => {
    const requests = [makePR({ pr_number: 'PR-20260705-ABCD' })];
    const { container } = render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    expect(onScreenTable(container).getByText('PR-20260705-ABCD')).toBeInTheDocument();
    expect(onScreenTable(container).getByText('Mouse')).toBeInTheDocument();
  });

  it('shows status badge for each request', () => {
    const requests = [
      makePR({ status: 'DRAFT' }),
      makePR({ status: 'REQUESTED' }),
      makePR({ status: 'APPROVED' }),
      makePR({ status: 'REJECTED' }),
      makePR({ status: 'FULFILLED' }),
    ];
    const { container } = render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    expect(onScreenTable(container).getByText('DRAFT')).toBeInTheDocument();
    expect(onScreenTable(container).getByText('REQUESTED')).toBeInTheDocument();
    expect(onScreenTable(container).getByText('APPROVED')).toBeInTheDocument();
    expect(onScreenTable(container).getByText('REJECTED')).toBeInTheDocument();
    expect(onScreenTable(container).getByText('FULFILLED')).toBeInTheDocument();
  });

  it('shows submit button for DRAFT requests', () => {
    const requests = [makePR({ status: 'DRAFT' })];
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    expect(screen.getByTitle('Submit for Approval')).toBeInTheDocument();
  });

  it('shows approve/reject buttons for REQUESTED requests when admin', () => {
    const requests = [makePR({ status: 'REQUESTED' })];
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    expect(screen.getByTitle('Approve')).toBeInTheDocument();
    expect(screen.getByTitle('Reject')).toBeInTheDocument();
  });

  it('hides approve/reject buttons when not admin', () => {
    const requests = [makePR({ status: 'REQUESTED' })];
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={false} />);

    expect(screen.queryByTitle('Approve')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Reject')).not.toBeInTheDocument();
  });

  it('shows fulfill button for APPROVED requests', () => {
    const requests = [makePR({ status: 'APPROVED' })];
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    expect(screen.getByTitle('Mark Fulfilled')).toBeInTheDocument();
  });

  it('shows New Request button to all roles (technicians create DRAFTs)', () => {
    render(<PurchaseRequestsClient initialRequests={[]} isAdmin={false} />);

    expect(screen.getByRole('button', { name: /new request/i })).toBeInTheDocument();
  });

  it('hides submit button for DRAFT requests when not admin', () => {
    const requests = [makePR({ status: 'DRAFT' })];
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={false} />);

    expect(screen.queryByTitle('Submit for Approval')).not.toBeInTheDocument();
  });

  it('hides fulfill button for APPROVED requests when not admin', () => {
    const requests = [makePR({ status: 'APPROVED' })];
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={false} />);

    expect(screen.queryByTitle('Mark Fulfilled')).not.toBeInTheDocument();
  });

  it('shows dash for REJECTED and FULFILLED actions', () => {
    const requests = [
      makePR({ status: 'REJECTED' }),
      makePR({ status: 'FULFILLED' }),
    ];
    const { container } = render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    const dashSpans = container.querySelectorAll('td:last-child span.text-muted-foreground');
    expect(dashSpans.length).toBe(2);
    dashSpans.forEach(span => {
      expect(span.textContent).toBe('-');
    });
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    const requests = [
      makePR({ status: 'DRAFT' }),
      makePR({ status: 'APPROVED' }),
    ];
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    expect(screen.getByText(/showing 2/i)).toBeInTheDocument();

    const statusSelect = screen.getByRole('combobox', { name: /filter by status/i });
    await user.click(statusSelect);
    const approvedOption = screen.getByRole('option', { name: 'APPROVED' });
    await user.click(approvedOption);

    expect(screen.getByText(/showing 1/i)).toBeInTheDocument();
  });

  it('opens reject dialog when reject button clicked', async () => {
    const user = userEvent.setup();
    const requests = [makePR({ status: 'REQUESTED' })];
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    await user.click(screen.getByTitle('Reject'));
    expect(screen.getByRole('heading', { name: /reject request/i })).toBeInTheDocument();
  });

  it('shows total quantity and item count', () => {
    const requests = [makePR({
      items: [
        { id: 'i1', item_name: 'Mouse', quantity: 10, unit_price: null, total: null, created_at: new Date(), updated_at: new Date() },
        { id: 'i2', item_name: 'Keyboard', quantity: 5, unit_price: null, total: null, created_at: new Date(), updated_at: new Date() },
      ],
    })];
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    expect(screen.getByText('Mouse')).toBeInTheDocument();
    expect(screen.getByText('Keyboard')).toBeInTheDocument();
    const qtyCells = screen.getAllByText('15');
    expect(qtyCells.length).toBeGreaterThanOrEqual(1);
  });

  it('opens print preview when print button clicked on APPROVED row', async () => {
    const user = userEvent.setup();
    const requests = [makePR({ status: 'APPROVED' })];
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={false} />);

    await user.click(screen.getByTitle('Print Request Letter'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /print preview/i })).toBeInTheDocument();
  });

  it('shows Print List button that calls window.print', async () => {
    const user = userEvent.setup();
    window.print = vi.fn();
    const requests = [makePR({ pr_number: 'PR-20260705-AAAA', status: 'APPROVED' })];
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={false} />);

    await user.click(screen.getByRole('button', { name: /print list/i }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('disables Print List when there are no approved requests', () => {
    const requests = [
      makePR({ status: 'DRAFT' }),
      makePR({ status: 'REQUESTED' }),
      makePR({ status: 'REJECTED' }),
      makePR({ status: 'FULFILLED' }),
    ];
    const { container } = render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    expect(screen.getByRole('button', { name: /print list/i })).toBeDisabled();
    expect(container.querySelector('.print-only')).toBeNull();
  });

  it('only includes approved requests in the print list', () => {
    const requests = [
      makePR({ pr_number: 'PR-DRAFT', status: 'DRAFT' }),
      makePR({ pr_number: 'PR-REQUESTED', status: 'REQUESTED' }),
      makePR({ pr_number: 'PR-REJECTED', status: 'REJECTED' }),
      makePR({ pr_number: 'PR-APPROVED', status: 'APPROVED' }),
      makePR({ pr_number: 'PR-FULFILLED', status: 'FULFILLED' }),
    ];
    const { container } = render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    const printSection = container.querySelector('.print-only');
    expect(printSection).not.toBeNull();
    expect(printSection?.textContent).toContain('PR-APPROVED');
    expect(printSection?.textContent).not.toContain('PR-FULFILLED');
    expect(printSection?.textContent).not.toContain('PR-DRAFT');
    expect(printSection?.textContent).not.toContain('PR-REQUESTED');
    expect(printSection?.textContent).not.toContain('PR-REJECTED');
  });

  it('renders a print-only summary of the listed requests', () => {
    const requests = [
      makePR({ pr_number: 'PR-20260705-AAAA', status: 'APPROVED' }),
      makePR({ pr_number: 'PR-20260705-BBBB', status: 'APPROVED' }),
    ];
    const { container } = render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    const printSection = container.querySelector('.print-only');
    expect(printSection).not.toBeNull();
    expect(printSection?.textContent).toContain('College of Computer Studies');
    expect(printSection?.textContent).not.toContain('Procurvin');
    expect(printSection?.textContent).not.toContain('Laboratory Procurement');
    expect(printSection?.querySelector('img[alt="College of Computer Studies logo"]')).not.toBeNull();
    expect(printSection?.querySelector('img[alt="University of Luzon logo"]')).not.toBeNull();
    const logos = printSection?.querySelectorAll('img');
    expect(logos?.[0]?.getAttribute('alt')).toBe('University of Luzon logo');
    expect(logos?.[1]?.getAttribute('alt')).toBe('College of Computer Studies logo');
    expect(printSection?.textContent).toContain('PURCHASE REQUESTS SUMMARY');
    expect(printSection?.textContent).toContain('PR-20260705-AAAA');
    expect(printSection?.textContent).toContain('PR-20260705-BBBB');
    expect(printSection?.textContent).toContain('Mouse');
  });

  it('ends the print-only summary with the 4-block signatory footer', () => {
    const requests = [makePR({ pr_number: 'PR-20260705-AAAA', status: 'APPROVED' })];
    const { container } = render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    const printSection = container.querySelector('.print-only');
    expect(printSection).not.toBeNull();
    for (const role of ['Prepared by', 'Checked by', 'Recommended by', 'Approved by']) {
      expect(printSection?.textContent).toContain(role);
    }
    for (const signer of ['SA', 'Technician', 'Lab Admin', 'Dean']) {
      expect(printSection?.textContent).toContain(signer);
    }
    expect(printSection?.textContent).toContain('Signature over Printed Name');
    expect(printSection?.textContent).toContain('Diosdado C. Caronongan');
  });

  it('places all four signatories in a compact aligned row in order', () => {
    const requests = [makePR({ pr_number: 'PR-20260705-AAAA', status: 'APPROVED' })];
    const { container } = render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    const printSection = container.querySelector('.print-only');
    expect(printSection?.querySelector('.pr-print-letter-paged')).not.toBeNull();
    const columns = printSection?.querySelectorAll('.signature-blocks');
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

  it('keeps the signatory editor out of the printed output', () => {
    const requests = [makePR({ pr_number: 'PR-20260705-AAAA', status: 'APPROVED' })];
    const { container } = render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    const printSection = container.querySelector('.print-only');
    expect(printSection?.querySelectorAll('input').length).toBe(0);
    expect(printSection?.textContent).not.toContain('Signatories for printed list');
  });

  it('hides screen UI sections from the printed output', () => {
    const requests = [makePR({ status: 'APPROVED' })];
    const { container } = render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    const screenTable = container.querySelector('div.bg-card table');
    expect(screenTable?.closest('.report-no-print')).not.toBeNull();
    expect(screen.getByPlaceholderText(/search by pr number/i).closest('.report-no-print')).not.toBeNull();
    expect(screen.getByTitle('Print Request Letter').closest('.report-no-print')).not.toBeNull();
    expect(screen.getByRole('button', { name: /print list/i }).closest('.report-no-print')).not.toBeNull();
  });

  it('displays row totals in PHP pesos', () => {
    const requests = [makePR({
      items: [
        { id: 'i1', item_name: 'Mouse', quantity: 2, unit_price: '150.00', total: '300.00', created_at: new Date(), updated_at: new Date() },
      ],
    })];
    const { container } = render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    expect(onScreenTable(container).getByText('₱300.00')).toBeInTheDocument();
  });

  describe('print preview dialog', () => {
    it('disables Print Preview when there are no approved requests', () => {
      render(<PurchaseRequestsClient initialRequests={[makePR({ status: 'DRAFT' })]} isAdmin={true} />);

      expect(screen.getByRole('button', { name: /print preview/i })).toBeDisabled();
    });

    it('opens the dialog with the approved requests print layout', async () => {
      const user = userEvent.setup();
      const requests = [makePR({ pr_number: 'PR-20260705-ABCD', status: 'APPROVED' })];
      render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

      await user.click(screen.getByRole('button', { name: /print preview/i }));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('PURCHASE REQUESTS SUMMARY')).toBeInTheDocument();
      expect(within(dialog).getByText('PR-20260705-ABCD')).toBeInTheDocument();
      expect(within(dialog).getByText('College of Computer Studies')).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: /download print preview — approved requests as pdf/i })).toBeInTheDocument();
    });

    it('exports the visible dialog paper as a PDF', async () => {
      const user = userEvent.setup();
      vi.mocked(exportNodeAsPdf).mockResolvedValue(undefined);
      const requests = [makePR({ pr_number: 'PR-20260705-ABCD', status: 'APPROVED' })];
      render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

      await user.click(screen.getByRole('button', { name: /print preview/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /download print preview — approved requests as pdf/i }));

      expect(exportNodeAsPdf).toHaveBeenCalledTimes(1);
      const [node, filename] = vi.mocked(exportNodeAsPdf).mock.calls[0];
      expect((node as HTMLElement).className).toContain('pr-print-letter');
      expect((node as HTMLElement).className).not.toContain('report-no-print');
      expect(node).toHaveTextContent('PR-20260705-ABCD');
      expect(filename).toMatch(/^procurvin-approved-requests-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('shows a preparing state while exporting from the dialog', async () => {
      const user = userEvent.setup();
      let finishExport: (() => void) | undefined;
      vi.mocked(exportNodeAsPdf).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finishExport = resolve;
          }),
      );
      const requests = [makePR({ status: 'APPROVED' })];
      render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

      await user.click(screen.getByRole('button', { name: /print preview/i }));
      const dialog = screen.getByRole('dialog');
      const pdfButton = within(dialog).getByRole('button', { name: /download print preview — approved requests as pdf/i });
      await user.click(pdfButton);

      expect(await screen.findByText('Preparing…')).toBeInTheDocument();
      expect(pdfButton).toBeDisabled();

      finishExport?.();
      await waitFor(() => expect(pdfButton).toHaveTextContent('Download PDF'));
    });

    it('shows an error toast when the dialog export fails', async () => {
      const user = userEvent.setup();
      vi.mocked(exportNodeAsPdf).mockRejectedValue(new Error('render failed'));
      const requests = [makePR({ status: 'APPROVED' })];
      render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

      await user.click(screen.getByRole('button', { name: /print preview/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /download print preview — approved requests as pdf/i }));

      await waitFor(() =>
        expect(toastMocks.addToast).toHaveBeenCalledWith(
          'Could not generate the file. Please try again.',
          'error',
        ),
      );
    });
  });
});
