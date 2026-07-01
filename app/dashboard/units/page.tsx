import { prisma } from '@/lib/prisma';
import { UnitsClient } from './UnitsClient';
import { SearchParams } from './types';

export default async function UnitsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  const page = parseInt(params.page || '1', 10);
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { deleted: false };
  if (params.room_id) {
    where.laboratory_room_id = params.room_id;
  }

  const units = await prisma.computerUnit.findMany({
    where,
    orderBy: { unit_name: 'asc' },
    select: {
      id: true,
      unit_name: true,
      laboratory_room_id: true,
      created_at: true,
      updated_at: true,
      laboratory_room: { select: { name: true } },
      _count: { select: { components: true } },
    },
    skip,
    take: pageSize,
  });

  const totalCount = await prisma.computerUnit.count({ where });

  const rooms = await prisma.laboratoryRoom.findMany({
    where: { deleted: false },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <UnitsClient
      initialUnits={units}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      rooms={rooms}
    />
  );
}
