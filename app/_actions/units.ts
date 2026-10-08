'use server';

import { prisma } from '@/lib/prisma';
import { createComputerUnitSchema, updateComputerUnitSchema } from '@/lib/validators/computer-unit';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createComputerUnit(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const rawData = {
      unitName: formData.get('unitName') as string,
      laboratoryRoomId: formData.get('laboratoryRoomId') as string,
    };
    const result = createComputerUnitSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const room = await prisma.laboratoryRoom.findUnique({
      where: { id: result.data.laboratoryRoomId },
    });
    if (!room || room.deleted) {
      return { success: false, error: 'Selected laboratory room not found' };
    }

    const existing = await prisma.computerUnit.findUnique({
      where: { unit_name_laboratory_room_id: { unit_name: result.data.unitName, laboratory_room_id: result.data.laboratoryRoomId } },
    });
    if (existing) {
      return { success: false, error: 'A unit with this name already exists in the selected room' };
    }

    const unit = await prisma.computerUnit.create({
      data: {
        unit_name: result.data.unitName,
        laboratory_room_id: result.data.laboratoryRoomId,
        created_by: session.userId,
        updated_by: session.userId,
      },
    });

    revalidatePath('/dashboard/units');
    return { success: true, data: unit };
  } catch (error) {
    console.error('Create computer unit error:', error);
    return { success: false, error: 'Failed to create computer unit' };
  }
}

export async function updateComputerUnit(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Unit ID is required' };
    }

    const rawData = {
      id,
      unitName: formData.get('unitName') as string || undefined,
      laboratoryRoomId: formData.get('laboratoryRoomId') as string || undefined,
    };
    const result = updateComputerUnitSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const existing = await prisma.computerUnit.findUnique({ where: { id } });
    if (!existing || existing.deleted) {
      return { success: false, error: 'Computer unit not found' };
    }

    if (result.data.unitName || result.data.laboratoryRoomId) {
      const unitName = result.data.unitName || existing.unit_name;
      const labRoomId = result.data.laboratoryRoomId || existing.laboratory_room_id;
      const duplicate = await prisma.computerUnit.findFirst({
        where: {
          unit_name: unitName,
          laboratory_room_id: labRoomId,
          id: { not: id },
          deleted: false,
        },
      });
      if (duplicate) {
        return { success: false, error: 'Another unit with this name already exists in this room' };
      }
    }

    if (result.data.laboratoryRoomId) {
      const room = await prisma.laboratoryRoom.findUnique({
        where: { id: result.data.laboratoryRoomId },
      });
      if (!room || room.deleted) {
        return { success: false, error: 'Selected laboratory room not found' };
      }
    }

    const unit = await prisma.computerUnit.update({
      where: { id },
      data: {
        ...(result.data.unitName && { unit_name: result.data.unitName }),
        ...(result.data.laboratoryRoomId && { laboratory_room_id: result.data.laboratoryRoomId }),
        updated_by: session.userId,
      },
    });

    revalidatePath('/dashboard/units');
    return { success: true, data: unit };
  } catch (error) {
    console.error('Update computer unit error:', error);
    return { success: false, error: 'Failed to update computer unit' };
  }
}

export async function deleteComputerUnit(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }
    if (session.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can delete computer units' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Unit ID is required' };
    }

    const existing = await prisma.computerUnit.findUnique({
      where: { id },
      include: { _count: { select: { components: true } } },
    });
    if (!existing || existing.deleted) {
      return { success: false, error: 'Computer unit not found' };
    }

    await prisma.computerUnit.delete({ where: { id } });

    revalidatePath('/dashboard/units');
    revalidatePath('/dashboard/component-status');
    return { success: true, componentCount: existing._count.components };
  } catch (error) {
    console.error('Delete computer unit error:', error);
    return { success: false, error: 'Failed to delete computer unit' };
  }
}

export async function getRoomsForSelect() {
  try {
    const rooms = await prisma.laboratoryRoom.findMany({
      where: { deleted: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: rooms };
  } catch {
    return { success: false, error: 'Failed to fetch rooms' };
  }
}
