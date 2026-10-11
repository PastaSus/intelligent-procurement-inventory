import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar, BottomNavigation } from '@/components/navigation';

const mockUsePathname = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
}));
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all nav items', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Rooms')).toBeInTheDocument();
    expect(screen.getByText('Units')).toBeInTheDocument();
    expect(screen.getByText('Component Health')).toBeInTheDocument();
    expect(screen.getByText('Spare Parts')).toBeInTheDocument();
    expect(screen.getByText('Requests')).toBeInTheDocument();
    expect(screen.getByText('AI-Chat')).toBeInTheDocument();
  });

  it('highlights dashboard when on dashboard', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(<Sidebar />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink?.className).toContain('bg-[#402020]');
  });

  it('highlights rooms when on rooms page', () => {
    mockUsePathname.mockReturnValue('/dashboard/rooms');

    render(<Sidebar />);

    const roomsLink = screen.getByText('Rooms').closest('a');
    expect(roomsLink?.className).toContain('bg-[#402020]');
  });

  it('does not highlight dashboard when on sub-page', () => {
    mockUsePathname.mockReturnValue('/dashboard/rooms');

    render(<Sidebar />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink?.className).not.toContain('bg-[#402020]');
  });

  it('collapses when toggle button is clicked', async () => {
    const user = userEvent.setup();
    mockUsePathname.mockReturnValue('/dashboard');

    render(<Sidebar />);

    const collapseButton = screen.getByTitle('Collapse');
    await user.click(collapseButton);

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(collapseButton).toHaveAttribute('title', 'Expand');
  });
});

describe('BottomNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 4 primary items plus a More button (chat excluded, floats separately)', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(<BottomNavigation />);

    expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Rooms')).toBeInTheDocument();
    expect(screen.getByLabelText('Units')).toBeInTheDocument();
    expect(screen.getByLabelText('Component Health')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Spare Parts')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Requests')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Reports')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('AI-Chat')).not.toBeInTheDocument();
  });

  it('opens More sheet with remaining tabs and closes on selection', async () => {
    const user = userEvent.setup();
    mockUsePathname.mockReturnValue('/dashboard');

    render(<BottomNavigation />);

    await user.click(screen.getByRole('button', { name: 'More' }));

    expect(screen.getByRole('dialog', { name: 'More navigation' })).toBeInTheDocument();
    expect(screen.getByText('Spare Parts')).toBeInTheDocument();
    expect(screen.getByText('Requests')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.queryByText('AI-Chat')).not.toBeInTheDocument();

    await user.click(screen.getByText('Reports'));
    expect(screen.queryByRole('dialog', { name: 'More navigation' })).not.toBeInTheDocument();
  });

  it('highlights More button when on an overflow route', () => {
    mockUsePathname.mockReturnValue('/dashboard/reports');

    render(<BottomNavigation />);

    expect(screen.getByRole('button', { name: 'More' }).className).toContain('text-[#402020]');
  });
});
