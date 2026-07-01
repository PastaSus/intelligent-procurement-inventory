import { prisma } from '@/lib/prisma';
import { RoomsClient } from './RoomsClient';
import { SearchParams } from './types';

export default async function RoomsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  const page = parseInt(params.page || '1', 10);
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const rooms = await prisma.laboratoryRoom.findMany({
    where: { deleted: false },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      created_at: true,
      updated_at: true,
      _count: { select: { units: true } },
    },
    skip,
    take: pageSize,
  });

  const totalCount = await prisma.laboratoryRoom.count({
    where: { deleted: false },
  });

  return (
    <RoomsClient
      initialRooms={rooms}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
    />
  );
}
