import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UnitsClient } from './UnitsClient';
import { SearchParams } from './types';

export default async function UnitsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) {
    redirect('/login');
  }
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const rooms = await prisma.laboratoryRoom.findMany({
    where: { deleted: false },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const initialRoomId = params.room_id && rooms.some((room) => room.id === params.room_id)
    ? params.room_id
    : 'all';

  const where: Record<string, unknown> = { deleted: false };
  if (initialRoomId !== 'all') {
    where.laboratory_room_id = initialRoomId;
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
      components: { select: { status: true } },
    },
    skip,
    take: pageSize,
  });

  const totalCount = await prisma.computerUnit.count({ where });

  return (
    <UnitsClient
      initialUnits={units}
      totalCount={totalCount}
      currentPage={page}
      pageSize={pageSize}
      rooms={rooms}
      initialRoomId={initialRoomId}
      isAdmin={session.role === 'ADMIN'}
    />
  );
}
