import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalInventory, lowStockResult, pendingPOs, recentPOs] = await Promise.all([
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
      prisma.purchaseOrder.findMany({
        where: { deleted: false },
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          vendor: { select: { name: true } },
        },
      }),
    ]);

    const lowStockCount = Number(lowStockResult[0].count);

    return NextResponse.json({
      totalInventory,
      lowStockCount,
      pendingPOs,
      recentPOs: recentPOs.map((po) => ({
        id: po.id,
        poNumber: po.po_number,
        vendor: po.vendor?.name,
        status: po.status,
        createdAt: po.created_at,
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}