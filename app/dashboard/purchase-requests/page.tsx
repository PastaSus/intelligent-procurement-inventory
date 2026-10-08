import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { PurchaseRequestsClient } from './PurchaseRequestsClient';
import { redirect } from 'next/navigation';

export default async function PurchaseRequestsPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect('/login');
  }

  const requests = await prisma.purchaseRequest.findMany({
    where: { deleted: false },
    orderBy: { created_at: 'desc' },
    include: {
      items: { orderBy: { created_at: 'asc' } },
    },
  });

  const serialized = requests.map((r) => ({
    ...r,
    items: r.items.map((i) => ({
      ...i,
      unit_price: i.unit_price ? i.unit_price.toString() : null,
      total: i.total ? i.total.toString() : null,
    })),
  }));

  const stockParts = await prisma.inventoryItem.findMany({
    where: { deleted: false },
    orderBy: { name: 'asc' },
    select: { id: true, sku: true, name: true, quantity: true },
  });

  return (
    <PurchaseRequestsClient
      initialRequests={serialized}
      isAdmin={session.role === 'ADMIN'}
      stockParts={stockParts}
    />
  );
}
