import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SparePartsReport } from '@/app/dashboard/reports/spare-parts/SparePartsReport';

vi.mock('@/app/_actions/reports', () => ({
  getSparePartsReport: vi.fn(),
}));

import { getSparePartsReport } from '@/app/_actions/reports';

const mockedGetSparePartsReport = getSparePartsReport as ReturnType<typeof vi.fn>;

const rows = [
  { type: 'KEYBOARD' as const, label: 'KEYBOARD', forReplacement: 7, spareQty: 5, netShortage: 2 },
  { type: 'MOUSE' as const, label: 'MOUSE', forReplacement: 2, spareQty: 5, netShortage: 0 },
  { type: 'MONITOR' as const, label: 'MONITOR', forReplacement: 5, spareQty: 2, netShortage: 3 },
];

const requestRows = [rows[2], rows[0]];
const totals = { forReplacement: 14, spareQty: 12, netShortage: 5 };
const roomOptions = [{ id: 'room-1', name: 'Laboratory 101' }];

function renderReport() {
  return render(
    <SparePartsReport
      rows={rows}
      requestRows={requestRows}
      totals={totals}
      roomOptions={roomOptions}
      generatedAt={new Date('2026-10-23')}
    />
  );
}

describe('SparePartsReport', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedGetSparePartsReport.mockResolvedValue({
      success: true,
      data: { rows, requestRows, totals, roomOptions },
    });
    window.print = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
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

  it('renders the three filter selects', () => {
    renderReport();

    expect(screen.getByRole('combobox', { name: /filter by room/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by component type/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by shortages/i })).toBeInTheDocument();
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
    expect(screen.getByRole('link', { name: /hardware inventory report/i })).toHaveAttribute(
      'href',
      '/dashboard/reports'
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

  it('applies the component type filter and renders the filtered response', async () => {
    const monitorOnly = [rows[2]];
    mockedGetSparePartsReport.mockResolvedValueOnce({
      success: true,
      data: {
        rows: monitorOnly,
        requestRows: monitorOnly,
        totals: { forReplacement: 5, spareQty: 2, netShortage: 3 },
        roomOptions,
      },
    });
    const user = userEvent.setup();
    renderReport();

    await user.click(screen.getByRole('combobox', { name: /filter by component type/i }));
    await user.click(screen.getByRole('option', { name: 'MONITOR' }));

    expect(mockedGetSparePartsReport).toHaveBeenLastCalledWith({ componentType: 'MONITOR' });

    const table = screen.getByRole('table', { name: /spare parts and replacement by category/i });
    await waitFor(() => expect(within(table).queryByText('KEYBOARD')).not.toBeInTheDocument());
    expect(within(table).getByText('MONITOR')).toBeInTheDocument();
    expect(within(table).getAllByText('5').length).toBeGreaterThan(0);

    const printDoc = document.querySelector('.print-only');
    expect(printDoc?.textContent).toContain('Component Type: MONITOR');
  });

  it('applies the room filter and renders the filtered response', async () => {
    const keyboardOnly = [rows[0]];
    mockedGetSparePartsReport.mockResolvedValueOnce({
      success: true,
      data: {
        rows: keyboardOnly,
        requestRows: keyboardOnly,
        totals: { forReplacement: 7, spareQty: 5, netShortage: 2 },
        roomOptions,
      },
    });
    const user = userEvent.setup();
    renderReport();

    await user.click(screen.getByRole('combobox', { name: /filter by room/i }));
    await user.click(screen.getByRole('option', { name: 'Laboratory 101' }));

    expect(mockedGetSparePartsReport).toHaveBeenLastCalledWith({ roomId: 'room-1' });

    const table = screen.getByRole('table', { name: /spare parts and replacement by category/i });
    await waitFor(() => expect(within(table).queryByText('MONITOR')).not.toBeInTheDocument());
    expect(within(table).getByText('KEYBOARD')).toBeInTheDocument();

    const printDoc = document.querySelector('.print-only');
    expect(printDoc?.textContent).toContain('Room: Laboratory 101');
  });

  it('shows the inline error and keeps the previous data when a filter fails', async () => {
    mockedGetSparePartsReport.mockResolvedValueOnce({
      success: false,
      error: 'Invalid component type filter',
    });
    const user = userEvent.setup();
    renderReport();

    await user.click(screen.getByRole('combobox', { name: /filter by component type/i }));
    await user.click(screen.getByRole('option', { name: 'MONITOR' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid component type filter');

    const table = screen.getByRole('table', { name: /spare parts and replacement by category/i });
    expect(within(table).getByText('KEYBOARD')).toBeInTheDocument();
    expect(within(table).getByText('MOUSE')).toBeInTheDocument();

    const printDoc = document.querySelector('.print-only');
    expect(printDoc?.textContent).toContain('Component Type: All types');
  });

  it('renders the shortages-only response from the action', async () => {
    const user = userEvent.setup();
    mockedGetSparePartsReport.mockResolvedValueOnce({
      success: true,
      data: {
        rows: [rows[2], rows[0]],
        requestRows: [rows[2], rows[0]],
        totals: { forReplacement: 12, spareQty: 7, netShortage: 5 },
        roomOptions,
      },
    });
    renderReport();

    await user.click(screen.getByRole('combobox', { name: /filter by shortages/i }));
    await user.click(screen.getByRole('option', { name: 'Shortages only' }));

    expect(mockedGetSparePartsReport).toHaveBeenLastCalledWith({ shortagesOnly: true });

    const table = screen.getByRole('table', { name: /spare parts and replacement by category/i });
    await waitFor(() => expect(within(table).queryByText('MOUSE')).not.toBeInTheDocument());
    expect(within(table).getByText('KEYBOARD')).toBeInTheDocument();
    expect(within(table).getByText('MONITOR')).toBeInTheDocument();
    expect(within(table).getByText('12')).toBeInTheDocument();

    const printDoc = document.querySelector('.print-only');
    expect(printDoc?.textContent).toContain('Showing: Shortages only');
  });

  it('keeps all screen content inside the report-no-print area', () => {
    const { container } = renderReport();

    const noPrint = container.querySelector('.report-no-print');
    expect(noPrint).not.toBeNull();
    expect(noPrint).toContainElement(screen.getByRole('combobox', { name: /filter by room/i }));
    expect(noPrint).toContainElement(screen.getByRole('button', { name: /print/i }));
    expect(noPrint).toContainElement(
      screen.getByRole('table', { name: /spare parts and replacement by category/i }),
    );
  });

  it('renders the print-only letterhead document with metadata and tables', () => {
    const { container } = renderReport();

    const printArea = container.querySelector('.print-only');
    expect(printArea).not.toBeNull();

    const printDoc = printArea?.querySelector('.pr-print-letter');
    expect(printDoc).not.toBeNull();
    expect(printDoc?.classList.contains('pr-print-letter-paged')).toBe(true);

    expect(printDoc?.textContent).toContain('SPARE PARTS & REPLACEMENT REPORT');
    expect(printDoc?.textContent).toContain('College of Computer Studies');
    expect(printDoc?.textContent).toContain('Date:');
    expect(printDoc?.textContent).toContain('Room: All rooms');
    expect(printDoc?.textContent).toContain('Component Type: All types');
    expect(printDoc?.textContent).toContain('Showing: All items');
    expect(printDoc?.textContent).toContain('For Replacement:');
    expect(printDoc?.textContent).toContain('Spare Units (all rooms):');
    expect(printDoc?.textContent).toContain('Net Shortage:');
    expect(printDoc?.textContent).toContain('Spare Qty sums available inventory across all rooms');

    const images = Array.from(printDoc?.querySelectorAll('img') ?? []);
    expect(images).toHaveLength(2);
    expect(images.map((image) => image.getAttribute('alt'))).toEqual([
      'University of Luzon logo',
      'College of Computer Studies logo',
    ]);

    expect(printArea?.querySelector('.signature-blocks')).toBeNull();
  });

  it('shows an empty state and print note when a filter returns no rows', async () => {
    mockedGetSparePartsReport.mockResolvedValueOnce({
      success: true,
      data: {
        rows: [],
        requestRows: [],
        totals: { forReplacement: 0, spareQty: 0, netShortage: 0 },
        roomOptions,
      },
    });
    const user = userEvent.setup();
    const { container } = renderReport();

    await user.click(screen.getByRole('combobox', { name: /filter by shortages/i }));
    await user.click(screen.getByRole('option', { name: 'Shortages only' }));

    await waitFor(() => {
      expect(screen.getAllByText('No records match the selected filters.').length).toBeGreaterThan(0);
    });
    const messages = screen.getAllByText('No records match the selected filters.');
    expect(messages.some((message) => !message.closest('.print-only'))).toBe(true);
    expect(container.querySelector('.print-only')?.textContent).toContain(
      'No records match the selected filters.',
    );
  });

  it('prints a no-shortage note when spare stock covers every replacement need', () => {
    const { container } = render(
      <SparePartsReport
        rows={rows}
        requestRows={[]}
        totals={{ forReplacement: 14, spareQty: 12, netShortage: 0 }}
        roomOptions={roomOptions}
        generatedAt={new Date('2026-10-23')}
      />
    );

    expect(container.querySelector('.print-only')?.textContent).toContain(
      'No shortages to request; spare stock covers all replacement needs.',
    );
  });
});
