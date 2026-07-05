import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createLabRoom, updateLabRoom, deleteLabRoom } from '@/app/_actions/rooms';
import { createRoom } from '@/app/__tests__/factories';
import { resetCounter } from '@/app/__tests__/factories';

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

describe('createLabRoom', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('name', 'Lab 1');
    const result = await createLabRoom(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when room name is empty', async () => {
    const fd = new FormData();
    fd.set('name', '');
    const result = await createLabRoom(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });

  it('returns error when duplicate room name exists', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(createRoom({ name: 'Existing' }));

    const fd = new FormData();
    fd.set('name', 'Existing');
    const result = await createLabRoom(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('creates a room successfully', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(null);
    const newRoom = createRoom({ name: 'New Lab' });
    vi.mocked(prisma.laboratoryRoom.create).mockResolvedValue(newRoom);

    const fd = new FormData();
    fd.set('name', 'New Lab');
    const result = await createLabRoom(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(newRoom);
    expect(prisma.laboratoryRoom.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'New Lab' }),
      })
    );
  });
});

describe('updateLabRoom', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('id', 'room-1');
    fd.set('name', 'Updated');
    const result = await updateLabRoom(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when id is missing', async () => {
    const fd = new FormData();
    fd.set('name', 'Updated');
    const result = await updateLabRoom(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Room ID');
  });

  it('returns error when room not found', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('id', 'room-1');
    fd.set('name', 'Updated');
    const result = await updateLabRoom(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error when room is deleted', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(createRoom({ id: 'room-1', deleted: true }));

    const fd = new FormData();
    fd.set('id', 'room-1');
    fd.set('name', 'Updated');
    const result = await updateLabRoom(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error on duplicate name update', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(createRoom({ id: 'room-1', name: 'Original' }));
    vi.mocked(prisma.laboratoryRoom.findFirst).mockResolvedValue({ id: 'room-2', name: 'Duplicate' });

    const fd = new FormData();
    fd.set('id', 'room-1');
    fd.set('name', 'Duplicate');
    const result = await updateLabRoom(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('updates room name successfully', async () => {
    const existing = createRoom({ id: 'room-1', name: 'Original' });
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(existing);
    vi.mocked(prisma.laboratoryRoom.findFirst).mockResolvedValue(null);
    const updated = { ...existing, name: 'Updated' };
    vi.mocked(prisma.laboratoryRoom.update).mockResolvedValue(updated);

    const fd = new FormData();
    fd.set('id', 'room-1');
    fd.set('name', 'Updated');
    const result = await updateLabRoom(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(updated);
  });

  it('updates room without changing name', async () => {
    const existing = createRoom({ id: 'room-1', name: 'Original' });
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(existing);
    const updated = { ...existing, name: 'Original' };
    vi.mocked(prisma.laboratoryRoom.update).mockResolvedValue(updated);

    const fd = new FormData();
    fd.set('id', 'room-1');
    const result = await updateLabRoom(fd);

    expect(result.success).toBe(true);
  });
});

describe('deleteLabRoom', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('id', 'room-1');
    const result = await deleteLabRoom(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when id is missing', async () => {
    const fd = new FormData();
    const result = await deleteLabRoom(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Room ID');
  });

  it('returns error when room not found', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('id', 'room-1');
    const result = await deleteLabRoom(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error when room has units', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(
      createRoom({ id: 'room-1', _count: { units: 2 } } as any)
    );

    const fd = new FormData();
    fd.set('id', 'room-1');
    const result = await deleteLabRoom(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('units');
  });

  it('deletes room successfully', async () => {
    vi.mocked(prisma.laboratoryRoom.findUnique).mockResolvedValue(
      createRoom({ id: 'room-1', _count: { units: 0 } } as any)
    );

    const fd = new FormData();
    fd.set('id', 'room-1');
    const result = await deleteLabRoom(fd);

    expect(result.success).toBe(true);
    expect(prisma.laboratoryRoom.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'room-1' },
        data: expect.objectContaining({ deleted: true }),
      })
    );
  });
});
