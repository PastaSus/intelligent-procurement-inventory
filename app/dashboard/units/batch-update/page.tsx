import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { COMPONENT_TYPES } from '@/lib/component-health';
import { BatchUpdateClient } from './BatchUpdateClient';

export default async function BatchUpdatePage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect('/login');
  }

  const components = await prisma.computerComponent.findMany({
    where: { computer_unit: { deleted: false } },
    include: {
      computer_unit: {
        select: {
          id: true,
          unit_name: true,
          laboratory_room: { select: { id: true, name: true } },
        },
      },
    },
  });

  components.sort(
    (a, b) =>
      a.computer_unit.laboratory_room.name.localeCompare(b.computer_unit.laboratory_room.name) ||
      a.computer_unit.unit_name.localeCompare(b.computer_unit.unit_name) ||
      a.type.localeCompare(b.type),
  );

  return (
    <BatchUpdateClient
      initialComponents={components}
      componentTypes={COMPONENT_TYPES}
    />
  );
}
