'use server';

import { prisma } from '@/lib/prisma';
import { createComponentSchema, updateComponentSchema } from '@/lib/validators/computer-component';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createComponent(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const rawData = {
      computerUnitId: formData.get('computerUnitId') as string,
      type: formData.get('type') as string,
      serialNumber: formData.get('serialNumber') as string,
      specifications: formData.get('specifications') as string,
      status: (formData.get('status') as string) || 'FUNCTIONAL',
    };
    const result = createComponentSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const unit = await prisma.computerUnit.findUnique({
      where: { id: result.data.computerUnitId },
    });
    if (!unit || unit.deleted) {
      return { success: false, error: 'Computer unit not found' };
    }

    const existing = await prisma.computerComponent.findUnique({
      where: { serial_number: result.data.serialNumber },
    });
    if (existing) {
      return { success: false, error: 'A component with this serial number already exists' };
    }

    const component = await prisma.computerComponent.create({
      data: {
        computer_unit_id: result.data.computerUnitId,
        type: result.data.type,
        serial_number: result.data.serialNumber,
        specifications: result.data.specifications,
        status: result.data.status,
        created_by: session.userId,
        updated_by: session.userId,
      },
    });

    revalidatePath(`/dashboard/units/${result.data.computerUnitId}`);
    return { success: true, data: component };
  } catch (error) {
    console.error('Create component error:', error);
    return { success: false, error: 'Failed to create component' };
  }
}

export async function updateComponent(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Component ID is required' };
    }

    const rawData = {
      id,
      type: formData.get('type') as string || undefined,
      serialNumber: formData.get('serialNumber') as string || undefined,
      specifications: formData.get('specifications') as string || undefined,
      status: formData.get('status') as string || undefined,
    };
    const result = updateComponentSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const existing = await prisma.computerComponent.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Component not found' };
    }

    if (result.data.serialNumber && result.data.serialNumber !== existing.serial_number) {
      const duplicate = await prisma.computerComponent.findUnique({
        where: { serial_number: result.data.serialNumber },
      });
      if (duplicate) {
        return { success: false, error: 'Another component with this serial number already exists' };
      }
    }

    const component = await prisma.computerComponent.update({
      where: { id },
      data: {
        ...(result.data.type && { type: result.data.type }),
        ...(result.data.serialNumber && { serial_number: result.data.serialNumber }),
        ...(result.data.specifications && { specifications: result.data.specifications }),
        ...(result.data.status && { status: result.data.status }),
        updated_by: session.userId,
      },
    });

    revalidatePath(`/dashboard/units/${existing.computer_unit_id}`);
    return { success: true, data: component };
  } catch (error) {
    console.error('Update component error:', error);
    return { success: false, error: 'Failed to update component' };
  }
}

export async function deleteComponent(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Component ID is required' };
    }

    const existing = await prisma.computerComponent.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Component not found' };
    }

    await prisma.computerComponent.delete({ where: { id } });

    revalidatePath(`/dashboard/units/${existing.computer_unit_id}`);
    return { success: true };
  } catch (error) {
    console.error('Delete component error:', error);
    return { success: false, error: 'Failed to delete component' };
  }
}

const COMPONENT_TYPES = [
  'MOTHERBOARD', 'PROCESSOR', 'MEMORY', 'HDD',
  'MONITOR', 'KEYBOARD', 'MOUSE', 'AVR', 'OPTICAL_DRIVE',
] as const;

export async function bulkAddComponents(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const computerUnitId = formData.get('computerUnitId') as string;
    if (!computerUnitId) {
      return { success: false, error: 'Computer unit ID is required' };
    }

    const unit = await prisma.computerUnit.findUnique({ where: { id: computerUnitId } });
    if (!unit || unit.deleted) {
      return { success: false, error: 'Computer unit not found' };
    }

    const existingTypes = await prisma.computerComponent.findMany({
      where: { computer_unit_id: computerUnitId },
      select: { type: true },
    });
    const existingTypeSet = new Set(existingTypes.map(c => c.type));

    const typesToAdd = COMPONENT_TYPES.filter(t => !existingTypeSet.has(t));

    if (typesToAdd.length === 0) {
      return { success: false, error: 'All component types already exist for this unit' };
    }

    const components = await Promise.all(
      typesToAdd.map(type =>
        prisma.computerComponent.create({
          data: {
            computer_unit_id: computerUnitId,
            type,
            serial_number: `${unit.unit_name}-${type}-PENDING`,
            specifications: 'TBD',
            status: 'FUNCTIONAL',
            created_by: session.userId,
            updated_by: session.userId,
          },
        })
      )
    );

    revalidatePath(`/dashboard/units/${computerUnitId}`);
    return { success: true, data: components };
  } catch (error) {
    console.error('Bulk add components error:', error);
    return { success: false, error: 'Failed to bulk add components' };
  }
}
