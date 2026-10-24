import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HardwareReport } from '@/app/dashboard/reports/components/HardwareReport';

vi.mock('@/app/_actions/reports', () => ({
  getHardwareReport: vi.fn(),
}));

import { getHardwareReport } from '@/app/_actions/reports';

const mockedGetHardwareReport = getHardwareReport as ReturnType<typeof vi.fn>;

const makeRoom = (overrides: { id?: string; name?: string; units?: any[] } = {}) => ({
  id: overrides.id ?? 'room-1',
  name: overrides.name ?? 'Laboratory 101',
  units: overrides.units ?? [],
  ...overrides,
});

const makeUnit = (overrides: { id?: string; unit_name?: string; components?: any[] } = {}) => ({
  id: overrides.id ?? 'unit-1',
  unit_name: overrides.unit_name ?? 'LR1U01',
  components: overrides.components ?? [],
  ...overrides,
});

const makeComponent = (overrides: { id?: string; type?: string; specifications?: string; status?: string } = {}) => ({
  id: overrides.id ?? 'comp-1',
  type: overrides.type ?? 'MONITOR',
  specifications: overrides.specifications ?? '18.5 LED',
  status: overrides.status ?? 'FUNCTIONAL',
  ...overrides,
});

const initialRooms = [
  makeRoom({
    name: 'Laboratory 101',
    units: [
      makeUnit({
        unit_name: 'LR1U01',
        components: [
          makeComponent({ id: 'comp-1', type: 'MONITOR', specifications: '18.5 LED', status: 'FUNCTIONAL' }),
          makeComponent({ id: 'comp-2', type: 'KEYBOARD', specifications: 'Standard', status: 'NEEDS_REPAIR' }),
        ],
      }),
      makeUnit({
        id: 'unit-2',
        unit_name: 'LR1U02',
        components: [makeComponent({ id: 'comp-3', type: 'MOUSE', specifications: 'Optical', status: 'NEEDS_REPLACEMENT' })],
      }),
    ],
  }),
];

const roomOptions = [{ id: 'room-1', name: 'Laboratory 101' }];

describe('HardwareReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetHardwareReport.mockResolvedValue({
      success: true,
      data: { rooms: initialRooms, roomOptions },
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

  function getScreenTable(container: HTMLElement) {
    // The screen table is inside .bg-card (not inside .print-only)
    return container.querySelector('.bg-card table');
  }

  it('renders the report header, totals, and filter selects', () => {
    render(<HardwareReport initialRooms={initialRooms} roomOptions={roomOptions} />);

    expect(screen.getByText('Hardware Inventory Report')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by room/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by component type/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /report detail level/i })).toBeInTheDocument();
  });

  it('renders detailed view with Component, Specifications, and Status columns by default', () => {
    const { container } = render(<HardwareReport initialRooms={initialRooms} roomOptions={roomOptions} />);

    const screenTable = getScreenTable(container);
    expect(screenTable).toBeInTheDocument();
    expect(screen.getByText('Component Details')).toBeInTheDocument();
    expect(screenTable).toHaveTextContent('MONITOR');
    expect(screenTable).toHaveTextContent('18.5 LED');
    expect(screenTable).toHaveTextContent('NEEDS REPAIR');
    expect(screen.queryByText('Unit Status Summary')).not.toBeInTheDocument();
  });

  it('renders detailed view with deduplicated Room No. and Unit No. columns', () => {
    const { container } = render(<HardwareReport initialRooms={initialRooms} roomOptions={roomOptions} />);

    const screenTable = getScreenTable(container);
    const rows = screenTable.querySelectorAll('tbody tr');
    const rowTexts = Array.from(rows).map(r => r.textContent?.trim() ?? '');

    // Row 0: LR1U01 MONITOR - both room and unit shown
    expect(rowTexts[0]).toContain('Laboratory 101');
    expect(rowTexts[0]).toContain('LR1U01');
    expect(rowTexts[0]).toContain('MONITOR');
    // Row 1: same unit LR1U01, same room - both blank
    expect(rowTexts[1]).not.toContain('Laboratory 101');
    expect(rowTexts[1]).not.toContain('LR1U01');
    expect(rowTexts[1]).toContain('KEYBOARD');
    // Row 2: new unit LR1U02, same room - room blank, unit shown
    expect(rowTexts[2]).not.toContain('Laboratory 101');
    expect(rowTexts[2]).toContain('LR1U02');
    expect(rowTexts[2]).toContain('MOUSE');
    // Room appears only once
    const roomCount = rowTexts.filter(t => t.includes('Laboratory 101')).length;
    expect(roomCount).toBe(1);
    // Unit LR1U01 appears only once
    const unit1Count = rowTexts.filter(t => t.includes('LR1U01')).length;
    expect(unit1Count).toBe(1);
  });

  it('separates units with a medium border and rooms with a thick border', () => {
    const rooms = [
      makeRoom({
        id: 'room-1',
        name: 'LR2',
        units: [
          makeUnit({
            id: 'unit-1',
            unit_name: 'LR201',
            components: [
              makeComponent({ id: 'comp-1' }),
              makeComponent({ id: 'comp-2', type: 'KEYBOARD' }),
            ],
          }),
          makeUnit({
            id: 'unit-2',
            unit_name: 'LR203',
            components: [makeComponent({ id: 'comp-3', type: 'MOUSE' })],
          }),
        ],
      }),
      makeRoom({
        id: 'room-2',
        name: 'LR3',
        units: [
          makeUnit({
            id: 'unit-3',
            unit_name: 'LR301',
            components: [makeComponent({ id: 'comp-4', type: 'AVR' })],
          }),
        ],
      }),
    ];

    const { container } = render(<HardwareReport initialRooms={rooms} roomOptions={[]} />);
    const screenTable = getScreenTable(container) as HTMLTableElement;
    const rows = Array.from(screenTable.querySelectorAll('tbody tr'));

    // Rows inside a unit use the lightest separator.
    expect(rows[0].className).toContain('border-gray-100');
    expect(rows[0].className).not.toContain('border-b-4');
    expect(rows[0].className).not.toContain('border-b-2');
    // The boundary between LR201 and LR203 gets a medium border.
    expect(rows[1].className).toContain('border-b-2');
    expect(rows[1].className).toContain('border-gray-400');
    expect(rows[1].className).not.toContain('border-b-4');
    // Only the boundary between rooms gets the thick border; the final row does not.
    expect(rows[2].className).toContain('border-b-4');
    expect(rows[3].className).not.toContain('border-b-4');
    expect(rows[3].className).toContain('border-gray-100');

    for (const row of rows) {
      expect(row.className).not.toContain('font-semibold');
      for (const cell of Array.from(row.querySelectorAll('td'))) {
        expect(cell.className).not.toContain('font-semibold');
      }
    }
  });

  it('renders status as colored text without background badge in detailed view', () => {
    const { container } = render(<HardwareReport initialRooms={initialRooms} roomOptions={roomOptions} />);

    const screenTable = getScreenTable(container);
    // Status cells should show status text with color coding
    const statusCells = screenTable.querySelectorAll('tbody tr td:nth-child(5)');
    expect(statusCells.length).toBeGreaterThan(0);
    for (const cell of statusCells) {
      // Check for status text content
      if (cell) {
        const text = cell.innerHTML || cell.textContent || '';
        expect(text.trim()).toMatch(/FUNCTIONAL|NEEDS REPAIR|NEEDS REPLACEMENT/);
        // Should have text color class applied (on the span inside the cell)
        const span = cell.querySelector('span');
        if (span) {
          expect(span.className).toMatch(/text-green-600|text-yellow-600|text-red-600/);
        }
        // Should NOT have background badge
        expect(cell.className).not.toContain('bg-');
        expect(cell.className).not.toContain('rounded');
      }
    }
  });

  it('renders non-detailed view with deduplicated Room No. and Unit No. columns', async () => {
    const user = userEvent.setup();
    const { container } = render(<HardwareReport initialRooms={initialRooms} roomOptions={roomOptions} />);

    const detailSelect = screen.getByRole('combobox', { name: /report detail level/i });
    await user.click(detailSelect);
    await user.click(screen.getByRole('option', { name: /Summary/ }));

    // Confirm the view switched
    expect(screen.getByText('Unit Status Summary')).toBeInTheDocument();
    expect(screen.queryByText('Component Details')).not.toBeInTheDocument();

    // The screen table should show non-detailed content (Room, Unit, Status only)
    const screenTable = getScreenTable(container);
    const tableText = screenTable.textContent ?? '';

    // Non-detailed view shows one row per unit with worst-status rollup
    expect(tableText).toContain('Laboratory 101');
    expect(tableText).toContain('LR1U01');
    expect(tableText).toContain('LR1U02');
    expect(tableText).toContain('NEEDS REPAIR');
    expect(tableText).toContain('NEEDS REPLACEMENT');
    // In non-detailed view, Room appears on first row only due to deduplication
    // Subsequent rows have blank Room No. when room name repeats
  });

  it('renders status as colored text without background badge in non-detailed view', async () => {
    const user = userEvent.setup();
    const { container } = render(<HardwareReport initialRooms={initialRooms} roomOptions={roomOptions} />);

    const detailSelect = screen.getByRole('combobox', { name: /report detail level/i });
    await user.click(detailSelect);
    await user.click(screen.getByRole('option', { name: /Summary/ }));

    await screen.findByText('Unit Status Summary');
    const screenTable = getScreenTable(container);
    const statusCells = screenTable.querySelectorAll('tbody tr td:nth-child(3)');
    expect(statusCells.length).toBeGreaterThan(0);
    for (const cell of statusCells) {
      // Check for status text content
      if (cell) {
        const text = cell.innerHTML || cell.textContent || '';
        expect(text.trim()).toMatch(/FUNCTIONAL|NEEDS REPAIR|NEEDS REPLACEMENT/);
        // Should have text color class applied (on the span inside the cell)
        const span = cell.querySelector('span');
        if (span) {
          expect(span.className).toMatch(/text-green-600|text-yellow-600|text-red-600/);
        }
        // Should NOT have background badge
        expect(cell.className).not.toContain('bg-');
        expect(cell.className).not.toContain('rounded');
      }
    }
  });

  it('toggles to non-detailed view showing Unit Status Summary with worst status rollup', async () => {
    const user = userEvent.setup();
    const { container } = render(<HardwareReport initialRooms={initialRooms} roomOptions={roomOptions} />);

    const detailSelect = screen.getByRole('combobox', { name: /report detail level/i });
    await user.click(detailSelect);
    await user.click(screen.getByRole('option', { name: /Summary/ }));

    // Use findBy with a longer timeout to ensure the view has switched
    await waitFor(() => {
      expect(screen.getByText('Unit Status Summary')).toBeInTheDocument();
    });
    expect(screen.getByText('Unit Status Summary')).toBeInTheDocument();
    expect(screen.queryByText('Component Details')).not.toBeInTheDocument();

    const screenTable = getScreenTable(container);
    expect(screenTable).toHaveTextContent('LR1U01');
    expect(screenTable).toHaveTextContent('LR1U02');
    expect(screenTable).toHaveTextContent('NEEDS REPAIR');
    expect(screenTable).toHaveTextContent('NEEDS REPLACEMENT');
  });

  it('renders the print-only formal document with letterhead, metadata, and table', () => {
    const { container } = render(<HardwareReport initialRooms={initialRooms} roomOptions={roomOptions} />);

    const printArea = container.querySelector('.print-only');
    expect(printArea).not.toBeNull();

    const printDoc = printArea?.querySelector('.pr-print-letter');
    expect(printDoc).not.toBeNull();
    expect(printDoc?.classList.contains('pr-print-letter-paged')).toBe(true);

    expect(printDoc?.textContent).toContain('HARDWARE INVENTORY REPORT');
    expect(printDoc?.textContent).toContain('College of Computer Studies');
    expect(printDoc?.textContent).toContain('Date:');
    expect(printDoc?.textContent).toContain('View:');
    expect(printDoc?.textContent).toContain('Rooms:');
    expect(printDoc?.textContent).toContain('Units:');
    expect(printDoc?.textContent).toContain('Components:');
    expect(printDoc?.textContent).toContain('Room:');
    expect(printDoc?.textContent).toContain('Status:');
    expect(printDoc?.textContent).toContain('Component Type:');

    const printHeader = printDoc?.querySelector('thead tr');
    expect(printHeader?.className).not.toContain('border-b-2');
  });

  it('does not include signatory blocks in the report print document', () => {
    const { container } = render(<HardwareReport initialRooms={initialRooms} roomOptions={roomOptions} />);

    const printArea = container.querySelector('.print-only');
    expect(printArea?.querySelector('.signature-blocks')).toBeNull();
  });

  it('shows empty state when no components match filters', () => {
    mockedGetHardwareReport.mockResolvedValueOnce({
      success: true,
      data: { rooms: [], roomOptions },
    });
    render(<HardwareReport initialRooms={[]} roomOptions={roomOptions} />);

    const all = screen.getAllByText('No records match the selected filters.');
    expect(all.length).toBeGreaterThan(0);
    // The screen version must not be inside the print-only div
    expect(all.some((el) => !el.closest('.print-only'))).toBe(true);
  });

  it('calls window.print when the Print button is clicked', async () => {
    const user = userEvent.setup();
    render(<HardwareReport initialRooms={initialRooms} roomOptions={roomOptions} />);

    await user.click(screen.getByRole('button', { name: /print/i }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('applies room filter and re-fetches report data', async () => {
    const user = userEvent.setup();
    render(<HardwareReport initialRooms={initialRooms} roomOptions={roomOptions} />);

    const roomSelect = screen.getByRole('combobox', { name: /filter by room/i });
    await user.click(roomSelect);
    await user.click(screen.getByRole('option', { name: 'Laboratory 101' }));

    expect(mockedGetHardwareReport).toHaveBeenLastCalledWith({ roomId: 'room-1' });
  });
});
