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

  return (
    <ComponentsClient
      unit={{
        id: unit.id,
        unit_name: unit.unit_name,
        roomName: unit.laboratory_room.name,
      }}
      initialComponents={unit.components}
      componentTypes={COMPONENT_TYPES}
    />
  );
}
