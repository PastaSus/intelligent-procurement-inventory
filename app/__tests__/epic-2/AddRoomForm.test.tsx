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
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument();
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
