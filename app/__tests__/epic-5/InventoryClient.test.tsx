import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryClient } from '@/app/dashboard/inventory/InventoryClient';

vi.mock('@/lib/toast-context');
vi.mock('@/app/_actions/inventory', () => ({
  deleteInventoryItem: vi.fn(),
}));

const componentTypes = ['KEYBOARD', 'MOUSE', 'MONITOR'] as const;

function makeItem(overrides: Record<string, any> = {}) {
  return {
    id: `inv-${Math.random().toString(36).slice(2, 6)}`,
    sku: 'SKU-001',
    name: 'Test Part',
    description: null,
    quantity: 10,
    reorder_point: 5,
    component_type: 'KEYBOARD',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('InventoryClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page header and Add Part button', () => {
    render(<InventoryClient initialItems={[]} totalCount={0} componentTypes={componentTypes} currentPage={1} pageSize={10} isAdmin={true} />);

    expect(screen.getByText('Spare Parts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add part/i })).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(<InventoryClient initialItems={[]} totalCount={0} componentTypes={componentTypes} currentPage={1} pageSize={10} isAdmin={true} />);

    expect(screen.getByText(/no spare parts found/i)).toBeInTheDocument();
  });

  it('renders inventory items', () => {
    const items = [
      makeItem({ sku: 'SKU-001', name: 'Keyboard', quantity: 10, reorder_point: 5 }),
      makeItem({ sku: 'SKU-002', name: 'Mouse', quantity: 0, reorder_point: 5 }),
    ];
    render(<InventoryClient initialItems={items} totalCount={2} componentTypes={componentTypes} currentPage={1} pageSize={10} isAdmin={true} />);

    expect(screen.getByText('SKU-001')).toBeInTheDocument();
    expect(screen.getByText('SKU-002')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('shows stock status badges', () => {
    const items = [
      makeItem({ name: 'OK Item', quantity: 10, reorder_point: 5 }),
      makeItem({ name: 'Low Item', quantity: 3, reorder_point: 5 }),
      makeItem({ name: 'Critical Item', quantity: 0, reorder_point: 5 }),
    ];
    render(<InventoryClient initialItems={items} totalCount={3} componentTypes={componentTypes} currentPage={1} pageSize={10} isAdmin={true} />);

    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('filters by component type', async () => {
    const user = userEvent.setup();
    const items = [
      makeItem({ name: 'Keyboard', component_type: 'KEYBOARD' }),
      makeItem({ name: 'Mouse', component_type: 'MOUSE' }),
    ];
    render(<InventoryClient initialItems={items} totalCount={2} componentTypes={componentTypes} currentPage={1} pageSize={10} isAdmin={true} />);

    expect(screen.getByText(/showing 2/i)).toBeInTheDocument();

    const typeSelect = screen.getAllByRole('combobox')[0];
    await user.click(typeSelect);
    await user.click(screen.getByRole('option', { name: 'MOUSE' }));

    expect(screen.getByText(/showing 1/i)).toBeInTheDocument();
  });

  it('filters by stock status', async () => {
    const user = userEvent.setup();
    const items = [
      makeItem({ name: 'OK Item', quantity: 10, reorder_point: 5 }),
      makeItem({ name: 'Critical Item', quantity: 0, reorder_point: 5 }),
    ];
    render(<InventoryClient initialItems={items} totalCount={2} componentTypes={componentTypes} currentPage={1} pageSize={10} isAdmin={true} />);

    const statusSelect = screen.getAllByRole('combobox')[1];
    await user.click(statusSelect);
    await user.click(screen.getByRole('option', { name: /critical/i }));

    expect(screen.getByText(/showing 1/i)).toBeInTheDocument();
  });

  it('shows low stock and critical counts', () => {
    const items = [
      makeItem({ name: 'Low Item', quantity: 3, reorder_point: 5 }),
      makeItem({ name: 'Critical Item', quantity: 0, reorder_point: 5 }),
    ];
    render(<InventoryClient initialItems={items} totalCount={2} componentTypes={componentTypes} currentPage={1} pageSize={10} isAdmin={true} />);

    expect(screen.getByText(/1 low stock/i)).toBeInTheDocument();
    expect(screen.getByText(/1 critical/i)).toBeInTheDocument();
  });

  it('shows delete confirmation dialog', async () => {
    const user = userEvent.setup();
    const items = [makeItem({ name: 'Delete Me', sku: 'SKU-001' })];
    render(<InventoryClient initialItems={items} totalCount={1} componentTypes={componentTypes} currentPage={1} pageSize={10} isAdmin={true} />);

    await user.click(screen.getByTitle('Delete'));

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    const deleteTexts = screen.getAllByText('Delete Me');
    expect(deleteTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Add/Edit/Delete controls for admins', () => {
    const items = [makeItem({ name: 'Admin Part', sku: 'SKU-001' })];
    render(<InventoryClient initialItems={items} totalCount={1} componentTypes={componentTypes} currentPage={1} pageSize={10} isAdmin={true} />);

    expect(screen.getByRole('button', { name: /add part/i })).toBeInTheDocument();
    expect(screen.getByTitle('Edit')).toBeInTheDocument();
    expect(screen.getByTitle('Delete')).toBeInTheDocument();
  });

  it('hides Add/Edit/Delete controls for technicians', () => {
    const items = [makeItem({ name: 'Tech Part', sku: 'SKU-001' })];
    render(<InventoryClient initialItems={items} totalCount={1} componentTypes={componentTypes} currentPage={1} pageSize={10} isAdmin={false} />);

    expect(screen.queryByRole('button', { name: /add part/i })).not.toBeInTheDocument();
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
  });
});
