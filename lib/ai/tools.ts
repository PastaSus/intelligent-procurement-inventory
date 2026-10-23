import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  ComponentStatusEnum,
  ComponentTypeEnum,
  LicenseTypeEnum,
} from '@/lib/validators/enums';

export interface AiToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

const PurchaseRequestStatusEnum = z.enum([
  'DRAFT',
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'FULFILLED',
]);

const limitSchema = z.coerce.number().int().min(1).max(25).optional().default(10);
const roomSchema = z.string().trim().min(1).max(100).optional();
const unitSchema = z.string().trim().min(1).max(100).optional();
const querySchema = z.string().trim().min(1).max(100).optional();

const OverviewArgs = z.object({});
const ListRoomsArgs = z.object({});
const ListUnitsArgs = z.object({
  room: roomSchema,
  status: ComponentStatusEnum.optional(),
  limit: limitSchema,
});
const ListComponentsArgs = z.object({
  room: roomSchema,
  unit: unitSchema,
  type: ComponentTypeEnum.optional(),
  status: ComponentStatusEnum.optional(),
  query: querySchema,
  limit: limitSchema,
});
const ListInventoryArgs = z.object({
  query: querySchema,
  component_type: ComponentTypeEnum.optional(),
  low_stock_only: z.boolean().optional().default(false),
  limit: limitSchema,
});
const ListPurchaseRequestsArgs = z.object({
  status: PurchaseRequestStatusEnum.optional(),
  limit: limitSchema,
});
const ListApplicationsArgs = z.object({
  query: querySchema,
  room: roomSchema,
  unit: unitSchema,
  license_type: LicenseTypeEnum.optional(),
  limit: limitSchema,
});

const componentStatusSchema = {
  type: 'string',
  enum: [...ComponentStatusEnum.options],
  description: 'Filter by component status.',
};
const componentTypeSchema = {
  type: 'string',
  enum: [...ComponentTypeEnum.options],
  description: 'Filter by component type.',
};
const limitProperty = {
  type: 'integer',
  minimum: 1,
  maximum: 25,
  default: 10,
  description: 'Maximum number of rows to return (1-25).',
};
const roomProperty = {
  type: 'string',
  description: 'Room name or partial room name, e.g. "301" or "Lab 2".',
};
const unitProperty = {
  type: 'string',
  description: 'Unit name or partial unit name, e.g. "PC-12".',
};

export const AI_TOOL_DEFINITIONS: AiToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_lab_overview',
      description:
        'Get high-level lab totals: rooms, units, components, component status counts, pending purchase requests, and low-stock count. Use for general "how many" questions.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_rooms',
      description:
        'List every laboratory room with its unit count, component count, and number of components needing repair or replacement. Use to compare rooms or find the most problematic rooms.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_units',
      description:
        'List computer units with their room, component counts, and problem components. Optionally filter by room name or by a component status such as NEEDS_REPAIR.',
      parameters: {
        type: 'object',
        properties: {
          room: roomProperty,
          status: componentStatusSchema,
          limit: limitProperty,
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_components',
      description:
        'List individual hardware components with room, unit, type, status, and specifications. Use for questions about monitors, keyboards, RAM, storage, and other parts. Supports room, unit, type, status, and specification text filters.',
      parameters: {
        type: 'object',
        properties: {
          room: roomProperty,
          unit: unitProperty,
          type: componentTypeSchema,
          status: componentStatusSchema,
          query: {
            type: 'string',
            description: 'Text to search for in component specifications.',
          },
          limit: limitProperty,
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_inventory',
      description:
        'List spare-parts inventory with SKU, name, quantity, and reorder point. Use low_stock_only=true to show items at or below their reorder point.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Text to search for in inventory name or SKU.',
          },
          component_type: componentTypeSchema,
          low_stock_only: {
            type: 'boolean',
            default: false,
            description: 'Only return items at or below their reorder point.',
          },
          limit: limitProperty,
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_purchase_requests',
      description:
        'List purchase requests with status, date, items, and total value. Use status REQUESTED for pending requests.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: [...PurchaseRequestStatusEnum.options],
            description: 'Filter by purchase request status.',
          },
          limit: limitProperty,
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_applications',
      description:
        'List installed software applications with version, license type, unit, and room. Use for questions about software installed on lab computers.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Text to search for in the application name.',
          },
          room: roomProperty,
          unit: unitProperty,
          license_type: {
            type: 'string',
            enum: [...LicenseTypeEnum.options],
            description: 'Filter by software license type.',
          },
          limit: limitProperty,
        },
        additionalProperties: false,
      },
    },
  },
];

function truncate(value: string, length = 120): string {
  return value.length > length ? `${value.slice(0, length - 1)}...` : value;
}

function formatComponent(component: {
  type: string;
  status: string;
  specifications: string;
}) {
  return {
    type: component.type,
    status: component.status,
    specifications: truncate(component.specifications),
  };
}

async function getLabOverview() {
  const [
    totalRooms,
    totalUnits,
    totalComponents,
    functional,
    needsRepair,
    needsReplacement,
    lowStockRows,
    pendingRequests,
    statusByType,
  ] = await Promise.all([
    prisma.laboratoryRoom.count({ where: { deleted: false } }),
    prisma.computerUnit.count({ where: { deleted: false } }),
    prisma.computerComponent.count(),
    prisma.computerComponent.count({ where: { status: 'FUNCTIONAL' } }),
    prisma.computerComponent.count({ where: { status: 'NEEDS_REPAIR' } }),
    prisma.computerComponent.count({ where: { status: 'NEEDS_REPLACEMENT' } }),
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "InventoryItem"
      WHERE deleted = false AND quantity <= "reorder_point" AND "reorder_point" > 0
    `,
    prisma.purchaseRequest.count({
      where: { deleted: false, status: 'REQUESTED' },
    }),
    prisma.$queryRaw<Array<{ type: string; status: string; count: bigint }>>`
      SELECT type::text AS type, status::text AS status, COUNT(*)::bigint AS count
      FROM "ComputerComponent"
      GROUP BY type, status
      ORDER BY type, status
    `,
  ]);

  const byType = new Map<
    string,
    { type: string; total: number; needsRepair: number; needsReplacement: number }
  >();

  for (const row of statusByType) {
    const entry = byType.get(row.type) ?? {
      type: row.type,
      total: 0,
      needsRepair: 0,
      needsReplacement: 0,
    };
    const count = Number(row.count);

    entry.total += count;
    if (row.status === 'NEEDS_REPAIR') entry.needsRepair += count;
    if (row.status === 'NEEDS_REPLACEMENT') entry.needsReplacement += count;
    byType.set(row.type, entry);
  }

  return {
    totalRooms,
    totalUnits,
    totalComponents,
    componentsByStatus: {
      FUNCTIONAL: functional,
      NEEDS_REPAIR: needsRepair,
      NEEDS_REPLACEMENT: needsReplacement,
    },
    pendingPurchaseRequests: pendingRequests,
    lowStockItems: Number(lowStockRows[0]?.count ?? 0),
    componentTypes: [...byType.values()].sort((a, b) =>
      a.type.localeCompare(b.type),
    ),
  };
}

async function listRooms() {
  const rows = await prisma.$queryRaw<
    Array<{
      room: string;
      units: bigint;
      components: bigint;
      needs_repair: bigint;
      needs_replacement: bigint;
    }>
  >`
    SELECT
      r.name AS room,
      COUNT(DISTINCT u.id)::bigint AS units,
      COUNT(c.id)::bigint AS components,
      COUNT(c.id) FILTER (WHERE c.status = 'NEEDS_REPAIR')::bigint AS needs_repair,
      COUNT(c.id) FILTER (WHERE c.status = 'NEEDS_REPLACEMENT')::bigint AS needs_replacement
    FROM "LaboratoryRoom" r
    LEFT JOIN "ComputerUnit" u ON u.laboratory_room_id = r.id AND u.deleted = false
    LEFT JOIN "ComputerComponent" c ON c.computer_unit_id = u.id
    WHERE r.deleted = false
    GROUP BY r.name
    ORDER BY r.name
    LIMIT 50
  `;

  return {
    rooms: rows.map((row) => ({
      room: row.room,
      units: Number(row.units),
      components: Number(row.components),
      needsRepair: Number(row.needs_repair),
      needsReplacement: Number(row.needs_replacement),
    })),
  };
}

async function listUnits(args: z.infer<typeof ListUnitsArgs>) {
  const where: Prisma.ComputerUnitWhereInput = { deleted: false };

  if (args.room) {
    where.laboratory_room = {
      name: { contains: args.room, mode: 'insensitive' },
      deleted: false,
    };
  }
  if (args.status) {
    where.components = { some: { status: args.status } };
  }

  const units = await prisma.computerUnit.findMany({
    where,
    include: {
      laboratory_room: { select: { name: true } },
      components: {
        select: { type: true, status: true, specifications: true },
      },
    },
    orderBy: { unit_name: 'asc' },
    take: args.limit,
  });

  return {
    units: units.map((unit) => {
      const problemComponents = unit.components.filter(
        (component) => component.status !== 'FUNCTIONAL',
      );

      return {
        room: unit.laboratory_room.name,
        unit: unit.unit_name,
        components: unit.components.length,
        needsRepair: unit.components.filter(
          (component) => component.status === 'NEEDS_REPAIR',
        ).length,
        needsReplacement: unit.components.filter(
          (component) => component.status === 'NEEDS_REPLACEMENT',
        ).length,
        ...(problemComponents.length > 0
          ? {
              problemComponents: problemComponents
                .slice(0, 5)
                .map(formatComponent),
            }
          : {}),
      };
    }),
  };
}

async function listComponents(args: z.infer<typeof ListComponentsArgs>) {
  const where: Prisma.ComputerComponentWhereInput = {
    computer_unit: {
      deleted: false,
      ...(args.room
        ? {
            laboratory_room: {
              name: { contains: args.room, mode: 'insensitive' },
              deleted: false,
            },
          }
        : {}),
      ...(args.unit
        ? { unit_name: { contains: args.unit, mode: 'insensitive' } }
        : {}),
    },
  };

  if (args.type) where.type = args.type;
  if (args.status) where.status = args.status;
  if (args.query) {
    where.specifications = {
      contains: args.query,
      mode: 'insensitive',
    };
  }

  const components = await prisma.computerComponent.findMany({
    where,
    include: {
      computer_unit: {
        select: {
          unit_name: true,
          laboratory_room: { select: { name: true } },
        },
      },
    },
    orderBy: { updated_at: 'desc' },
    take: Math.min(args.limit * 3, 60),
  });

  const severity: Record<string, number> = {
    NEEDS_REPLACEMENT: 0,
    NEEDS_REPAIR: 1,
    FUNCTIONAL: 2,
  };

  components.sort(
    (a, b) => (severity[a.status] ?? 9) - (severity[b.status] ?? 9),
  );

  return {
    components: components.slice(0, args.limit).map((component) => ({
      ...formatComponent(component),
      room: component.computer_unit.laboratory_room.name,
      unit: component.computer_unit.unit_name,
    })),
  };
}

async function listInventory(args: z.infer<typeof ListInventoryArgs>) {
  const query = args.query ?? '';
  const componentType = args.component_type ?? '';

  const rows = await prisma.$queryRaw<
    Array<{
      sku: string;
      name: string;
      quantity: number;
      reorder_point: number;
      component_type: string | null;
    }>
  >`
    SELECT sku, name, quantity, "reorder_point", component_type::text AS component_type
    FROM "InventoryItem"
    WHERE deleted = false
      AND (${query}::text = '' OR name ILIKE ${`%${query}%`} OR sku ILIKE ${`%${query}%`})
      AND (${componentType}::text = '' OR component_type::text = ${componentType})
      AND (${args.low_stock_only}::boolean = false OR (quantity <= "reorder_point" AND "reorder_point" > 0))
    ORDER BY quantity ASC, name ASC
    LIMIT ${args.limit}
  `;

  return {
    items: rows.map((item) => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      reorderPoint: item.reorder_point,
      componentType: item.component_type,
      lowStock:
        item.quantity <= item.reorder_point && item.reorder_point > 0,
    })),
  };
}

async function listPurchaseRequests(
  args: z.infer<typeof ListPurchaseRequestsArgs>,
) {
  const requests = await prisma.purchaseRequest.findMany({
    where: {
      deleted: false,
      ...(args.status ? { status: args.status } : {}),
    },
    orderBy: { created_at: 'desc' },
    take: args.limit,
    include: {
      items: {
        select: { item_name: true, quantity: true, total: true },
      },
    },
  });

  return {
    purchaseRequests: requests.map((request) => ({
      prNumber: request.pr_number,
      status: request.status,
      createdAt: request.created_at.toISOString().slice(0, 10),
      itemCount: request.items.length,
      total: Number(
        request.items
          .reduce((sum, item) => sum + Number(item.total ?? 0), 0)
          .toFixed(2),
      ),
      items: request.items.slice(0, 10).map((item) => ({
        name: item.item_name,
        quantity: item.quantity,
        total: item.total === null ? null : Number(item.total),
      })),
    })),
  };
}

async function listApplications(
  args: z.infer<typeof ListApplicationsArgs>,
) {
  const where: Prisma.InstalledApplicationWhereInput = {
    computer_unit: {
      deleted: false,
      ...(args.room
        ? {
            laboratory_room: {
              name: { contains: args.room, mode: 'insensitive' },
              deleted: false,
            },
          }
        : {}),
      ...(args.unit
        ? { unit_name: { contains: args.unit, mode: 'insensitive' } }
        : {}),
    },
    ...(args.query
      ? { name: { contains: args.query, mode: 'insensitive' } }
      : {}),
    ...(args.license_type ? { license_type: args.license_type } : {}),
  };

  const applications = await prisma.installedApplication.findMany({
    where,
    include: {
      computer_unit: {
        select: {
          unit_name: true,
          laboratory_room: { select: { name: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
    take: args.limit,
  });

  return {
    applications: applications.map((application) => ({
      name: application.name,
      version: application.version,
      licenseType: application.license_type,
      room: application.computer_unit.laboratory_room.name,
      unit: application.computer_unit.unit_name,
    })),
  };
}

export async function executeAiTool(
  name: string,
  rawArguments: string,
): Promise<unknown> {
  let args: unknown;

  try {
    args = rawArguments.trim() ? JSON.parse(rawArguments) : {};
  } catch {
    return { error: 'Invalid tool arguments.' };
  }

  try {
    switch (name) {
      case 'get_lab_overview':
        OverviewArgs.parse(args);
        return await getLabOverview();
      case 'list_rooms':
        ListRoomsArgs.parse(args);
        return await listRooms();
      case 'list_units':
        return await listUnits(ListUnitsArgs.parse(args));
      case 'list_components':
        return await listComponents(ListComponentsArgs.parse(args));
      case 'list_inventory':
        return await listInventory(ListInventoryArgs.parse(args));
      case 'list_purchase_requests':
        return await listPurchaseRequests(
          ListPurchaseRequestsArgs.parse(args),
        );
      case 'list_applications':
        return await listApplications(ListApplicationsArgs.parse(args));
      default:
        return { error: `Unknown tool "${name}".` };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: 'Invalid tool arguments.',
        details: error.issues.map((issue) => issue.message),
      };
    }

    console.error(`AI tool "${name}" failed:`, error);
    return { error: 'The database query failed. Try a different search.' };
  }
}
