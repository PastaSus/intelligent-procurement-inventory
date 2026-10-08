import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PurchaseRequestsClient } from '@/app/dashboard/purchase-requests/PurchaseRequestsClient';

vi.mock('@/lib/toast-context');
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

    const statusSelect = screen.getByRole('combobox');
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
    expect(screen.getByText(/print preview/i)).toBeInTheDocument();
  });

  it('shows Print List button that calls window.print', async () => {
    const user = userEvent.setup();
    window.print = vi.fn();
    const requests = [makePR({ pr_number: 'PR-20260705-AAAA' })];
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={false} />);

    await user.click(screen.getByRole('button', { name: /print list/i }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('renders a print-only summary of the listed requests', () => {
    const requests = [
      makePR({ pr_number: 'PR-20260705-AAAA' }),
      makePR({ pr_number: 'PR-20260705-BBBB' }),
    ];
    const { container } = render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    const printSection = container.querySelector('.print-only');
    expect(printSection).not.toBeNull();
    expect(printSection?.textContent).toContain('PURCHASE REQUESTS SUMMARY');
    expect(printSection?.textContent).toContain('PR-20260705-AAAA');
    expect(printSection?.textContent).toContain('PR-20260705-BBBB');
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
});
