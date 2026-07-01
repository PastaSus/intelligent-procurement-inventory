'use server';

import { prisma } from '@/lib/prisma';
import { createInventoryItemSchema, updateInventoryItemSchema } from '@/lib/validators/inventory';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createInventoryItem(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const rawData = {
      sku: formData.get('sku') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      quantity: parseInt(formData.get('quantity') as string, 10),
      reorder_point: parseInt(formData.get('reorder_point') as string, 10),
      component_type: (formData.get('component_type') as string) || undefined,
    };

    const result = createInventoryItemSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const existingItem = await prisma.inventoryItem.findUnique({
      where: { sku: result.data.sku },
    });
    if (existingItem) {
      return { success: false, error: 'An item with this SKU already exists' };
    }

    const item = await prisma.inventoryItem.create({
      data: {
        ...result.data,
        component_type: result.data.component_type ?? null,
        created_by: session.userId,
        updated_by: session.userId,
      },
    });

    revalidatePath('/dashboard/spare-parts');
    return { success: true, data: item };
  } catch (error) {
    console.error('Create inventory item error:', error);
    return { success: false, error: 'Failed to create inventory item' };
  }
}

export async function updateInventoryItem(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Item ID is required' };
    }

    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      quantity: parseInt(formData.get('quantity') as string, 10),
      reorder_point: parseInt(formData.get('reorder_point') as string, 10),
      component_type: (formData.get('component_type') as string) || undefined,
    };

    const result = updateInventoryItemSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const existingItem = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existingItem) {
      return { success: false, error: 'Item not found' };
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: result.data.name,
        description: result.data.description,
        quantity: result.data.quantity,
        reorder_point: result.data.reorder_point,
        component_type: result.data.component_type ?? null,
        updated_by: session.userId,
      },
    });

    revalidatePath('/dashboard/spare-parts');
    return { success: true, data: item };
  } catch (error) {
    console.error('Update inventory item error:', error);
    return { success: false, error: 'Failed to update inventory item' };
  }
}

export async function deleteInventoryItem(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Item ID is required' };
    }

    const existingItem = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existingItem) {
      return { success: false, error: 'Item not found' };
    }
    if (existingItem.deleted) {
      return { success: false, error: 'Item has already been deleted' };
    }

    await prisma.inventoryItem.update({
      where: { id },
      data: { deleted: true, updated_by: session.userId },
    });

    revalidatePath('/dashboard/spare-parts');
    return { success: true };
  } catch (error) {
    console.error('Delete inventory item error:', error);
    return { success: false, error: 'Failed to delete inventory item' };
  }
}
