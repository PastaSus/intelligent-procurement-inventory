import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnitsClient } from '@/app/dashboard/units/UnitsClient';
import { deleteComputerUnitsBatch } from '@/app/_actions/units';

vi.mock('@/app/_actions/units', () => ({
  deleteComputerUnit: vi.fn(),
  deleteComputerUnitsBatch: vi.fn(),
}));

const units = [
  {
    id: 'unit-1',
    unit_name: 'LR201',
    laboratory_room_id: 'room-1',
    created_at: new Date('2026-10-01T00:00:00Z'),
    updated_at: new Date('2026-10-01T00:00:00Z'),
    laboratory_room: { name: 'LR2' },
    _count: { components: 3 },
    components: [{ status: 'FUNCTIONAL' }, { status: 'NEEDS_REPAIR' }, { status: 'FUNCTIONAL' }],
  },
  {
    id: 'unit-2',
    unit_name: 'MM301',
    laboratory_room_id: 'room-2',
    created_at: new Date('2026-10-02T00:00:00Z'),
    updated_at: new Date('2026-10-02T00:00:00Z'),
    laboratory_room: { name: 'MM3' },
    _count: { components: 2 },
    components: [{ status: 'FUNCTIONAL' }, { status: 'NEEDS_REPLACEMENT' }],
  },
];

const rooms = [
  { id: 'room-1', name: 'LR2' },
  { id: 'room-2', name: 'MM3' },
];

function renderUnits(isAdmin = true) {
  return render(
    <UnitsClient
      initialUnits={units}
      totalCount={units.length}
      currentPage={1}
      pageSize={50}
      rooms={rooms}
      isAdmin={isAdmin}
    />
  );
}

describe('UnitsClient batch delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deleteComputerUnitsBatch).mockImplementation(() => new Promise(() => {}));
  });

  it('selects all filtered units and opens the batch delete confirmation', async () => {
    const user = userEvent.setup();
    renderUnits();

    await user.click(screen.getByRole('checkbox', { name: /select all filtered units/i }));

    expect(screen.getByRole('button', { name: /delete 2 selected/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delete 2 selected/i }));

    expect(screen.getByRole('heading', { name: 'Delete 2 Units' })).toBeInTheDocument();
    expect(screen.getByText(/permanently delete 5 components/i)).toBeInTheDocument();
  });

  it('submits the selected unit ids to the batch delete action', async () => {
    const user = userEvent.setup();
    renderUnits();

    await user.click(screen.getByRole('checkbox', { name: /select all filtered units/i }));
    await user.click(screen.getByRole('button', { name: /delete 2 selected/i }));
    await user.click(screen.getByRole('button', { name: 'Delete 2 Units' }));

    await waitFor(() => expect(deleteComputerUnitsBatch).toHaveBeenCalledTimes(1));

    const formData = vi.mocked(deleteComputerUnitsBatch).mock.calls[0][0] as FormData;
    expect(formData.getAll('ids').sort()).toEqual(['unit-1', 'unit-2']);
  });

  it('deselects a unit before deleting', async () => {
    const user = userEvent.setup();
    renderUnits();

    await user.click(screen.getByRole('checkbox', { name: 'Select LR201' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select MM301' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select LR201' }));

    expect(screen.getByRole('button', { name: /delete 1 selected/i })).toBeInTheDocument();
  });

  it('hides batch selection and deletion from non-admin users', () => {
    renderUnits(false);

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete .* selected/i })).not.toBeInTheDocument();
  });
});
