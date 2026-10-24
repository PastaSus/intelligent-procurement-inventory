'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { COMPONENT_TYPE_ORDER, buildReplenishmentRows, withNetShortage } from '@/lib/spare-parts';
import type { ComponentStatus, ComponentType } from '@prisma/client';

export interface ReportFilters {
  roomId?: string;
  status?: string;
  componentType?: string;
}

export interface SparePartsReportFilters {
  roomId?: string;
  componentType?: string;
  shortagesOnly?: boolean;
}

export interface SparePartsReportRow {
  type: ComponentType;
  label: string;
  forReplacement: number;
  spareQty: number;
  netShortage: number;
}

export async function getHardwareReport(filters: ReportFilters = {}) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    const VALID_STATUSES: ComponentStatus[] = ['FUNCTIONAL', 'NEEDS_REPAIR', 'NEEDS_REPLACEMENT'];
    if (filters.status && !VALID_STATUSES.includes(filters.status as ComponentStatus)) {
      return { success: false, error: 'Invalid status filter' };
    }
    if (filters.componentType && !COMPONENT_TYPE_ORDER.includes(filters.componentType as ComponentType)) {
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

export async function getSparePartsReport(filters: SparePartsReportFilters = {}) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: 'You must be logged in' };
    }

    if (filters.componentType && !COMPONENT_TYPE_ORDER.includes(filters.componentType as ComponentType)) {
      return { success: false, error: 'Invalid component type filter' };
    }

    const componentType = filters.componentType as ComponentType | undefined;

    const [replacementByType, spareByType, roomOptions] = await Promise.all([
      prisma.computerComponent.groupBy({
        by: ['type'],
        where: {
          status: 'NEEDS_REPLACEMENT',
          ...(componentType && { type: componentType }),
          computer_unit: {
            deleted: false,
            laboratory_room: {
              deleted: false,
              ...(filters.roomId && { id: filters.roomId }),
            },
          },
        },
        _count: true,
      }),
      prisma.inventoryItem.groupBy({
        by: ['component_type'],
        where: {
          deleted: false,
          component_type: componentType ?? { not: null },
        },
        _sum: { quantity: true },
      }),
      prisma.laboratoryRoom.findMany({
        where: { deleted: false },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    ]);

    if (filters.roomId && !roomOptions.some((room) => room.id === filters.roomId)) {
      return { success: false, error: 'Invalid room filter' };
    }

    const replacementCounts = new Map<string, number>();
    for (const row of replacementByType) {
      replacementCounts.set(row.type, row._count);
    }

    const spareQuantities = new Map<string, number>();
    for (const row of spareByType) {
      if (row.component_type) {
        spareQuantities.set(row.component_type, row._sum.quantity ?? 0);
      }
    }

    const types = componentType ? [componentType] : COMPONENT_TYPE_ORDER;

    const allRows: SparePartsReportRow[] = types.map((type) => ({
      type,
      label: type.replace(/_/g, ' '),
      forReplacement: replacementCounts.get(type) ?? 0,
      spareQty: spareQuantities.get(type) ?? 0,
    }))
      .map(withNetShortage)
      .sort((a, b) => b.forReplacement - a.forReplacement || a.label.localeCompare(b.label));

    const rows = filters.shortagesOnly
      ? allRows.filter((row) => row.netShortage > 0)
      : allRows;

    const requestRows = buildReplenishmentRows(rows);

    const totals = rows.reduce(
      (acc, row) => ({
        forReplacement: acc.forReplacement + row.forReplacement,
        spareQty: acc.spareQty + row.spareQty,
        netShortage: acc.netShortage + row.netShortage,
      }),
      { forReplacement: 0, spareQty: 0, netShortage: 0 }
    );

    return { success: true as const, data: { rows, requestRows, totals, roomOptions } };
  } catch (error) {
    console.error('Get spare parts report error:', error);
    return { success: false as const, error: 'Failed to load spare parts report' };
  }
}
