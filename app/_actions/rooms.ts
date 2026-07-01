'use server';

import { prisma } from '@/lib/prisma';
import { createLabRoomSchema, updateLabRoomSchema } from '@/lib/validators/lab-room';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createLabRoom(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const rawData = { name: formData.get('name') as string };
    const result = createLabRoomSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const existing = await prisma.laboratoryRoom.findUnique({
      where: { name: result.data.name },
    });
    if (existing) {
      return { success: false, error: 'A room with this name already exists' };
    }

    const room = await prisma.laboratoryRoom.create({
      data: {
        name: result.data.name,
        created_by: session.userId,
        updated_by: session.userId,
      },
    });

    revalidatePath('/dashboard/rooms');
    return { success: true, data: room };
  } catch (error) {
    console.error('Create lab room error:', error);
    return { success: false, error: 'Failed to create laboratory room' };
  }
}

export async function updateLabRoom(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Room ID is required' };
    }

    const rawData = { id, name: formData.get('name') as string || undefined };
    const result = updateLabRoomSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const existing = await prisma.laboratoryRoom.findUnique({ where: { id } });
    if (!existing || existing.deleted) {
      return { success: false, error: 'Room not found' };
    }

    if (result.data.name) {
      const duplicate = await prisma.laboratoryRoom.findFirst({
        where: { name: result.data.name, id: { not: id }, deleted: false },
      });
      if (duplicate) {
        return { success: false, error: 'Another room with this name already exists' };
      }
    }

    const room = await prisma.laboratoryRoom.update({
      where: { id },
      data: {
        ...(result.data.name && { name: result.data.name }),
        updated_by: session.userId,
      },
    });

    revalidatePath('/dashboard/rooms');
    return { success: true, data: room };
  } catch (error) {
    console.error('Update lab room error:', error);
    return { success: false, error: 'Failed to update laboratory room' };
  }
}

export async function deleteLabRoom(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Room ID is required' };
    }

    const existing = await prisma.laboratoryRoom.findUnique({
      where: { id },
      include: { _count: { select: { units: true } } },
    });
    if (!existing || existing.deleted) {
      return { success: false, error: 'Room not found' };
    }
    if (existing._count.units > 0) {
      return { success: false, error: 'Cannot delete room with existing computer units. Remove all units first.' };
    }

    await prisma.laboratoryRoom.update({
      where: { id },
      data: { deleted: true, updated_by: session.userId },
    });

    revalidatePath('/dashboard/rooms');
    return { success: true };
  } catch (error) {
    console.error('Delete lab room error:', error);
    return { success: false, error: 'Failed to delete laboratory room' };
  }
}
