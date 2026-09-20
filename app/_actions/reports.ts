'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { ComponentStatus, ComponentType } from '@prisma/client';

export interface ReportFilters {
  roomId?: string;
  status?: string;
  componentType?: string;
}

export async function getHardwareReport(filters: ReportFilters = {}) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const VALID_STATUSES: ComponentStatus[] = ['FUNCTIONAL', 'NEEDS_REPAIR', 'NEEDS_REPLACEMENT'];
    const VALID_TYPES: ComponentType[] = [
      'MOTHERBOARD', 'PROCESSOR', 'MEMORY', 'HDD',
      'MONITOR', 'KEYBOARD', 'MOUSE', 'AVR', 'OPTICAL_DRIVE',
    ];
    if (filters.status && !VALID_STATUSES.includes(filters.status as ComponentStatus)) {
      return { success: false, error: 'Invalid status filter' };
    }
    if (filters.componentType && !VALID_TYPES.includes(filters.componentType as ComponentType)) {
      return { success: false, error: 'Invalid component type filter' };
    }

    const [rooms, roomOptions] = await Promise.all([
      prisma.laboratoryRoom.findMany({
      where: {
        deleted: false,
        ...(filters.roomId && { id: filters.roomId }),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        units: {
          where: { deleted: false },
          orderBy: { unit_name: 'asc' },
          select: {
            id: true,
            unit_name: true,
            components: {
              where: {
                ...(filters.status && { status: filters.status as ComponentStatus }),
                ...(filters.componentType && { type: filters.componentType as ComponentType }),
              },
              orderBy: { type: 'asc' },
              select: {
                id: true,
                type: true,
                serial_number: true,
                specifications: true,
                status: true,
              },
            },
          },
        },
      },
      }),
      prisma.laboratoryRoom.findMany({
        where: { deleted: false },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    ]);

    return { success: true, data: { rooms, roomOptions } };
  } catch (error) {
    console.error('Get hardware report error:', error);
    return { success: false, error: 'Failed to load hardware report' };
  }
}
