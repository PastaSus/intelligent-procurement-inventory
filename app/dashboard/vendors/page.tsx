import { prisma } from '@/lib/prisma';
import { VendorsClient } from './VendorsClient';

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({
    where: { deleted: false },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      name: true,
      contact_name: true,
      email: true,
      phone: true,
      address: true,
      created_at: true,
      updated_at: true,
    },
  });

  return <VendorsClient initialVendors={vendors} />;
}