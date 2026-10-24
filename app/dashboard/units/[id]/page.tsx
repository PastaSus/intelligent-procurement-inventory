import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { ComponentsClient } from './ComponentsClient';

const COMPONENT_TYPES = [
  'MOTHERBOARD', 'PROCESSOR', 'MEMORY', 'STORAGE',
  'MONITOR', 'KEYBOARD', 'MOUSE', 'AVR', 'OPTICAL_DRIVE',
] as const;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UnitDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session?.userId) {
    redirect('/login');
  }

  const { id } = await params;

  const unit = await prisma.computerUnit.findUnique({
    where: { id },
    include: {
      laboratory_room: { select: { id: true, name: true } },
      components: { orderBy: { type: 'asc' } },
      installedApplications: { orderBy: { name: 'asc' } },
    },
  });

  if (!unit || unit.deleted) {
    notFound();
  }

  const allUnits = await prisma.computerUnit.findMany({
    where: { deleted: false },
    include: {
      laboratory_room: { select: { id: true, name: true } },
    },
    orderBy: { unit_name: 'asc' },
  });

  const allUnitsMapped = allUnits.map(u => ({
    id: u.id,
    unit_name: u.unit_name,
    roomId: u.laboratory_room.id,
    roomName: u.laboratory_room.name,
  }));

  return (
    <ComponentsClient
      unit={{
        id: unit.id,
        unit_name: unit.unit_name,
        roomId: unit.laboratory_room.id,
        roomName: unit.laboratory_room.name,
      }}
      initialComponents={unit.components}
      initialSoftware={unit.installedApplications}
      componentTypes={COMPONENT_TYPES}
      allUnits={allUnitsMapped}
      isAdmin={session.role === 'ADMIN'}
    />
  );
}
