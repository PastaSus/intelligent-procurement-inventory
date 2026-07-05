import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    expect(screen.getByText('PR-20260705-ABCD')).toBeInTheDocument();
    expect(screen.getByText('Mouse')).toBeInTheDocument();
  });

  it('shows status badge for each request', () => {
    const requests = [
      makePR({ status: 'DRAFT' }),
      makePR({ status: 'REQUESTED' }),
      makePR({ status: 'APPROVED' }),
      makePR({ status: 'REJECTED' }),
      makePR({ status: 'FULFILLED' }),
    ];
    render(<PurchaseRequestsClient initialRequests={requests} isAdmin={true} />);

    expect(screen.getByText('DRAFT')).toBeInTheDocument();
    expect(screen.getByText('REQUESTED')).toBeInTheDocument();
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
    expect(screen.getByText('REJECTED')).toBeInTheDocument();
    expect(screen.getByText('FULFILLED')).toBeInTheDocument();
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
});
