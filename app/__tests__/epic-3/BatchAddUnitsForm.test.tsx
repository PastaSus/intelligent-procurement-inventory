import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchAddUnitsForm } from '@/app/dashboard/units/components/BatchAddUnitsForm';
import { createComputerUnitsBatch } from '@/app/_actions/units';

vi.mock('@/lib/toast-context');
vi.mock('@/app/_actions/units', () => ({ createComputerUnitsBatch: vi.fn() }));

describe('BatchAddUnitsForm', () => {
  const rooms = [
    { id: 'room-1', name: 'Lab A' },
    { id: 'room-2', name: 'Lab B' },
  ];
  let onClose: Mock<() => void>;
  let onSuccess: Mock<() => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    onClose = vi.fn<() => void>();
    onSuccess = vi.fn<() => void>();
    vi.mocked(createComputerUnitsBatch).mockResolvedValue({
      success: true,
      data: { count: 5, first: 'MM326', last: 'MM330' },
    });
  });

  it('renders the batch form fields', () => {
    render(<BatchAddUnitsForm onClose={onClose} onSuccess={onSuccess} rooms={rooms} />);

    expect(screen.getByText('Batch Add Computer Units')).toBeInTheDocument();
    expect(screen.getByLabelText(/unit prefix/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of units/i)).toBeInTheDocument();
    expect(screen.getByText('-- Select Room --')).toBeInTheDocument();
  });

  it('suggests a prefix from the selected room', async () => {
    const user = userEvent.setup();
    render(<BatchAddUnitsForm onClose={onClose} onSuccess={onSuccess} rooms={rooms} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Lab A' }));

    expect(screen.getByLabelText(/unit prefix/i)).toHaveValue('LABA');
    expect(screen.getByText('LABA01, LABA02, LABA03, LABA04, LABA05')).toBeInTheDocument();
  });

  it('uppercases the prefix and previews sequential names', async () => {
    const user = userEvent.setup();
    render(<BatchAddUnitsForm onClose={onClose} onSuccess={onSuccess} rooms={rooms} />);

    await user.type(screen.getByLabelText(/unit prefix/i), 'mm3');
    const startInput = screen.getByLabelText(/start number/i);
    await user.clear(startInput);
    await user.type(startInput, '26');

    expect(screen.getByLabelText(/unit prefix/i)).toHaveValue('MM3');
    expect(screen.getByText('MM326, MM327, MM328, MM329, MM330')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create 5 units/i })).toBeInTheDocument();
  });

  it('submits the selected room, prefix, start, and count', async () => {
    const user = userEvent.setup();
    render(<BatchAddUnitsForm onClose={onClose} onSuccess={onSuccess} rooms={rooms} />);

    await user.type(screen.getByLabelText(/unit prefix/i), 'mm3');
    const startInput = screen.getByLabelText(/start number/i);
    await user.clear(startInput);
    await user.type(startInput, '26');

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Lab A' }));

    await user.click(screen.getByRole('button', { name: /create 5 units/i }));

    await waitFor(() => {
      expect(createComputerUnitsBatch).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    const formData = vi.mocked(createComputerUnitsBatch).mock.calls[0][0] as FormData;
    expect(formData.get('prefix')).toBe('MM3');
    expect(formData.get('startNumber')).toBe('26');
    expect(formData.get('count')).toBe('5');
    expect(formData.get('laboratoryRoomId')).toBe('room-1');
  });

  it('shows the server error when the batch cannot be created', async () => {
    vi.mocked(createComputerUnitsBatch).mockResolvedValue({
      success: false,
      error: 'These units already exist in Lab A: MM326',
    });

    const user = userEvent.setup();
    render(<BatchAddUnitsForm onClose={onClose} onSuccess={onSuccess} rooms={rooms} />);

    await user.type(screen.getByLabelText(/unit prefix/i), 'MM3');
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Lab A' }));

    await user.click(screen.getByRole('button', { name: /create 5 units/i }));

    await waitFor(() => {
      expect(screen.getByText('These units already exist in Lab A: MM326')).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('requires a laboratory room', async () => {
    const user = userEvent.setup();
    render(<BatchAddUnitsForm onClose={onClose} onSuccess={onSuccess} rooms={rooms} />);

    await user.type(screen.getByLabelText(/unit prefix/i), 'MM3');
    await user.click(screen.getByRole('button', { name: /create 5 units/i }));

    expect(screen.getByText('Select a laboratory room')).toBeInTheDocument();
    expect(createComputerUnitsBatch).not.toHaveBeenCalled();
  });
});
