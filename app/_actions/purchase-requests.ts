'use server';

import { prisma } from '@/lib/prisma';
import { createPurchaseRequestSchema, approveRequestSchema, rejectRequestSchema } from '@/lib/validators/purchase-request';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

function generatePRNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PR-${year}${month}${day}-${random}`;
}

export async function createPurchaseRequest(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in to create purchase requests' };
    }
    if (session.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can create purchase requests' };
    }

    const rawItems = formData.get('items');
    let items: Array<{ itemName: string; quantity: number; unitPrice?: number; inventoryItemId?: string }> = [];

    if (rawItems) {
      try {
        items = JSON.parse(rawItems as string);
      } catch {
        return { success: false, error: 'Invalid line items data' };
      }
    }

    const rawData = {
      items,
      notes: formData.get('notes') as string || undefined,
    };

    const result = createPurchaseRequestSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    // Fail closed: every referenced stock part must exist and not be deleted.
    const referencedIds = [...new Set(
      result.data.items.map((i) => i.inventoryItemId).filter((id): id is string => !!id)
    )];
    if (referencedIds.length > 0) {
      const existingParts = await prisma.inventoryItem.findMany({
        where: { id: { in: referencedIds }, deleted: false },
        select: { id: true },
      });
      const found = new Set(existingParts.map((p) => p.id));
      const missing = referencedIds.filter((id) => !found.has(id));
      if (missing.length > 0) {
        return { success: false, error: 'One or more selected stock parts no longer exist' };
      }
    }

    const pr = await prisma.$transaction(async (tx) => {
      let prNumber = generatePRNumber();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await tx.purchaseRequest.findUnique({
          where: { pr_number: prNumber },
        });
        if (!existing) break;
        prNumber = generatePRNumber();
        attempts++;
      }
      if (attempts >= 5) {
        throw new Error('Unable to generate unique PR number after 5 attempts');
      }

      return tx.purchaseRequest.create({
        data: {
          pr_number: prNumber,
          created_by: session.userId,
          updated_by: session.userId,
          items: {
            create: result.data.items.map((item) => ({
              item_name: item.itemName.trim(),
              quantity: item.quantity,
              ...(item.unitPrice !== undefined && { unit_price: item.unitPrice }),
              ...(item.inventoryItemId !== undefined && { inventory_item_id: item.inventoryItemId }),
            })),
          },
        },
        include: { items: true },
      });
    });

    revalidatePath('/dashboard/purchase-requests');
    return { success: true, data: pr };
  } catch (error) {
    console.error('Create purchase request error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create purchase request';
    return { success: false, error: message };
  }
}

export async function submitPurchaseRequest(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    if (session.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can submit purchase requests' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Request ID is required' };
    }

    const existing = await prisma.purchaseRequest.findUnique({ where: { id } });
    if (!existing || existing.deleted) {
      return { success: false, error: 'Purchase request not found' };
    }
    if (existing.status !== 'DRAFT') {
      return { success: false, error: 'Only draft requests can be submitted' };
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: { status: 'REQUESTED', updated_by: session.userId },
    });

    revalidatePath('/dashboard/purchase-requests');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Submit purchase request error:', error);
    return { success: false, error: 'Failed to submit purchase request' };
  }
}

export async function approvePurchaseRequest(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }
    if (session.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can approve requests' };
    }

    const rawData = { id: formData.get('id') as string };
    const result = approveRequestSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const existing = await prisma.purchaseRequest.findUnique({ where: { id: result.data.id } });
    if (!existing || existing.deleted) {
      return { success: false, error: 'Purchase request not found' };
    }
    if (existing.status !== 'REQUESTED') {
      return { success: false, error: 'Only requested requests can be approved' };
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id: result.data.id },
      data: { status: 'APPROVED', updated_by: session.userId },
    });

    revalidatePath('/dashboard/purchase-requests');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Approve purchase request error:', error);
    return { success: false, error: 'Failed to approve purchase request' };
  }
}

export async function rejectPurchaseRequest(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }
    if (session.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can reject requests' };
    }

    const rawData = {
      id: formData.get('id') as string,
      reason: formData.get('reason') as string,
    };
    const result = rejectRequestSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const existing = await prisma.purchaseRequest.findUnique({ where: { id: result.data.id } });
    if (!existing || existing.deleted) {
      return { success: false, error: 'Purchase request not found' };
    }
    if (existing.status !== 'REQUESTED') {
      return { success: false, error: 'Only requested requests can be rejected' };
    }

    const notes = existing.notes
      ? `${existing.notes}\nREJECTED: ${result.data.reason}`
      : `REJECTED: ${result.data.reason}`;
    const updated = await prisma.purchaseRequest.update({
      where: { id: result.data.id },
      data: { status: 'REJECTED', notes, updated_by: session.userId },
    });

    revalidatePath('/dashboard/purchase-requests');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Reject purchase request error:', error);
    return { success: false, error: 'Failed to reject purchase request' };
  }
}

export async function fulfillPurchaseRequest(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    if (session.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can fulfill purchase requests' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Request ID is required' };
    }

    const existing = await prisma.purchaseRequest.findUnique({ where: { id } });
    if (!existing || existing.deleted) {
      return { success: false, error: 'Purchase request not found' };
    }
    if (existing.status !== 'APPROVED') {
      return { success: false, error: 'Only approved requests can be fulfilled' };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const requestItems = await tx.requestItem.findMany({
        where: { purchase_request_id: id },
      });
      for (const ri of requestItems) {
        if (ri.inventory_item_id) {
          // Linked stock part: exact increment, never fuzzy.
          await tx.inventoryItem.update({
            where: { id: ri.inventory_item_id },
            data: { quantity: { increment: ri.quantity } },
          });
        } else {
          // Legacy free-text rows: name-match fallback only.
          await tx.inventoryItem.updateMany({
            where: { name: { contains: ri.item_name, mode: 'insensitive' } },
            data: { quantity: { increment: ri.quantity } },
          });
        }
      }

      return tx.purchaseRequest.update({
        where: { id },
        data: { status: 'FULFILLED', updated_by: session.userId },
      });
    });

    revalidatePath('/dashboard/purchase-requests');
    revalidatePath('/dashboard/inventory');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Fulfill purchase request error:', error);
    return { success: false, error: 'Failed to fulfill purchase request' };
  }
}
