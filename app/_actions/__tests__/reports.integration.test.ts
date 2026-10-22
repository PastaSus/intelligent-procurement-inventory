import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getHardwareReport } from '@/app/_actions/reports';

vi.mock('@/lib/prisma');
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn().mockResolvedValue({ userId: 'admin-001', email: 'admin@example.com', role: 'ADMIN' }),
}));

type RoomQueryResult = Awaited<ReturnType<typeof prisma.laboratoryRoom.findMany>>;
type UnitQueryResult = Awaited<ReturnType<typeof prisma.computerUnit.findMany>>;

const roomReport = {
  id: 'room-1',
  name: 'LR2',
  units: [
    {
      id: 'unit-1',
      unit_name: 'LR201',
      components: [
        {
          id: 'comp-1',
          type: 'MOUSE',
          serial_number: 'SN-001',
          specifications: 'Optical',
          status: 'NEEDS_REPAIR',
        },
      ],
    },
  ],
};

const roomOptions = [{ id: 'room-1', name: 'LR2' }];
const unitOptions = [
  { id: 'unit-1', unit_name: 'LR201', laboratory_room: { id: 'room-1', name: 'LR2' } },
];

describe('getHardwareReport', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getSession } = await import('@/lib/auth');
    vi.mocked(getSession).mockResolvedValue({ userId: 'admin-001', email: 'admin@example.com', role: 'ADMIN' });
  });

  it('requires an authenticated session', async () => {
    const { getSession } = await import('@/lib/auth');
    vi.mocked(getSession).mockResolvedValue(null);

    const result = await getHardwareReport();

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('filters rooms and units and returns unit options', async () => {
    vi.mocked(prisma.laboratoryRoom.findMany)
      .mockResolvedValueOnce([roomReport] as unknown as RoomQueryResult)
      .mockResolvedValueOnce(roomOptions as unknown as RoomQueryResult);
    vi.mocked(prisma.computerUnit.findMany).mockResolvedValue(unitOptions as unknown as UnitQueryResult);

    const result = await getHardwareReport({ roomId: 'room-1', unitId: 'unit-1' });

    expect(result.success).toBe(true);
    expect(result.data?.rooms).toEqual([roomReport]);
    expect(result.data?.roomOptions).toEqual(roomOptions);
    expect(result.data?.unitOptions).toEqual(unitOptions);

    const roomQuery = vi.mocked(prisma.laboratoryRoom.findMany).mock.calls[0][0];
    expect(roomQuery).toMatchObject({
      where: { deleted: false, id: 'room-1' },
      select: {
        units: {
          where: { deleted: false, id: 'unit-1' },
        },
      },
    });
    expect(prisma.computerUnit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deleted: false, laboratory_room_id: 'room-1' },
      })
    );
  });

  it('passes status and component type filters to the component query', async () => {
    vi.mocked(prisma.laboratoryRoom.findMany)
      .mockResolvedValueOnce([roomReport] as unknown as RoomQueryResult)
      .mockResolvedValueOnce(roomOptions as unknown as RoomQueryResult);
    vi.mocked(prisma.computerUnit.findMany).mockResolvedValue(unitOptions as unknown as UnitQueryResult);

    await getHardwareReport({ status: 'NEEDS_REPAIR', componentType: 'MOUSE' });

    const roomQuery = vi.mocked(prisma.laboratoryRoom.findMany).mock.calls[0][0];
    expect(roomQuery).toMatchObject({
      select: {
        units: {
          select: {
            components: {
              where: { status: 'NEEDS_REPAIR', type: 'MOUSE' },
            },
          },
        },
      },
    });
  });

  it('rejects invalid status and type filters', async () => {
    const badStatus = await getHardwareReport({ status: 'BROKEN' });
    const badType = await getHardwareReport({ componentType: 'PRINTER' });

    expect(badStatus.success).toBe(false);
    expect(badStatus.error).toContain('Invalid status');
    expect(badType.success).toBe(false);
    expect(badType.error).toContain('Invalid component type');
  });
});
