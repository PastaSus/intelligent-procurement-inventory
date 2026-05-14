'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function getDashboardStats() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false as const, error: 'You must be logged in to view dashboard stats' };
    }

    const [totalInventory, lowStockResult, pendingPOs] = await Promise.all([
      prisma.inventoryItem.count({
        where: { deleted: false },
      }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "InventoryItem" 
        WHERE deleted = false AND quantity < "reorder_point"
      `,
      prisma.purchaseOrder.count({
        where: { deleted: false, status: { in: ['DRAFT', 'APPROVED'] } },
      }),
    ]);

    const lowStockCount = lowStockResult?.[0]?.count ? Number(lowStockResult[0].count) : 0;

    return {
      success: true as const,
      data: { totalInventory, lowStockCount, pendingPOs },
    };
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return { success: false as const, error: 'Failed to fetch dashboard stats' };
  }
}

export async function getLowStockItems() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false as const, error: 'Unauthorized' };
    }

    const items = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      sku: string;
      quantity: number;
      reorder_point: number;
      category: string | null;
    }>>`
      SELECT id, name, sku, quantity, reorder_point, category
      FROM "InventoryItem"
      WHERE deleted = false AND quantity < "reorder_point"
      ORDER BY quantity ASC
      LIMIT 10
    `;

    return { success: true as const, data: items };
  } catch (error) {
    console.error('getLowStockItems error:', error);
    return { success: false as const, error: 'Failed to fetch low stock items' };
  }
}