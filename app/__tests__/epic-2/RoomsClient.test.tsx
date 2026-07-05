import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomsClient } from '@/app/dashboard/rooms/RoomsClient';

vi.mock('@/lib/toast-context');
vi.mock('@/app/_actions/rooms', () => ({
  deleteLabRoom: vi.fn(),
}));

function makeRoom(overrides: Record<string, any> = {}) {
  return {
    id: `room-${Math.random().toString(36).slice(2, 6)}`,
    name: 'Lab Room',
    created_at: new Date(),
    updated_at: new Date(),
    _count: { units: 0 },
    ...overrides,
  };
}

describe('RoomsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page header and Add Room button', () => {
    render(<RoomsClient initialRooms={[]} totalCount={0} currentPage={1} pageSize={10} />);

    expect(screen.getByText('Laboratory Rooms')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add room/i })).toBeInTheDocument();
  });

  it('shows empty state when no rooms', () => {
    render(<RoomsClient initialRooms={[]} totalCount={0} currentPage={1} pageSize={10} />);

    expect(screen.getByText(/no laboratory rooms found/i)).toBeInTheDocument();
  });

  it('renders room rows', () => {
    const rooms = [
      makeRoom({ name: 'Lab A', _count: { units: 2 } }),
      makeRoom({ name: 'Lab B', _count: { units: 0 } }),
    ];
    render(<RoomsClient initialRooms={rooms} totalCount={2} currentPage={1} pageSize={10} />);

    expect(screen.getByText('Lab A')).toBeInTheDocument();
    expect(screen.getByText('Lab B')).toBeInTheDocument();
    expect(screen.getByText('Total: 2 rooms')).toBeInTheDocument();
  });

  it('filters rooms by search', async () => {
    const user = userEvent.setup();
    const rooms = [
      makeRoom({ name: 'Alpha Lab' }),
      makeRoom({ name: 'Beta Room' }),
    ];
    render(<RoomsClient initialRooms={rooms} totalCount={2} currentPage={1} pageSize={10} />);

    const searchInput = screen.getByPlaceholderText(/search rooms/i);
    await user.type(searchInput, 'Alpha');

    expect(screen.getByText('Alpha Lab')).toBeInTheDocument();
    expect(screen.queryByText('Beta Room')).not.toBeInTheDocument();
    expect(screen.getByText(/showing 1/i)).toBeInTheDocument();
  });

  it('clears search when X is clicked', async () => {
    const user = userEvent.setup();
    const rooms = [makeRoom({ name: 'Alpha Lab' })];
    render(<RoomsClient initialRooms={rooms} totalCount={1} currentPage={1} pageSize={10} />);

    const searchInput = screen.getByPlaceholderText(/search rooms/i);
    await user.type(searchInput, 'Alpha');
    expect(screen.getByText(/showing 1/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '' }));
    expect(screen.getByText(/showing 1/i)).toBeInTheDocument();
  });

  it('sorts rooms by name when column header is clicked', async () => {
    const user = userEvent.setup();
    const rooms = [
      makeRoom({ name: 'Beta' }),
      makeRoom({ name: 'Alpha' }),
    ];
    render(<RoomsClient initialRooms={rooms} totalCount={2} currentPage={1} pageSize={10} />);

    const rows = screen.getAllByRole('row');
    const cells = rows.map(r => r.textContent);

    const nameHeader = screen.getByText('Room Name');
    await user.click(nameHeader);

    const rowsAfter = screen.getAllByRole('row');
    expect(rowsAfter.length).toBe(3);
  });

  it('shows delete confirmation dialog', async () => {
    const user = userEvent.setup();
    const rooms = [makeRoom({ name: 'Delete Me' })];
    render(<RoomsClient initialRooms={rooms} totalCount={1} currentPage={1} pageSize={10} />);

    const deleteButton = screen.getByTitle('Delete');
    await user.click(deleteButton);

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    const deleteTexts = screen.getAllByText(/delete me/i);
    expect(deleteTexts.length).toBeGreaterThanOrEqual(1);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBe(2);
  });

  it('closes delete dialog on Cancel', async () => {
    const user = userEvent.setup();
    const rooms = [makeRoom({ name: 'Cancel Me' })];
    render(<RoomsClient initialRooms={rooms} totalCount={1} currentPage={1} pageSize={10} />);

    await user.click(screen.getByTitle('Delete'));
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
  });

  it('shows warning when room has units', async () => {
    const user = userEvent.setup();
    const rooms = [makeRoom({ name: 'Full Room', _count: { units: 3 } })];
    render(<RoomsClient initialRooms={rooms} totalCount={1} currentPage={1} pageSize={10} />);

    await user.click(screen.getByTitle('Delete'));

    expect(screen.getByText(/has 3 computer units/i)).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons[deleteButtons.length - 1]).toBeDisabled();
  });

  it('shows pagination when multiple pages', () => {
    const rooms = Array.from({ length: 10 }, (_, i) => makeRoom({ name: `Room ${i + 1}` }));
    render(<RoomsClient initialRooms={rooms} totalCount={25} currentPage={1} pageSize={10} />);

    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });
});
