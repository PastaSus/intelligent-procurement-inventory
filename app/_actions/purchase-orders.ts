'use server';

import { prisma } from '@/lib/prisma';
import { createPOSchema, updatePOSchema, approvePOSchema, sendPOSchema, calculateLineTotal } from '@/lib/validators/purchase-order';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

function generatePONumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PO-${year}${month}${day}-${random}`;
}

export async function createPurchaseOrder(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in to create purchase orders' };
    }

    const rawItems = formData.get('items');
    let items: Array<{ itemName: string; quantity: number; unitPrice: number }> = [];

    if (rawItems) {
      try {
        items = JSON.parse(rawItems as string);
      } catch {
        return { success: false, error: 'Invalid line items data' };
      }
    }

    const rawData = {
      vendorId: formData.get('vendorId') as string,
      items,
      notes: formData.get('notes') as string || undefined,
    };

    const result = createPOSchema.safeParse(rawData);

    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const po = await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.findUnique({
        where: { id: result.data.vendorId },
      });

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      if (vendor.deleted) {
        throw new Error('Selected vendor has been deleted');
      }

      let poNumber = generatePONumber();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await tx.purchaseOrder.findUnique({
          where: { po_number: poNumber },
        });
        if (!existing) break;
        poNumber = generatePONumber();
        attempts++;
      }
      if (attempts >= 5) {
        throw new Error('Unable to generate unique PO number after 5 attempts');
      }

      const newPO = await tx.purchaseOrder.create({
        data: {
          po_number: poNumber,
          vendor_id: result.data.vendorId,
          created_by: session.userId,
          updated_by: session.userId,
          line_items: {
            create: result.data.items.map((item) => ({
              item_name: item.itemName.trim(),
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total: calculateLineTotal(item.quantity, item.unitPrice),
            })),
          },
        },
        include: {
          vendor: { select: { name: true } },
          line_items: true,
        },
      });

      return newPO;
    });

    revalidatePath('/dashboard/purchase-orders');

    return { success: true, data: po };
  } catch (error) {
    console.error('Create purchase order error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create purchase order';
    return { success: false, error: message };
  }
}

export async function updatePurchaseOrder(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in to update purchase orders' };
    }

    const rawItems = formData.get('items');
    let items: Array<{ itemName: string; quantity: number; unitPrice: number }> = [];

    if (rawItems) {
      try {
        items = JSON.parse(rawItems as string);
      } catch {
        return { success: false, error: 'Invalid line items data' };
      }
    }

    const rawData = {
      id: formData.get('id') as string,
      vendorId: formData.get('vendorId') as string,
      items,
      notes: formData.get('notes') as string || undefined,
    };

    const result = updatePOSchema.safeParse(rawData);

    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const po = await prisma.$transaction(async (tx) => {
      const existingPO = await tx.purchaseOrder.findUnique({
        where: { id: result.data.id },
      });

      if (!existingPO) {
        throw new Error('Purchase order not found');
      }

      if (existingPO.deleted) {
        throw new Error('Purchase order has been deleted');
      }

      if (existingPO.status !== 'DRAFT') {
        throw new Error('Only draft purchase orders can be edited');
      }

      if (session.role !== 'ADMIN' && existingPO.created_by !== session.userId) {
        throw new Error('You do not have permission to edit this purchase order');
      }

      await tx.pOItem.deleteMany({
        where: { purchase_order_id: result.data.id },
      });

      const updatedPO = await tx.purchaseOrder.update({
        where: { id: result.data.id },
        data: {
          vendor_id: result.data.vendorId,
          updated_by: session.userId,
          line_items: {
            create: result.data.items.map((item) => ({
              item_name: item.itemName.trim(),
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total: calculateLineTotal(item.quantity, item.unitPrice),
            })),
          },
        },
        include: {
          vendor: { select: { name: true } },
          line_items: true,
        },
      });

      return updatedPO;
    });

    revalidatePath('/dashboard/purchase-orders');

    return { success: true, data: po };
  } catch (error) {
    console.error('Update purchase order error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update purchase order. Please try again.';
    return { success: false, error: message };
  }
}

export async function approvePurchaseOrder(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in to approve purchase orders' };
    }

    if (session.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can approve purchase orders' };
    }

    const rawData = { id: formData.get('id') as string };
    const result = approvePOSchema.safeParse(rawData);

    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const po = await prisma.$transaction(async (tx) => {
      const existingPO = await tx.purchaseOrder.findUnique({
        where: { id: result.data.id },
      });

      if (!existingPO) {
        throw new Error('Purchase order not found');
      }

      if (existingPO.deleted) {
        throw new Error('Purchase order has been deleted');
      }

      if (existingPO.status !== 'DRAFT') {
        throw new Error('Only draft purchase orders can be approved');
      }

      const updatedPO = await tx.purchaseOrder.update({
        where: { id: result.data.id },
        data: {
          status: 'APPROVED',
          updated_by: session.userId,
        },
      });

      return updatedPO;
    });

    revalidatePath('/dashboard/purchase-orders');

    return { success: true, data: po };
  } catch (error) {
    console.error('Approve purchase order error:', error);
    const message = error instanceof Error ? error.message : 'Failed to approve purchase order. Please try again.';
    return { success: false, error: message };
  }
}

export async function sendPurchaseOrder(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in to send purchase orders' };
    }

    if (session.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can send purchase orders' };
    }

    const rawData = { id: formData.get('id') as string };
    const result = sendPOSchema.safeParse(rawData);

    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const po = await prisma.$transaction(async (tx) => {
      const existingPO = await tx.purchaseOrder.findUnique({
        where: { id: result.data.id },
      });

      if (!existingPO) {
        throw new Error('Purchase order not found');
      }

      if (existingPO.deleted) {
        throw new Error('Purchase order has been deleted');
      }

      if (existingPO.status !== 'APPROVED') {
        throw new Error('Only approved purchase orders can be sent');
      }

      const updatedPO = await tx.purchaseOrder.update({
        where: { id: result.data.id },
        data: {
          status: 'SENT',
          updated_by: session.userId,
        },
      });

      return updatedPO;
    });

    revalidatePath('/dashboard/purchase-orders');

    return { success: true, data: po };
  } catch (error) {
    console.error('Send purchase order error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send purchase order. Please try again.';
    return { success: false, error: message };
  }
}

export async function deletePurchaseOrder(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in to delete purchase orders' };
    }

    if (session.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can delete purchase orders' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'PO ID is required' };
    }

    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!existingPO) {
      return { success: false, error: 'Purchase order not found' };
    }

    if (existingPO.deleted) {
      return { success: false, error: 'Purchase order has already been deleted' };
    }

    await prisma.purchaseOrder.update({
      where: { id },
      data: {
        deleted: true,
        updated_by: session.userId,
      },
    });

    revalidatePath('/dashboard/purchase-orders');

    return { success: true };
  } catch (error) {
    console.error('Delete purchase order error:', error);
    return { success: false, error: 'Failed to delete purchase order. Please try again.' };
  }
}

export async function exportPurchaseOrder(id: string) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in to export purchase orders' };
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        line_items: true,
      },
    });

    if (!po) {
      return { success: false, error: 'Purchase order not found' };
    }

    if (po.deleted) {
      return { success: false, error: 'Purchase order has been deleted' };
    }

    if (po.status === 'DRAFT') {
      return { success: false, error: 'Draft POs must be approved before exporting' };
    }

    const lineItemsText = po.line_items.map((item, index) => {
      const total = typeof item.total === 'string' ? parseFloat(item.total) : item.total;
      return `${index + 1}. ${item.item_name.padEnd(30)} ${String(item.quantity).padStart(5)} ${formatCurrency(item.unit_price).padStart(12)} ${formatCurrency(total).padStart(12)}`;
    }).join('\n');

    const grandTotal = po.line_items.reduce((sum, item) => {
      const t = typeof item.total === 'string' ? parseFloat(item.total) : Number(item.total);
      return sum + t;
    }, 0);

    const date = new Date(po.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const emailContent = `PURCHASE ORDER
=============

PO Number: ${po.po_number}
Date: ${formattedDate}
Status: ${po.status}

VENDOR
------
${po.vendor.name}
Contact: ${po.vendor.contact_name || 'N/A'}
Email: ${po.vendor.email || 'N/A'}
Phone: ${po.vendor.phone || 'N/A'}
${po.vendor.address ? `\nAddress:\n${po.vendor.address}` : ''}

LINE ITEMS
----------
#  Item Name                       Qty   Unit Price      Total
${lineItemsText}
                                    ----------------
                              Grand Total: ${formatCurrency(grandTotal)}

---
Generated by Intelligent Procurement & Inventory System`;

    return { success: true, data: { content: emailContent, poNumber: po.po_number } };
  } catch (error) {
    console.error('Export purchase order error:', error);
    return { success: false, error: 'Failed to export purchase order' };
  }
}

function formatCurrency(value: unknown): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value as number) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}
