import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditRoomForm } from '@/app/dashboard/rooms/components/EditRoomForm';
import { updateLabRoom } from '@/app/_actions/rooms';

vi.mock('@/lib/toast-context');
vi.mock('@/app/_actions/rooms', () => ({ updateLabRoom: vi.fn() }));

describe('EditRoomForm', () => {
  const room = { id: 'room-1', name: 'Lab 127A' };
  let onClose: ReturnType<typeof vi.fn>;
  let onSuccess: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onClose = vi.fn();
    onSuccess = vi.fn();
    vi.mocked(updateLabRoom).mockResolvedValue({ success: true, data: { ...room, name: 'Updated Lab' } });
  });

  it('renders with pre-populated room name', () => {
    render(<EditRoomForm room={room} onClose={onClose} onSuccess={onSuccess} />);

    expect(screen.getByText('Edit Laboratory Room')).toBeInTheDocument();
    const input = screen.getByLabelText(/room name/i) as HTMLInputElement;
    expect(input.value).toBe('Lab 127A');
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<EditRoomForm room={room} onClose={onClose} onSuccess={onSuccess} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows error on server failure', async () => {
    vi.mocked(updateLabRoom).mockResolvedValue({ success: false, error: 'Room not found' });

    const user = userEvent.setup();
    render(<EditRoomForm room={room} onClose={onClose} onSuccess={onSuccess} />);

    const input = screen.getByLabelText(/room name/i);
    await user.clear(input);
    await user.type(input, 'Updated Lab');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Room not found')).toBeInTheDocument();
    });
  });

  it('submits successfully and calls callbacks', async () => {
    const user = userEvent.setup();
    render(<EditRoomForm room={room} onClose={onClose} onSuccess={onSuccess} />);

    const input = screen.getByLabelText(/room name/i);
    await user.clear(input);
    await user.type(input, 'Updated Lab');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
