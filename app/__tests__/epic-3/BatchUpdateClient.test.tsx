import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchUpdateClient } from '@/app/dashboard/units/batch-update/BatchUpdateClient';
import { batchUpdateComponents } from '@/app/_actions/components';

vi.mock('@/lib/toast-context');
vi.mock('@/app/_actions/components', () => ({ batchUpdateComponents: vi.fn() }));

interface TestComponent {
  id: string;
  type: string;
  serial_number: string;
  specifications: string;
  status: string;
  computer_unit: {
    id: string;
    unit_name: string;
    laboratory_room: { id: string; name: string };
  };
}

function makeComponent(overrides: Partial<TestComponent> = {}): TestComponent {
  return {
    id: 'comp-1',
    type: 'MONITOR',
    serial_number: 'SN-001',
    specifications: '18.5" LED',
    status: 'FUNCTIONAL',
    computer_unit: {
      id: 'unit-1',
      unit_name: 'LR201',
      laboratory_room: { id: 'room-1', name: 'LR2' },
    },
    ...overrides,
  };
}

const componentTypes = [
  'MOTHERBOARD',
  'PROCESSOR',
  'MEMORY',
  'HDD',
  'MONITOR',
  'KEYBOARD',
  'MOUSE',
  'AVR',
  'OPTICAL_DRIVE',
] as const;

describe('BatchUpdateClient', () => {
  const components = [
    makeComponent(),
    makeComponent({
      id: 'comp-2',
      type: 'KEYBOARD',
      serial_number: 'SN-002',
      specifications: 'Standard keyboard',
      status: 'NEEDS_REPAIR',
      computer_unit: {
        id: 'unit-2',
        unit_name: 'MM301',
        laboratory_room: { id: 'room-2', name: 'MM3' },
      },
    }),
    makeComponent({
      id: 'comp-3',
      type: 'MOUSE',
      serial_number: 'SN-003',
      specifications: 'Optical mouse',
      computer_unit: {
        id: 'unit-3',
        unit_name: 'LR401',
        laboratory_room: { id: 'room-3', name: 'LR4' },
      },
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(batchUpdateComponents).mockResolvedValue({
      success: true,
      data: { count: 2, units: 2 },
    });
  });

  it('lists components across units with room and status', () => {
    render(<BatchUpdateClient initialComponents={components} componentTypes={componentTypes} />);

    expect(screen.getByText('LR201')).toBeInTheDocument();
    expect(screen.getByText('MM301')).toBeInTheDocument();
    expect(screen.getByText('LR401')).toBeInTheDocument();
    expect(screen.getByText('3 total components')).toBeInTheDocument();
    expect(screen.getByText('NEEDS REPAIR')).toBeInTheDocument();
  });

  it('filters components by room', async () => {
    const user = userEvent.setup();
    render(<BatchUpdateClient initialComponents={components} componentTypes={componentTypes} />);

    await user.click(screen.getByRole('combobox', { name: /filter by room/i }));
    await user.click(screen.getByRole('option', { name: 'MM3' }));

    expect(screen.queryByText('LR201')).not.toBeInTheDocument();
    expect(screen.getByText('MM301')).toBeInTheDocument();
    expect(screen.getByText('1 component shown · 0 selected')).toBeInTheDocument();
  });

  it('selects all filtered components', async () => {
    const user = userEvent.setup();
    render(<BatchUpdateClient initialComponents={components} componentTypes={componentTypes} />);

    await user.click(screen.getByRole('combobox', { name: /filter by room/i }));
    await user.click(screen.getByRole('option', { name: 'LR4' }));
    await user.click(screen.getByRole('checkbox', { name: /select all filtered/i }));

    expect(screen.getByText('1 component shown · 1 selected')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select LR401 MOUSE' })).toBeChecked();
  });

  it('updates the status of selected components across units', async () => {
    const user = userEvent.setup();
    render(<BatchUpdateClient initialComponents={components} componentTypes={componentTypes} />);

    await user.click(screen.getByRole('checkbox', { name: 'Select LR201 MONITOR' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select MM301 KEYBOARD' }));

    await user.click(screen.getByRole('combobox', { name: /new status/i }));
    await user.click(screen.getByRole('option', { name: 'Needs Replacement' }));

    await user.click(screen.getByRole('button', { name: /update 2 components/i }));

    await waitFor(() => {
      expect(batchUpdateComponents).toHaveBeenCalledTimes(1);
    });

    const formData = vi.mocked(batchUpdateComponents).mock.calls[0][0] as FormData;
    expect(formData.getAll('componentIds')).toEqual(['comp-1', 'comp-2']);
    expect(formData.get('status')).toBe('NEEDS_REPLACEMENT');
    expect(formData.get('specifications')).toBeNull();

    await waitFor(() => {
      expect(screen.getAllByText('NEEDS REPLACEMENT')).toHaveLength(2);
    });
    expect(screen.getByText('3 components shown · 0 selected')).toBeInTheDocument();
  });

  it('updates specifications without changing status', async () => {
    const user = userEvent.setup();
    render(<BatchUpdateClient initialComponents={components} componentTypes={componentTypes} />);

    await user.click(screen.getByRole('checkbox', { name: 'Select LR201 MONITOR' }));
    await user.type(screen.getByLabelText(/specifications \(optional\)/i), '24" IPS monitor');
    await user.click(screen.getByRole('button', { name: /update 1 component/i }));

    await waitFor(() => {
      expect(batchUpdateComponents).toHaveBeenCalledTimes(1);
    });

    const formData = vi.mocked(batchUpdateComponents).mock.calls[0][0] as FormData;
    expect(formData.get('status')).toBeNull();
    expect(formData.get('specifications')).toBe('24" IPS monitor');
    expect(screen.getByText('24" IPS monitor')).toBeInTheDocument();
  });

  it('shows the server error and keeps the selection when the update fails', async () => {
    vi.mocked(batchUpdateComponents).mockResolvedValue({
      success: false,
      error: 'Some selected components no longer exist. Refresh and try again.',
    });

    const user = userEvent.setup();
    render(<BatchUpdateClient initialComponents={components} componentTypes={componentTypes} />);

    await user.click(screen.getByRole('checkbox', { name: 'Select LR201 MONITOR' }));
    await user.click(screen.getByRole('combobox', { name: /new status/i }));
    await user.click(screen.getByRole('option', { name: 'Functional' }));
    await user.click(screen.getByRole('button', { name: /update 1 component/i }));

    await waitFor(() => {
      expect(screen.getByText('Some selected components no longer exist. Refresh and try again.')).toBeInTheDocument();
    });
    expect(screen.getByRole('checkbox', { name: 'Select LR201 MONITOR' })).toBeChecked();
  });
});
