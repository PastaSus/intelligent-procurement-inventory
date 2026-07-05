import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createComponent, updateComponent, deleteComponent, bulkAddComponents } from '@/app/_actions/components';
import { createRoom, createUnit, createComponent as factoryComponent, createInventoryItem, resetCounter } from '@/app/__tests__/factories';

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

describe('createComponent', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('computerUnitId', 'unit-1');
    fd.set('type', 'KEYBOARD');
    fd.set('serialNumber', 'SN-001');
    fd.set('specifications', 'Standard keyboard');
    const result = await createComponent(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns validation error for invalid component type', async () => {
    const fd = new FormData();
    fd.set('computerUnitId', 'unit-1');
    fd.set('type', 'INVALID_TYPE');
    fd.set('serialNumber', 'SN-001');
    fd.set('specifications', 'Test');
    const result = await createComponent(fd);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns error when unit not found', async () => {
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('computerUnitId', 'unit-1');
    fd.set('type', 'KEYBOARD');
    fd.set('serialNumber', 'SN-001');
    fd.set('specifications', 'Standard keyboard');
    const result = await createComponent(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error for duplicate serial number', async () => {
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(createUnit({ id: 'unit-1' }));
    vi.mocked(prisma.computerComponent.findUnique).mockResolvedValue(factoryComponent({ serial_number: 'SN-001' }));

    const fd = new FormData();
    fd.set('computerUnitId', 'unit-1');
    fd.set('type', 'KEYBOARD');
    fd.set('serialNumber', 'SN-001');
    fd.set('specifications', 'Standard keyboard');
    const result = await createComponent(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('creates component successfully', async () => {
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(createUnit({ id: 'unit-1' }));
    vi.mocked(prisma.computerComponent.findUnique).mockResolvedValue(null);
    const newComp = factoryComponent({ computer_unit_id: 'unit-1', type: 'KEYBOARD', serial_number: 'SN-001', specifications: 'Standard keyboard' });
    vi.mocked(prisma.computerComponent.create).mockResolvedValue(newComp);

    const fd = new FormData();
    fd.set('computerUnitId', 'unit-1');
    fd.set('type', 'KEYBOARD');
    fd.set('serialNumber', 'SN-001');
    fd.set('specifications', 'Standard keyboard');
    const result = await createComponent(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(newComp);
  });
});

describe('updateComponent', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('id', 'comp-1');
    const result = await updateComponent(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when component not found', async () => {
    vi.mocked(prisma.computerComponent.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('id', 'comp-1');
    fd.set('type', 'MOUSE');
    const result = await updateComponent(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('updates component successfully', async () => {
    const existing = factoryComponent({ id: 'comp-1', type: 'KEYBOARD', status: 'FUNCTIONAL' });
    vi.mocked(prisma.computerComponent.findUnique).mockResolvedValue(existing);
    const updated = { ...existing, type: 'MOUSE' };
    vi.mocked(prisma.computerComponent.update).mockResolvedValue(updated);

    const fd = new FormData();
    fd.set('id', 'comp-1');
    fd.set('type', 'MOUSE');
    const result = await updateComponent(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(updated);
  });

  it('returns sparePartsAlert when status changes to NEEDS_REPLACEMENT', async () => {
    const existing = factoryComponent({ id: 'comp-1', type: 'KEYBOARD', status: 'FUNCTIONAL' });
    vi.mocked(prisma.computerComponent.findUnique).mockResolvedValue(existing);
    const updated = { ...existing, status: 'NEEDS_REPLACEMENT' };
    vi.mocked(prisma.computerComponent.update).mockResolvedValue(updated);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(
      createInventoryItem({ component_type: 'KEYBOARD', quantity: 5 })
    );

    const fd = new FormData();
    fd.set('id', 'comp-1');
    fd.set('status', 'NEEDS_REPLACEMENT');
    const result = await updateComponent(fd);

    expect(result.success).toBe(true);
    expect(result.sparePartsAlert).toBeDefined();
    expect(result.sparePartsAlert?.variant).toBe('in_stock');
  });

  it('returns out_of_stock sparePartsAlert when no inventory found', async () => {
    const existing = factoryComponent({ id: 'comp-1', type: 'KEYBOARD', status: 'FUNCTIONAL' });
    vi.mocked(prisma.computerComponent.findUnique).mockResolvedValue(existing);
    const updated = { ...existing, status: 'NEEDS_REPLACEMENT' };
    vi.mocked(prisma.computerComponent.update).mockResolvedValue(updated);
    vi.mocked(prisma.inventoryItem.findFirst).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('id', 'comp-1');
    fd.set('status', 'NEEDS_REPLACEMENT');
    const result = await updateComponent(fd);

    expect(result.success).toBe(true);
    expect(result.sparePartsAlert?.variant).toBe('out_of_stock');
  });
});

describe('deleteComponent', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('id', 'comp-1');
    const result = await deleteComponent(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when component not found', async () => {
    vi.mocked(prisma.computerComponent.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('id', 'comp-1');
    const result = await deleteComponent(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('deletes component successfully', async () => {
    const existing = factoryComponent({ id: 'comp-1', computer_unit_id: 'unit-1' });
    vi.mocked(prisma.computerComponent.findUnique).mockResolvedValue(existing);

    const fd = new FormData();
    fd.set('id', 'comp-1');
    const result = await deleteComponent(fd);

    expect(result.success).toBe(true);
    expect(prisma.computerComponent.delete).toHaveBeenCalledWith({ where: { id: 'comp-1' } });
  });
});

describe('bulkAddComponents', () => {
  const ALL_TYPES = ['MOTHERBOARD', 'PROCESSOR', 'MEMORY', 'HDD', 'MONITOR', 'KEYBOARD', 'MOUSE', 'AVR', 'OPTICAL_DRIVE'];

  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('computerUnitId', 'unit-1');
    const result = await bulkAddComponents(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when unit not found', async () => {
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('computerUnitId', 'unit-1');
    const result = await bulkAddComponents(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error when all types already exist', async () => {
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(createUnit({ id: 'unit-1' }));
    vi.mocked(prisma.computerComponent.findMany).mockResolvedValue(
      ALL_TYPES.map(t => factoryComponent({ type: t }))
    );

    const fd = new FormData();
    fd.set('computerUnitId', 'unit-1');
    const result = await bulkAddComponents(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exist');
  });

  it('creates missing component types', async () => {
    const unit = createUnit({ id: 'unit-1', unit_name: 'U-001' });
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(unit);
    vi.mocked(prisma.computerComponent.findMany).mockResolvedValue([]);
    const createdComponents = ALL_TYPES.map(t => factoryComponent({ computer_unit_id: 'unit-1', type: t, serial_number: `${unit.unit_name}-${t}-PENDING` }));
    vi.mocked(prisma.computerComponent.create).mockResolvedValue(createdComponents[0]);

    const fd = new FormData();
    fd.set('computerUnitId', 'unit-1');
    const result = await bulkAddComponents(fd);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    if (result.success) {
      expect(result.data.length).toBe(ALL_TYPES.length);
    }
  });
});
