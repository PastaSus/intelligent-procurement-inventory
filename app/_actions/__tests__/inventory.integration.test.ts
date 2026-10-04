import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/app/_actions/inventory';
import { createInventoryItem as factoryItem, resetCounter } from '@/app/__tests__/factories';

vi.mock('@/lib/prisma');
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn().mockResolvedValue({ userId: 'admin-001', email: 'admin@example.com', role: 'ADMIN' }),
  setMockRole: vi.fn(),
  resetMockRole: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

async function defaultSession() {
  const { getSession } = await import('@/lib/auth');
  vi.mocked(getSession).mockResolvedValue({ userId: 'admin-001', email: 'admin@example.com', role: 'ADMIN' });
}

async function noSession() {
  const { getSession } = await import('@/lib/auth');
  vi.mocked(getSession).mockResolvedValue(null);
}

async function techSession() {
  const { getSession } = await import('@/lib/auth');
  vi.mocked(getSession).mockResolvedValue({ userId: 'tech-001', email: 'tech@example.com', role: 'TECHNICIAN' });
}

describe('createInventoryItem', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('sku', 'SKU-001');
    fd.set('name', 'Test Item');
    fd.set('quantity', '10');
    fd.set('reorderPoint', '5');
    const result = await createInventoryItem(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns validation error for negative quantity', async () => {
    const fd = new FormData();
    fd.set('sku', 'SKU-001');
    fd.set('name', 'Test Item');
    fd.set('quantity', '-1');
    fd.set('reorderPoint', '5');
    const result = await createInventoryItem(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('negative');
  });

  it('returns error for duplicate SKU', async () => {
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(factoryItem({ sku: 'SKU-001' }));

    const fd = new FormData();
    fd.set('sku', 'SKU-001');
    fd.set('name', 'Test Item');
    fd.set('quantity', '10');
    fd.set('reorderPoint', '5');
    const result = await createInventoryItem(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('creates inventory item successfully', async () => {
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(null);
    const newItem = factoryItem({ sku: 'SKU-001', name: 'Test Item', quantity: 10, reorder_point: 5 });
    vi.mocked(prisma.inventoryItem.create).mockResolvedValue(newItem);

    const fd = new FormData();
    fd.set('sku', 'SKU-001');
    fd.set('name', 'Test Item');
    fd.set('quantity', '10');
    fd.set('reorderPoint', '5');
    const result = await createInventoryItem(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(newItem);
  });

  it('creates inventory item with component type', async () => {
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(null);
    const newItem = factoryItem({ sku: 'SKU-002', name: 'Spare Keyboard', component_type: 'KEYBOARD' });
    vi.mocked(prisma.inventoryItem.create).mockResolvedValue(newItem);

    const fd = new FormData();
    fd.set('sku', 'SKU-002');
    fd.set('name', 'Spare Keyboard');
    fd.set('quantity', '20');
    fd.set('reorderPoint', '5');
    fd.set('componentType', 'KEYBOARD');
    const result = await createInventoryItem(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(newItem);
  });

  it('denies TECHNICIAN create with zero DB change', async () => {
    await techSession();
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('sku', 'SKU-TECH');
    fd.set('name', 'Tech Item');
    fd.set('quantity', '10');
    fd.set('reorderPoint', '5');
    const result = await createInventoryItem(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('administrators');
    expect(prisma.inventoryItem.create).not.toHaveBeenCalled();

    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(null);
    const recheck = await prisma.inventoryItem.findUnique({ where: { sku: 'SKU-TECH' } });
    expect(recheck).toBeNull();
  });
});

describe('updateInventoryItem', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('id', 'inv-1');
    const result = await updateInventoryItem(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when item not found', async () => {
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('id', 'inv-1');
    fd.set('name', 'Updated');
    const result = await updateInventoryItem(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('updates inventory item successfully', async () => {
    const existing = factoryItem({ id: 'inv-1', name: 'Original', quantity: 10 });
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(existing);
    const updated = { ...existing, name: 'Updated', quantity: 20 };
    vi.mocked(prisma.inventoryItem.update).mockResolvedValue(updated);

    const fd = new FormData();
    fd.set('id', 'inv-1');
    fd.set('name', 'Updated');
    fd.set('quantity', '20');
    const result = await updateInventoryItem(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(updated);
  });

  it('clears component_type when empty string sent', async () => {
    const existing = factoryItem({ id: 'inv-1', name: 'Item', component_type: 'KEYBOARD' });
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(existing);
    const updated = { ...existing, component_type: null };
    vi.mocked(prisma.inventoryItem.update).mockResolvedValue(updated);

    const fd = new FormData();
    fd.set('id', 'inv-1');
    fd.set('name', 'Item');
    fd.set('componentType', '');
    const result = await updateInventoryItem(fd);

    expect(result.success).toBe(true);
  });

  it('denies TECHNICIAN update with zero DB change', async () => {
    await techSession();
    const original = factoryItem({ id: 'inv-1', name: 'Original', quantity: 10 });
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(original);

    const fd = new FormData();
    fd.set('id', 'inv-1');
    fd.set('name', 'Hacked');
    fd.set('quantity', '999');
    const result = await updateInventoryItem(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('administrators');
    expect(prisma.inventoryItem.update).not.toHaveBeenCalled();

    const recheck = await prisma.inventoryItem.findUnique({ where: { id: 'inv-1' } });
    expect(recheck?.name).toBe('Original');
    expect(recheck?.quantity).toBe(10);
  });
});

describe('deleteInventoryItem', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('id', 'inv-1');
    const result = await deleteInventoryItem(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when item not found', async () => {
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('id', 'inv-1');
    const result = await deleteInventoryItem(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error when item already deleted', async () => {
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(factoryItem({ id: 'inv-1', deleted: true }));

    const fd = new FormData();
    fd.set('id', 'inv-1');
    const result = await deleteInventoryItem(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already been deleted');
  });

  it('soft deletes inventory item successfully', async () => {
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(factoryItem({ id: 'inv-1', deleted: false }));

    const fd = new FormData();
    fd.set('id', 'inv-1');
    const result = await deleteInventoryItem(fd);

    expect(result.success).toBe(true);
    expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1' },
        data: expect.objectContaining({ deleted: true }),
      })
    );
  });

  it('denies TECHNICIAN delete with zero DB change', async () => {
    await techSession();
    const original = factoryItem({ id: 'inv-1', deleted: false });
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(original);

    const fd = new FormData();
    fd.set('id', 'inv-1');
    const result = await deleteInventoryItem(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('administrators');
    expect(prisma.inventoryItem.update).not.toHaveBeenCalled();

    const recheck = await prisma.inventoryItem.findUnique({ where: { id: 'inv-1' } });
    expect(recheck?.deleted).toBe(false);
  });
});
