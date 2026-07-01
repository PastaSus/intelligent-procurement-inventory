import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalRooms,
      totalUnits,
      totalComponents,
      needsRepair,
      needsReplacement,
      lowStockResult,
      pendingRequests,
    ] = await Promise.all([
      prisma.laboratoryRoom.count({ where: { deleted: false } }),
      prisma.computerUnit.count({ where: { deleted: false } }),
      prisma.computerComponent.count(),
      prisma.computerComponent.count({ where: { status: 'NEEDS_REPAIR' } }),
      prisma.computerComponent.count({ where: { status: 'NEEDS_REPLACEMENT' } }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "InventoryItem"
        WHERE deleted = false AND quantity < "reorder_point"
      `,
      prisma.purchaseRequest.count({
        where: { deleted: false, status: { in: ['DRAFT', 'REQUESTED'] } },
      }),
    ]);

    return NextResponse.json({
      totalRooms,
      totalUnits,
      totalComponents,
      needsRepair,
      needsReplacement,
      lowStockCount: Number(lowStockResult[0].count),
      pendingRequests,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
