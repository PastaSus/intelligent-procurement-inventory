import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getSparePartsReport } from '@/app/_actions/reports';

vi.mock('@/lib/prisma');
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn().mockResolvedValue({ userId: 'admin-001', email: 'admin@example.com', role: 'ADMIN' }),
  setMockRole: vi.fn(),
  resetMockRole: vi.fn(),
}));

async function defaultSession() {
  const { getSession } = await import('@/lib/auth');
  vi.mocked(getSession).mockResolvedValue({ userId: 'admin-001', email: 'admin@example.com', role: 'ADMIN' });
}

async function noSession() {
  const { getSession } = await import('@/lib/auth');
  vi.mocked(getSession).mockResolvedValue(null);
}

function mockGroupBy(
  replacement: { type: string; count: number }[],
  spare: { type: string; quantity: number }[],
) {
  vi.mocked(prisma.computerComponent.groupBy).mockResolvedValue(
    replacement.map(({ type, count }) => ({ type, _count: count })) as never,
  );
  vi.mocked(prisma.inventoryItem.groupBy).mockResolvedValue(
    spare.map(({ type, quantity }) => ({ component_type: type, _sum: { quantity } })) as never,
  );
}

const roomOptions = [
  { id: 'room-1', name: 'Laboratory 101' },
  { id: 'room-2', name: 'Laboratory 102' },
];

describe('getSparePartsReport', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    await defaultSession();
    vi.mocked(prisma.laboratoryRoom.findMany).mockResolvedValue(roomOptions as never);
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const result = await getSparePartsReport();

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
    expect(prisma.computerComponent.groupBy).not.toHaveBeenCalled();
  });

  it('aggregates replacement and spare quantities across types by default', async () => {
    mockGroupBy(
      [
        { type: 'KEYBOARD', count: 7 },
        { type: 'MONITOR', count: 5 },
      ],
      [
        { type: 'KEYBOARD', quantity: 5 },
        { type: 'MONITOR', quantity: 2 },
      ],
    );

    const result = await getSparePartsReport();

    expect(result.success).toBe(true);
    if (!result.success || !result.data) {
      throw new Error('Expected a successful report');
    }

    expect(result.data.rows).toHaveLength(9);
    expect(result.data.rows.find((row) => row.type === 'KEYBOARD')).toMatchObject({
      forReplacement: 7,
      spareQty: 5,
      netShortage: 2,
    });
    expect(result.data.rows.find((row) => row.type === 'MONITOR')).toMatchObject({
      forReplacement: 5,
      spareQty: 2,
      netShortage: 3,
    });
    expect(result.data.rows.find((row) => row.type === 'MOUSE')).toMatchObject({
      forReplacement: 0,
      spareQty: 0,
      netShortage: 0,
    });
    expect(result.data.requestRows.map((row) => row.type)).toEqual(['MONITOR', 'KEYBOARD']);
    expect(result.data.totals).toEqual({ forReplacement: 12, spareQty: 7, netShortage: 5 });
    expect(result.data.roomOptions).toEqual(roomOptions);
  });

  it('returns an error for an invalid component type', async () => {
    const result = await getSparePartsReport({ componentType: 'INVALID_TYPE' });

    expect(result).toEqual({ success: false, error: 'Invalid component type filter' });
    expect(prisma.computerComponent.groupBy).not.toHaveBeenCalled();
  });

  it('filters replacement counts by room while spare quantities remain global', async () => {
    mockGroupBy([{ type: 'KEYBOARD', count: 4 }], [{ type: 'KEYBOARD', quantity: 9 }]);

    const result = await getSparePartsReport({ roomId: 'room-1' });

    expect(result.success).toBe(true);
    if (!result.success || !result.data) {
      throw new Error('Expected a successful report');
    }

    expect(result.data.rows.find((row) => row.type === 'KEYBOARD')).toMatchObject({
      forReplacement: 4,
      spareQty: 9,
      netShortage: 0,
    });
    expect(result.data.totals.spareQty).toBe(9);
    expect(prisma.computerComponent.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          computer_unit: {
            deleted: false,
            laboratory_room: { deleted: false, id: 'room-1' },
          },
        }),
      }),
    );
    expect(prisma.inventoryItem.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deleted: false, component_type: { not: null } },
      }),
    );
  });

  it('returns an error for an unknown room', async () => {
    mockGroupBy([], []);

    const result = await getSparePartsReport({ roomId: 'missing-room' });

    expect(result).toEqual({ success: false, error: 'Invalid room filter' });
  });

  it('filters both group queries by component type', async () => {
    mockGroupBy([{ type: 'MONITOR', count: 5 }], [{ type: 'MONITOR', quantity: 2 }]);

    const result = await getSparePartsReport({ componentType: 'MONITOR' });

    expect(result.success).toBe(true);
    if (!result.success || !result.data) {
      throw new Error('Expected a successful report');
    }

    expect(result.data.rows).toHaveLength(1);
    expect(result.data.rows[0]).toMatchObject({
      type: 'MONITOR',
      forReplacement: 5,
      spareQty: 2,
      netShortage: 3,
    });
    expect(prisma.computerComponent.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'MONITOR' }),
      }),
    );
    expect(prisma.inventoryItem.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ component_type: 'MONITOR' }),
      }),
    );
  });

  it('excludes covered rows and recomputes totals when shortagesOnly is set', async () => {
    mockGroupBy(
      [
        { type: 'KEYBOARD', count: 7 },
        { type: 'MONITOR', count: 5 },
        { type: 'MOUSE', count: 2 },
      ],
      [
        { type: 'KEYBOARD', quantity: 5 },
        { type: 'MONITOR', quantity: 2 },
        { type: 'MOUSE', quantity: 5 },
      ],
    );

    const result = await getSparePartsReport({ shortagesOnly: true });

    expect(result.success).toBe(true);
    if (!result.success || !result.data) {
      throw new Error('Expected a successful report');
    }

    expect(result.data.rows.map((row) => row.type)).toEqual(['KEYBOARD', 'MONITOR']);
    expect(result.data.requestRows).toHaveLength(2);
    expect(result.data.totals).toEqual({ forReplacement: 12, spareQty: 7, netShortage: 5 });
  });

  it('combines room, component type, and shortages-only filters', async () => {
    mockGroupBy([{ type: 'MONITOR', count: 5 }], [{ type: 'MONITOR', quantity: 2 }]);

    const result = await getSparePartsReport({
      roomId: 'room-1',
      componentType: 'MONITOR',
      shortagesOnly: true,
    });

    expect(result.success).toBe(true);
    if (!result.success || !result.data) {
      throw new Error('Expected a successful report');
    }

    expect(result.data.rows).toHaveLength(1);
    expect(result.data.rows[0]).toMatchObject({
      type: 'MONITOR',
      forReplacement: 5,
      spareQty: 2,
      netShortage: 3,
    });
    expect(prisma.computerComponent.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: 'MONITOR',
          computer_unit: expect.objectContaining({
            laboratory_room: expect.objectContaining({ id: 'room-1' }),
          }),
        }),
      }),
    );
  });
});
