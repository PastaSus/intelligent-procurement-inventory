import { prisma } from '@/lib/prisma';
import { InventoryClient } from './InventoryClient';
import { SearchParams } from './types';

export default async function InventoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
      category: true,
      created_at: true,
      updated_at: true,
    },
    skip,
    take: pageSize,
  });

  const totalCount = await prisma.inventoryItem.count({
    where: { deleted: false },
  });

  const categories = await prisma.inventoryItem.findMany({
    where: { deleted: false },
    select: { category: true },
    distinct: ['category'],
  });

  return (
    <InventoryClient 
      initialItems={items} 
      totalCount={totalCount}
      categories={categories.filter(c => c.category).map(c => c.category as string)}
      currentPage={page}
      pageSize={pageSize}
    />
  );
}