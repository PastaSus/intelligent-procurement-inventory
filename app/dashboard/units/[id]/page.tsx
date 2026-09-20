import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ComponentsClient } from './ComponentsClient';

const COMPONENT_TYPES = [
  'MOTHERBOARD', 'PROCESSOR', 'MEMORY', 'HDD',
  'MONITOR', 'KEYBOARD', 'MOUSE', 'AVR', 'OPTICAL_DRIVE',
] as const;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UnitDetailPage({ params }: PageProps) {
  const { id } = await params;

  const unit = await prisma.computerUnit.findUnique({
    where: { id },
    include: {
      laboratory_room: { select: { name: true } },
      components: { orderBy: { type: 'asc' } },
    },
  });

  if (!unit || unit.deleted) {
    notFound();
  }

  const allUnits = await prisma.computerUnit.findMany({
    where: { deleted: false },
    include: {
      laboratory_room: { select: { name: true } },
    },
    orderBy: { unit_name: 'asc' },
  });

  const allUnitsMapped = allUnits.map(u => ({
    id: u.id,
    unit_name: u.unit_name,
    roomName: u.laboratory_room.name,
  }));

  return (
    <ComponentsClient
      unit={{
        id: unit.id,
        unit_name: unit.unit_name,
        roomName: unit.laboratory_room.name,
      }}
      initialComponents={unit.components}
      componentTypes={COMPONENT_TYPES}
      allUnits={allUnitsMapped}
    />
  );
}
