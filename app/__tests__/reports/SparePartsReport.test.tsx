import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SparePartsReport } from '@/app/dashboard/reports/spare-parts/SparePartsReport';

const rows = [
  { type: 'KEYBOARD' as const, label: 'KEYBOARD', forReplacement: 7, spareQty: 5, netShortage: 2 },
  { type: 'MOUSE' as const, label: 'MOUSE', forReplacement: 2, spareQty: 5, netShortage: 0 },
  { type: 'MONITOR' as const, label: 'MONITOR', forReplacement: 5, spareQty: 2, netShortage: 3 },
];

const requestRows = [rows[2], rows[0]];
const totals = { forReplacement: 14, spareQty: 12, netShortage: 5 };

function renderReport() {
  return render(
    <SparePartsReport
      rows={rows}
      requestRows={requestRows}
      totals={totals}
      generatedAt={new Date('2026-10-23')}
    />
  );
}

describe('SparePartsReport', () => {
  beforeEach(() => {
    window.print = vi.fn();
  });

  it('renders the category table with replacement and spare quantities', () => {
    renderReport();

    expect(screen.getByText('Spare Parts & Replacement Report')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: /spare parts and replacement by category/i });
    expect(within(table).getByRole('columnheader', { name: 'Item' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'For Replacement' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Spare Qty' })).toBeInTheDocument();
    expect(within(table).getByText('KEYBOARD')).toBeInTheDocument();
    expect(within(table).getByText('MONITOR')).toBeInTheDocument();
    expect(within(table).getByText('14')).toBeInTheDocument();
    expect(within(table).getByText('12')).toBeInTheDocument();
  });

  it('links categories to their filtered component and inventory views', () => {
    renderReport();

    const table = screen.getByRole('table', { name: /spare parts and replacement by category/i });
    expect(within(table).getByRole('link', { name: 'KEYBOARD' })).toHaveAttribute(
      'href',
      '/dashboard/component-status?type=KEYBOARD#component-filter'
    );
    expect(screen.getByLabelText('View 7 KEYBOARD components needing replacement')).toHaveAttribute(
      'href',
      '/dashboard/component-status?type=KEYBOARD&status=NEEDS_REPLACEMENT#component-filter'
    );
    expect(screen.getByLabelText('View KEYBOARD spare parts in inventory')).toHaveAttribute(
      'href',
      '/dashboard/inventory?component_type=KEYBOARD'
    );
  });

  it('shows only net shortages in the replenishment request list', () => {
    renderReport();

    const requestTable = screen.getByRole('table', { name: /replenishment request list/i });
    const requestBodyRows = within(requestTable).getAllByRole('row').slice(1, -1);
    const rowTexts = requestBodyRows.map((row) => row.textContent ?? '');

    expect(rowTexts).toHaveLength(2);
    expect(rowTexts[0]).toContain('MONITOR');
    expect(rowTexts[0]).toContain('3');
    expect(rowTexts[1]).toContain('KEYBOARD');
    expect(rowTexts[1]).toContain('2');
    expect(rowTexts.join(' ')).not.toContain('MOUSE');
    expect(within(requestTable).getByText('Total Request Qty')).toBeInTheDocument();
    expect(within(requestTable).getAllByText('5').length).toBeGreaterThan(0);
  });

  it('prints the report', async () => {
    const user = userEvent.setup();
    renderReport();

    await user.click(screen.getByRole('button', { name: /print/i }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });
});
