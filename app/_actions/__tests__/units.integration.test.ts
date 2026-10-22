import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createComputerUnit, createComputerUnitsBatch, updateComputerUnit, deleteComputerUnit, deleteComputerUnitsBatch, getRoomsForSelect } from '@/app/_actions/units';
import { createRoom, createUnit, resetCounter } from '@/app/__tests__/factories';

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

describe('createComputerUnit', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('unitName', 'U-001');
    fd.set('laboratoryRoomId', 'room-1');
    const result = await createComputerUnit(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns validation error when unit name is empty', async () => {
    const fd = new FormData();
    fd.set('unitName', '');
    fd.set('laboratoryRoomId', 'room-1');
    const result = await createComputerUnit(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });

  it('returns error when room not found', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('unitName', 'U-001');
    fd.set('laboratoryRoomId', 'room-1');
    const result = await createComputerUnit(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error for duplicate unit name in same room', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(createRoom({ id: 'room-1' }));
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(createUnit({ unit_name: 'U-001', laboratory_room_id: 'room-1' }));

    const fd = new FormData();
    fd.set('unitName', 'U-001');
    fd.set('laboratoryRoomId', 'room-1');
    const result = await createComputerUnit(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('creates unit successfully', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(createRoom({ id: 'room-1' }));
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(null);
    const newUnit = createUnit({ unit_name: 'U-001', laboratory_room_id: 'room-1' });
    vi.mocked(prisma.computerUnit.create).mockResolvedValue(newUnit);

    const fd = new FormData();
    fd.set('unitName', 'U-001');
    fd.set('laboratoryRoomId', 'room-1');
    const result = await createComputerUnit(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(newUnit);
  });
});

describe('updateComputerUnit', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('id', 'unit-1');
    const result = await updateComputerUnit(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when unit not found', async () => {
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('id', 'unit-1');
    fd.set('unitName', 'Updated');
    const result = await updateComputerUnit(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('updates unit name successfully', async () => {
    const existing = createUnit({ id: 'unit-1', unit_name: 'Original' });
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(existing);
    vi.mocked(prisma.computerUnit.findFirst).mockResolvedValue(null);
    const updated = { ...existing, unit_name: 'Updated' };
    vi.mocked(prisma.computerUnit.update).mockResolvedValue(updated);

    const fd = new FormData();
    fd.set('id', 'unit-1');
    fd.set('unitName', 'Updated');
    const result = await updateComputerUnit(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(updated);
  });

  it('returns error when target room not found', async () => {
    const existing = createUnit({ id: 'unit-1', unit_name: 'U-001', laboratory_room_id: 'room-1' });
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(existing);
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('id', 'unit-1');
    fd.set('laboratoryRoomId', 'room-999');
    const result = await updateComputerUnit(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});

describe('deleteComputerUnit', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('id', 'unit-1');
    const result = await deleteComputerUnit(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when unit not found', async () => {
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('id', 'unit-1');
    const result = await deleteComputerUnit(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('denies TECHNICIAN delete with zero DB change', async () => {
    await techSession();

    const fd = new FormData();
    fd.set('id', 'unit-1');
    const result = await deleteComputerUnit(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('administrators');
    expect(prisma.computerUnit.delete).not.toHaveBeenCalled();
  });

  it('deletes unit and returns component count', async () => {
    const existing = { ...createUnit({ id: 'unit-1' }), _count: { components: 3 } };
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(existing);

    const fd = new FormData();
    fd.set('id', 'unit-1');
    const result = await deleteComputerUnit(fd);

    expect(result.success).toBe(true);
    expect(result.componentCount).toBe(3);
    expect(prisma.computerUnit.delete).toHaveBeenCalledWith({ where: { id: 'unit-1' } });
  });
});

describe('deleteComputerUnitsBatch', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  function makeBatchFormData(ids: string[]) {
    const fd = new FormData();
    ids.forEach((id) => fd.append('ids', id));
    return fd;
  }

  it('returns error when not authenticated', async () => {
    await noSession();

    const result = await deleteComputerUnitsBatch(makeBatchFormData(['unit-1', 'unit-2']));

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
    expect(prisma.computerUnit.deleteMany).not.toHaveBeenCalled();
  });

  it('denies TECHNICIAN batch delete with zero DB change', async () => {
    await techSession();

    const result = await deleteComputerUnitsBatch(makeBatchFormData(['unit-1', 'unit-2']));

    expect(result.success).toBe(false);
    expect(result.error).toContain('administrators');
    expect(prisma.computerUnit.deleteMany).not.toHaveBeenCalled();
  });

  it('rejects an empty selection', async () => {
    const result = await deleteComputerUnitsBatch(makeBatchFormData([]));

    expect(result.success).toBe(false);
    expect(result.error).toContain('at least one unit');
  });

  it('rejects more than 200 units', async () => {
    const result = await deleteComputerUnitsBatch(
      makeBatchFormData(Array.from({ length: 201 }, (_, index) => `unit-${index}`))
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('at most 200');
  });

  it('deletes matching units and returns unit and component counts', async () => {
    vi.mocked(prisma.computerUnit.findMany).mockResolvedValue([
      { ...createUnit({ id: 'unit-1' }), _count: { components: 3 } },
      { ...createUnit({ id: 'unit-2' }), _count: { components: 2 } },
    ] as never);
    vi.mocked(prisma.computerUnit.deleteMany).mockResolvedValue({ count: 2 });

    const result = await deleteComputerUnitsBatch(makeBatchFormData(['unit-1', 'unit-2', 'unit-1']));

    expect(result).toEqual({ success: true, count: 2, componentCount: 5 });
    expect(prisma.computerUnit.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['unit-1', 'unit-2'] }, deleted: false },
      include: { _count: { select: { components: true } } },
    });
    expect(prisma.computerUnit.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['unit-1', 'unit-2'] } },
    });
  });

  it('returns an error when no matching units exist', async () => {
    vi.mocked(prisma.computerUnit.findMany).mockResolvedValue([]);

    const result = await deleteComputerUnitsBatch(makeBatchFormData(['unit-404']));

    expect(result.success).toBe(false);
    expect(result.error).toContain('No matching');
    expect(prisma.computerUnit.deleteMany).not.toHaveBeenCalled();
  });
});

describe('getRoomsForSelect', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
  });

  it('returns rooms sorted by name', async () => {
    const rooms = [
      createRoom({ id: 'room-2', name: 'Lab B' }),
      createRoom({ id: 'room-1', name: 'Lab A' }),
    ];
    vi.mocked(prisma.laboratoryRoom.findMany).mockResolvedValue(rooms);

    const result = await getRoomsForSelect();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(rooms);
    expect(prisma.laboratoryRoom.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deleted: false }, orderBy: { name: 'asc' } })
    );
  });

  it('returns error on exception', async () => {
    vi.mocked(prisma.laboratoryRoom.findMany).mockRejectedValue(new Error('DB error'));

    const result = await getRoomsForSelect();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to fetch rooms');
  });
});

describe('createComputerUnitsBatch', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  function makeFormData(overrides: Record<string, string> = {}) {
    const fd = new FormData();
    fd.set('prefix', 'MM3');
    fd.set('startNumber', '26');
    fd.set('count', '3');
    fd.set('laboratoryRoomId', 'room-1');
    for (const [key, value] of Object.entries(overrides)) {
      fd.set(key, value);
    }
    return fd;
  }

  it('returns error when not authenticated', async () => {
    await noSession();

    const result = await createComputerUnitsBatch(makeFormData());

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('rejects an empty prefix', async () => {
    const result = await createComputerUnitsBatch(makeFormData({ prefix: '   ' }));

    expect(result.success).toBe(false);
    expect(result.error).toContain('Prefix is required');
  });

  it('rejects a count above the batch limit', async () => {
    const result = await createComputerUnitsBatch(makeFormData({ count: '101' }));

    expect(result.success).toBe(false);
    expect(result.error).toContain('at most 100');
  });

  it('returns error when the room is not found', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(null);

    const result = await createComputerUnitsBatch(makeFormData());

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns an error listing units that already exist in the room', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(createRoom({ id: 'room-1', name: 'MM3' }));
    vi.mocked(prisma.computerUnit.findMany).mockResolvedValue([
      createUnit({ unit_name: 'MM327', laboratory_room_id: 'room-1' }),
    ]);

    const result = await createComputerUnitsBatch(makeFormData());

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exist in MM3');
    expect(result.error).toContain('MM327');
  });

  it('creates generated units in a single batch with an uppercase prefix', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(createRoom({ id: 'room-1', name: 'MM3' }));
    vi.mocked(prisma.computerUnit.findMany).mockResolvedValue([]);
    vi.mocked(prisma.computerUnit.createMany).mockResolvedValue({ count: 3 });

    const result = await createComputerUnitsBatch(makeFormData());

    expect(result).toEqual({
      success: true,
      data: { count: 3, first: 'MM326', last: 'MM328' },
    });
    expect(prisma.computerUnit.createMany).toHaveBeenCalledWith({
      data: [
        { unit_name: 'MM326', laboratory_room_id: 'room-1', created_by: 'admin-001', updated_by: 'admin-001' },
        { unit_name: 'MM327', laboratory_room_id: 'room-1', created_by: 'admin-001', updated_by: 'admin-001' },
        { unit_name: 'MM328', laboratory_room_id: 'room-1', created_by: 'admin-001', updated_by: 'admin-001' },
      ],
    });
  });
});
