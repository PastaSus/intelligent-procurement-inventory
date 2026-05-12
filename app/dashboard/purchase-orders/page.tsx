import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { PurchaseOrdersClient } from './PurchaseOrdersClient';

export default async function PurchaseOrdersPage() {
  const session = await getSession();

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: { deleted: false },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      po_number: true,
      status: true,
      created_at: true,
      updated_at: true,
      created_by: true,
      vendor: {
        select: { id: true, name: true, contact_name: true },
      },
      line_items: {
        select: { item_name: true, quantity: true, unit_price: true, total: true },
      },
    },
  });

  return <PurchaseOrdersClient initialPurchaseOrders={purchaseOrders} userRole={session?.role} />;
}
