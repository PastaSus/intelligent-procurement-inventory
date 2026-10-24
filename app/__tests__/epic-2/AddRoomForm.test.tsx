import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddRoomForm } from '@/app/dashboard/rooms/components/AddRoomForm';
import { createLabRoom } from '@/app/_actions/rooms';

vi.mock('@/lib/toast-context');
vi.mock('@/app/_actions/rooms', () => ({ createLabRoom: vi.fn() }));

describe('AddRoomForm', () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onSuccess: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onClose = vi.fn();
    onSuccess = vi.fn();
    vi.mocked(createLabRoom).mockResolvedValue({ success: true, data: { id: 'room-1', name: 'Lab 127A' } });
  });

  it('renders the form with inputs and buttons', () => {
    render(<AddRoomForm onClose={onClose} onSuccess={onSuccess} />);

    expect(screen.getByText('Add Laboratory Room')).toBeInTheDocument();
    expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of pcs/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument();
  });

  it('previews generated unit names from the room name and count', async () => {
    const user = userEvent.setup();
    render(<AddRoomForm onClose={onClose} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/room name/i), 'LR2');
    const countInput = screen.getByLabelText(/number of pcs/i);
    await user.clear(countInput);
    await user.type(countInput, '3');

    expect(screen.getByText('Units to be created')).toBeInTheDocument();
    expect(screen.getByText('LR201, LR202, LR203')).toBeInTheDocument();
  });

  it('submits the requested unit count', async () => {
    const user = userEvent.setup();
    render(<AddRoomForm onClose={onClose} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/room name/i), 'LR2');
    const countInput = screen.getByLabelText(/number of pcs/i);
    await user.clear(countInput);
    await user.type(countInput, '3');
    await user.click(screen.getByRole('button', { name: /create room/i }));

    await waitFor(() => {
      expect(createLabRoom).toHaveBeenCalledTimes(1);
    });
    const formData = vi.mocked(createLabRoom).mock.calls[0][0] as FormData;
    expect(formData.get('unitCount')).toBe('3');
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<AddRoomForm onClose={onClose} onSuccess={onSuccess} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows error message when server action fails', async () => {
    vi.mocked(createLabRoom).mockResolvedValue({ success: false, error: 'Room name already exists' });

    const user = userEvent.setup();
    render(<AddRoomForm onClose={onClose} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/room name/i), 'Duplicate');
    await user.click(screen.getByRole('button', { name: /create room/i }));

    await waitFor(() => {
      expect(screen.getByText('Room name already exists')).toBeInTheDocument();
    });
  });

  it('calls onSuccess and onClose on successful creation', async () => {
    const user = userEvent.setup();
    render(<AddRoomForm onClose={onClose} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/room name/i), 'Lab 127A');
    await user.click(screen.getByRole('button', { name: /create room/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('disables inputs while submitting', async () => {
    vi.mocked(createLabRoom).mockImplementation(() => new Promise(() => {}));

    const user = userEvent.setup();
    render(<AddRoomForm onClose={onClose} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/room name/i), 'Lab');
    await user.click(screen.getByRole('button', { name: /create room/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });
  });
});
