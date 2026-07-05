import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddUnitForm } from '@/app/dashboard/units/components/AddUnitForm';
import { createComputerUnit } from '@/app/_actions/units';

vi.mock('@/lib/toast-context');
vi.mock('@/app/_actions/units', () => ({ createComputerUnit: vi.fn() }));

describe('AddUnitForm', () => {
  const rooms = [
    { id: 'room-1', name: 'Lab A' },
    { id: 'room-2', name: 'Lab B' },
  ];
  let onClose: ReturnType<typeof vi.fn>;
  let onSuccess: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onClose = vi.fn();
    onSuccess = vi.fn();
    vi.mocked(createComputerUnit).mockResolvedValue({ success: true, data: { id: 'unit-1', unit_name: 'U-001' } });
  });

  it('renders form with room selector', () => {
    render(<AddUnitForm onClose={onClose} onSuccess={onSuccess} rooms={rooms} />);

    expect(screen.getByText('Add Computer Unit')).toBeInTheDocument();
    expect(screen.getByLabelText(/unit name/i)).toBeInTheDocument();
    expect(screen.getByText('-- Select Room --')).toBeInTheDocument();
  });

  it('shows error when submission fails', async () => {
    vi.mocked(createComputerUnit).mockResolvedValue({ success: false, error: 'Unit name already exists in room' });

    const user = userEvent.setup();
    render(<AddUnitForm onClose={onClose} onSuccess={onSuccess} rooms={rooms} />);

    await user.type(screen.getByLabelText(/unit name/i), 'U-001');
    await user.click(screen.getByRole('button', { name: /create unit/i }));

    await waitFor(() => {
      expect(screen.getByText('Unit name already exists in room')).toBeInTheDocument();
    });
  });

  it('submits successfully', async () => {
    const user = userEvent.setup();
    render(<AddUnitForm onClose={onClose} onSuccess={onSuccess} rooms={rooms} />);

    await user.type(screen.getByLabelText(/unit name/i), 'U-001');

    const roomSelect = screen.getByRole('combobox');
    await user.click(roomSelect);
    await user.click(screen.getByRole('option', { name: 'Lab A' }));

    await user.click(screen.getByRole('button', { name: /create unit/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
