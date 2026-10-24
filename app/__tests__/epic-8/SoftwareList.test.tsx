import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SoftwareList, type SoftwareItem } from '@/app/dashboard/units/[id]/components/SoftwareList';

const application: SoftwareItem = {
  id: 'app-1',
  name: 'Microsoft Office',
  version: '2021',
  license_key: 'ABCD-1234-EFGH',
  license_type: 'COMMERCIAL',
  install_date: null,
};

const writeText = vi.fn().mockResolvedValue(undefined);

describe('SoftwareList license keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  it('masks the license key by default', () => {
    render(<SoftwareList software={[application]} onEdit={vi.fn()} onRemove={vi.fn()} isAdmin />);

    expect(screen.getByText('••••••••')).toBeInTheDocument();
    expect(screen.queryByText('ABCD-1234-EFGH')).not.toBeInTheDocument();
  });

  it('lets an admin reveal the license key', async () => {
    const user = userEvent.setup();
    render(<SoftwareList software={[application]} onEdit={vi.fn()} onRemove={vi.fn()} isAdmin />);

    await user.click(screen.getByRole('button', { name: /show license key/i }));

    expect(screen.getByText('ABCD-1234-EFGH')).toBeInTheDocument();
  });

  it('does not expose reveal controls to technicians', () => {
    render(<SoftwareList software={[application]} onEdit={vi.fn()} onRemove={vi.fn()} isAdmin={false} />);

    expect(screen.getByText('••••••••')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show license key/i })).not.toBeInTheDocument();
  });

  it('copies the license key', async () => {
    const user = userEvent.setup();
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<SoftwareList software={[application]} onEdit={vi.fn()} onRemove={vi.fn()} isAdmin />);

    await user.click(screen.getByRole('button', { name: /copy license key/i }));

    expect(clipboardSpy).toHaveBeenCalledWith('ABCD-1234-EFGH');
  });
});
