import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createComputerUnit, updateComputerUnit, deleteComputerUnit, getRoomsForSelect } from '@/app/_actions/units';
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

  it('deletes unit and returns component count', async () => {
    const existing = createUnit({ id: 'unit-1', _count: { components: 3 } } as any);
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(existing);

    const fd = new FormData();
    fd.set('id', 'unit-1');
    const result = await deleteComputerUnit(fd);

    expect(result.success).toBe(true);
    expect(result.componentCount).toBe(3);
    expect(prisma.computerUnit.delete).toHaveBeenCalledWith({ where: { id: 'unit-1' } });
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
