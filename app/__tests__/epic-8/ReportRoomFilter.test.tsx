import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HardwareReport } from '@/app/dashboard/reports/components/HardwareReport';
import { getHardwareReport } from '@/app/_actions/reports';

vi.mock('@/app/_actions/reports', () => ({ getHardwareReport: vi.fn() }));
vi.mock('@/lib/print', () => ({ printDocument: vi.fn() }));

const roomOptions = [
  { id: 'room-1', name: 'LR2' },
  { id: 'room-2', name: 'MM3' },
];

const unitOptions = [
  { id: 'unit-1', unit_name: 'LR201', laboratory_room: { id: 'room-1', name: 'LR2' } },
  { id: 'unit-2', unit_name: 'MM301', laboratory_room: { id: 'room-2', name: 'MM3' } },
];

const initialRooms = [
  {
    id: 'room-1',
    name: 'LR2',
    units: [
      {
        id: 'unit-1',
        unit_name: 'LR201',
        components: [
          {
            id: 'comp-1',
            type: 'MONITOR' as const,
            serial_number: 'SN-001',
            specifications: '18.5" LED',
            status: 'FUNCTIONAL' as const,
          },
        ],
      },
    ],
  },
];

const filteredRooms = [
  {
    id: 'room-2',
    name: 'MM3',
    units: [
      {
        id: 'unit-2',
        unit_name: 'MM301',
        components: [
          {
            id: 'comp-2',
            type: 'KEYBOARD' as const,
            serial_number: 'SN-002',
            specifications: 'Standard keyboard',
            status: 'NEEDS_REPAIR' as const,
          },
        ],
      },
    ],
  },
];

describe('HardwareReport filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getHardwareReport).mockResolvedValue({
      success: true,
      data: { rooms: filteredRooms, roomOptions, unitOptions },
    });
  });

  function renderReport() {
    return render(
      <HardwareReport
        initialRooms={initialRooms}
        roomOptions={roomOptions}
        unitOptions={unitOptions}
      />
    );
  }

  it('renders dropdown filters and no clickable pill filters', () => {
    renderReport();

    expect(screen.getByRole('combobox', { name: /filter by room/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by unit/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by type/i })).toBeInTheDocument();
    expect(screen.queryByText('By Room')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'All Rooms' })).not.toBeInTheDocument();
  });

  it('filters the report by room', async () => {
    const user = userEvent.setup();
    renderReport();

    await user.click(screen.getByRole('combobox', { name: /filter by room/i }));
    await user.click(screen.getByRole('option', { name: 'MM3' }));

    await waitFor(() => expect(getHardwareReport).toHaveBeenCalledWith({ roomId: 'room-2' }));
  });

  it('filters the report by unit', async () => {
    const user = userEvent.setup();
    renderReport();

    await user.click(screen.getByRole('combobox', { name: /filter by unit/i }));
    await user.click(screen.getByRole('option', { name: 'MM301 (MM3)' }));

    await waitFor(() => expect(getHardwareReport).toHaveBeenCalledWith({ unitId: 'unit-2' }));
  });

  it('resets the unit filter when a room is selected', async () => {
    const user = userEvent.setup();
    renderReport();

    await user.click(screen.getByRole('combobox', { name: /filter by unit/i }));
    await user.click(screen.getByRole('option', { name: 'MM301 (MM3)' }));
    await waitFor(() => expect(getHardwareReport).toHaveBeenCalledWith({ unitId: 'unit-2' }));

    await user.click(screen.getByRole('combobox', { name: /filter by room/i }));
    await user.click(screen.getByRole('option', { name: 'LR2' }));

    await waitFor(() => expect(getHardwareReport).toHaveBeenLastCalledWith({ roomId: 'room-1' }));
  });

  it('filters the report by status and type', async () => {
    const user = userEvent.setup();
    renderReport();

    await user.click(screen.getByRole('combobox', { name: /filter by status/i }));
    await user.click(screen.getByRole('option', { name: 'NEEDS REPAIR' }));
    await waitFor(() => expect(getHardwareReport).toHaveBeenCalledWith({ status: 'NEEDS_REPAIR' }));

    await user.click(screen.getByRole('combobox', { name: /filter by type/i }));
    await user.click(screen.getByRole('option', { name: 'KEYBOARD' }));
    await waitFor(() => expect(getHardwareReport).toHaveBeenLastCalledWith({ status: 'NEEDS_REPAIR', componentType: 'KEYBOARD' }));
  });

  it('keeps UI chrome out of the printed report and documents the active filters', () => {
    const { container } = renderReport();

    expect(screen.getByText('Total Rooms').closest('.report-no-print')).not.toBeNull();
    const printArea = container.querySelector('.print-only');
    expect(printArea?.textContent).toContain('Filters: All rooms · All units · All statuses · All types');
  });
});
