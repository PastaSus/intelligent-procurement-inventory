import { prisma } from '@/lib/prisma';
import { InventoryClient } from './InventoryClient';
import { SearchParams } from './types';

const COMPONENT_TYPES = [
  'MOTHERBOARD', 'PROCESSOR', 'MEMORY', 'HDD',
  'MONITOR', 'KEYBOARD', 'MOUSE', 'AVR', 'OPTICAL_DRIVE',
] as const;

export default async function SparePartsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  const page = parseInt(params.page || '1', 10);
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const items = await prisma.inventoryItem.findMany({
    where: { deleted: false },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      sku: true,
      name: true,
      description: true,
      quantity: true,
      reorder_point: true,
      component_type: true,
      created_at: true,
      updated_at: true,
    },
    skip,
    take: pageSize,
  });

  const totalCount = await prisma.inventoryItem.count({
    where: { deleted: false },
  });

  return (
    <InventoryClient
      initialItems={items}
      totalCount={totalCount}
      componentTypes={COMPONENT_TYPES}
      currentPage={page}
      pageSize={pageSize}
    />
  );
}
