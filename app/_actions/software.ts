'use server';

import { prisma } from '@/lib/prisma';
import { createSoftwareSchema, updateSoftwareSchema } from '@/lib/validators/software';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function addInstalledApplication(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const rawData = {
      computerUnitId: formData.get('computerUnitId') as string,
      name: formData.get('name') as string,
      version: (formData.get('version') as string) || undefined,
      licenseKey: (formData.get('licenseKey') as string) || undefined,
      licenseType: (formData.get('licenseType') as string) || 'NONE',
      installDate: (formData.get('installDate') as string) || undefined,
    };
    const result = createSoftwareSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const unit = await prisma.computerUnit.findUnique({
      where: { id: result.data.computerUnitId },
    });
    if (!unit || unit.deleted) {
      return { success: false, error: 'Computer unit not found' };
    }

    const application = await prisma.installedApplication.create({
      data: {
        computer_unit_id: result.data.computerUnitId,
        name: result.data.name,
        version: result.data.version ?? undefined,
        license_key: result.data.licenseKey ?? undefined,
        license_type: result.data.licenseType,
        install_date: result.data.installDate ? new Date(result.data.installDate) : undefined,
      },
    });

    revalidatePath(`/dashboard/units/${result.data.computerUnitId}`);
    return { success: true, data: application };
  } catch (error) {
    console.error('Add installed application error:', error);
    return { success: false, error: 'Failed to add application' };
  }
}

export async function updateInstalledApplication(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Application ID is required' };
    }

    const get = (k: string) => {
      const v = formData.get(k);
      return typeof v === 'string' ? v : undefined;
    };
    const rawName = get('name');
    if (rawName !== undefined && rawName.trim() === '') {
      return { success: false, error: 'Application name is required' };
    }

    const rawData = {
      id,
      name: rawName,
      version: get('version'),
      licenseKey: get('licenseKey'),
      licenseType: get('licenseType'),
      installDate: get('installDate'),
    };
    const result = updateSoftwareSchema.safeParse(rawData);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    const existing = await prisma.installedApplication.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Application not found' };
    }

    const parentUnit = await prisma.computerUnit.findUnique({
      where: { id: existing.computer_unit_id },
    });
    if (!parentUnit || parentUnit.deleted) {
      return { success: false, error: 'Parent unit not found' };
    }

    const application = await prisma.installedApplication.update({
      where: { id },
      data: {
        ...(result.data.name && { name: result.data.name }),
        ...(result.data.version !== undefined && { version: result.data.version || null }),
        ...(result.data.licenseKey !== undefined && { license_key: result.data.licenseKey || null }),
        ...(result.data.licenseType && { license_type: result.data.licenseType }),
        ...(result.data.installDate !== undefined && {
          install_date: result.data.installDate ? new Date(result.data.installDate) : null,
        }),
      },
    });

    revalidatePath(`/dashboard/units/${existing.computer_unit_id}`);
    return { success: true, data: application };
  } catch (error) {
    console.error('Update installed application error:', error);
    return { success: false, error: 'Failed to update application' };
  }
}

export async function removeInstalledApplication(formData: FormData) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }
    if (session.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can remove installed applications' };
    }

    const id = formData.get('id') as string;
    if (!id) {
      return { success: false, error: 'Application ID is required' };
    }

    const existing = await prisma.installedApplication.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Application not found' };
    }

    const parentUnit = await prisma.computerUnit.findUnique({
      where: { id: existing.computer_unit_id },
    });
    if (!parentUnit || parentUnit.deleted) {
      return { success: false, error: 'Parent unit not found' };
    }

    await prisma.installedApplication.delete({ where: { id } });

    revalidatePath(`/dashboard/units/${existing.computer_unit_id}`);
    return { success: true };
  } catch (error) {
    console.error('Remove installed application error:', error);
    return { success: false, error: 'Failed to remove application' };
  }
}
