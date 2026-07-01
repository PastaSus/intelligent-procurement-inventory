'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function getDashboardStats() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false as const, error: 'Unauthorized' };
    }

    const [
      totalRooms,
      totalUnits,
      totalComponents,
      needsRepair,
      needsReplacement,
      lowStockCount,
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
        where: { deleted: false, status: 'REQUESTED' },
      }),
    ]);

    return {
      success: true as const,
      data: {
        totalRooms,
        totalUnits,
        totalComponents,
        needsRepair,
        needsReplacement,
        lowStockCount: Number(lowStockCount[0]?.count || 0),
        pendingRequests,
      },
    };
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return { success: false as const, error: 'Failed to fetch dashboard stats' };
  }
}
