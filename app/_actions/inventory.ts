'use server';

import { prisma } from '@/lib/prisma';
import { createInventoryItemSchema, updateInventoryItemSchema } from '@/lib/validators/inventory';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createInventoryItem(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in to create inventory items' };
    }

    const rawData = {
      sku: formData.get('sku') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      quantity: parseInt(formData.get('quantity') as string, 10),
      reorder_point: parseInt(formData.get('reorder_point') as string, 10),
      category: formData.get('category') as string || undefined,
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
        created_by: session.userId,
        updated_by: session.userId,
      },
    });

    revalidatePath('/dashboard/inventory');

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
      return { success: false, error: 'You must be logged in to update inventory items' };
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
      category: formData.get('category') as string || undefined,
    };

    if (isNaN(rawData.quantity) || rawData.quantity < 0) {
      return { success: false, error: 'Quantity must be a non-negative number' };
    }

    if (isNaN(rawData.reorder_point) || rawData.reorder_point < 0) {
      return { success: false, error: 'Reorder point must be a non-negative number' };
    }

    if (!rawData.name || rawData.name.trim() === '') {
      return { success: false, error: 'Name is required' };
    }

    const result = updateInventoryItemSchema.safeParse(rawData);

    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
    });

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
        category: result.data.category,
        updated_by: session.userId,
      },
    });

    revalidatePath('/dashboard/inventory');

    return { success: true, data: item };
  } catch (error) {
    console.error('Update inventory item error:', error);
    return { success: false, error: 'Failed to update inventory item. Please try again.' };
  }
}