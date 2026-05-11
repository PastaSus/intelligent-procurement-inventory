'use server';

import { prisma } from '@/lib/prisma';
import { createVendorSchema, updateVendorSchema } from '@/lib/validators/vendor';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createVendor(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in to create vendors' };
    }

    const rawData = {
      name: formData.get('name') as string,
      contact_name: formData.get('contact_name') as string || undefined,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      address: formData.get('address') as string || undefined,
    };

    const result = createVendorSchema.safeParse(rawData);

    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const vendor = await prisma.vendor.create({
      data: {
        ...result.data,
        created_by: session.userId,
        updated_by: session.userId,
      },
    });

    revalidatePath('/dashboard/vendors');

    return { success: true, data: vendor };
  } catch (error) {
    console.error('Create vendor error:', error);
    return { success: false, error: 'Failed to create vendor' };
  }
}

export async function updateVendor(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in to update vendors' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Vendor ID is required' };
    }

    const rawData = {
      name: formData.get('name') as string,
      contact_name: formData.get('contact_name') as string || undefined,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      address: formData.get('address') as string || undefined,
    };

    const result = updateVendorSchema.safeParse(rawData);

    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const existingVendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      return { success: false, error: 'Vendor not found' };
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...result.data,
        updated_by: session.userId,
      },
    });

    revalidatePath('/dashboard/vendors');

    return { success: true, data: vendor };
  } catch (error) {
    console.error('Update vendor error:', error);
    return { success: false, error: 'Failed to update vendor. Please try again.' };
  }
}

export async function deleteVendor(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in to delete vendors' };
    }

    if (session.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can delete vendors' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Vendor ID is required' };
    }

    const existingVendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      return { success: false, error: 'Vendor not found' };
    }

    if (existingVendor.deleted) {
      return { success: false, error: 'Vendor has already been deleted' };
    }

    await prisma.vendor.update({
      where: { id },
      data: {
        deleted: true,
        updated_by: session.userId,
      },
    });

    revalidatePath('/dashboard/vendors');

    return { success: true };
  } catch (error) {
    console.error('Delete vendor error:', error);
    return { success: false, error: 'Failed to delete vendor. Please try again.' };
  }
}