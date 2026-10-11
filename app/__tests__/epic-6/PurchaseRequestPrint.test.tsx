import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PurchaseRequestPrint } from '@/app/dashboard/purchase-requests/components/PurchaseRequestPrint';

function makeRequest(overrides: { notes?: string | null } = {}) {
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

  it('renders role labels, typeable name fields, and the default noted name', () => {
    render(<PurchaseRequestPrint request={makeRequest()} onClose={() => {}} />);

    for (const role of ['Prepared by', 'Checked by', 'Approved by', 'Noted by', 'Vice-President']) {
      expect(screen.getAllByText(role).length).toBeGreaterThan(0);
    }
    // Noted-by defaults to the dean; preview input + print-only static text
    expect(screen.getAllByText('Diosdado C. Caronongan').length).toBeGreaterThan(0);
    expect(screen.getByRole('textbox', { name: 'Noted by name' })).toHaveDisplayValue('Diosdado C. Caronongan');
    expect(screen.getByRole('textbox', { name: 'Checked by name' })).toHaveDisplayValue('');
  });

  it('syncs typed signatory names to the print-only letter', async () => {
    const user = userEvent.setup();
    render(<PurchaseRequestPrint request={makeRequest()} onClose={() => {}} />);

    await user.type(screen.getByRole('textbox', { name: 'Checked by name' }), 'Maria Santos');

    expect(screen.getByRole('textbox', { name: 'Checked by name' })).toHaveDisplayValue('Maria Santos');
    // print-only static copy reflects the typed value
    expect(screen.getAllByText('Maria Santos').length).toBeGreaterThan(0);
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

  it('calls onClose when the Close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PurchaseRequestPrint request={makeRequest()} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
