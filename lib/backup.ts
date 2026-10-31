import { Prisma } from '@prisma/client';

export const BACKUP_APP = 'procurvin' as const;
export const BACKUP_FORMAT_VERSION = 1 as const;

/**
 * Tables included in a backup, in foreign-key-safe insert order.
 * Password reset tokens are intentionally excluded (see EXCLUDED_PRISMA_MODELS).
 */
export const BACKUP_TABLES = [
  'users',
  'laboratoryRooms',
  'computerUnits',
  'computerComponents',
  'installedApplications',
  'inventoryItems',
  'purchaseRequests',
  'requestItems',
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];

/** Backup table key -> Prisma model name (used for DMMF-driven type revival). */
export const BACKUP_TABLE_MODEL: Record<BackupTable, string> = {
  users: 'User',
  laboratoryRooms: 'LaboratoryRoom',
  computerUnits: 'ComputerUnit',
  computerComponents: 'ComputerComponent',
  installedApplications: 'InstalledApplication',
  inventoryItems: 'InventoryItem',
  purchaseRequests: 'PurchaseRequest',
  requestItems: 'RequestItem',
};

/** Backup table key -> Prisma client delegate name. */
export const BACKUP_TABLE_DELEGATE: Record<BackupTable, string> = {
  users: 'user',
  laboratoryRooms: 'laboratoryRoom',
  computerUnits: 'computerUnit',
  computerComponents: 'computerComponent',
  installedApplications: 'installedApplication',
  inventoryItems: 'inventoryItem',
  purchaseRequests: 'purchaseRequest',
  requestItems: 'requestItem',
};

/**
 * Prisma models deliberately left out of backups. Anything not covered here or
 * by BACKUP_TABLE_MODEL must be added on purpose (see the schema guard test).
 */
export const EXCLUDED_PRISMA_MODELS = ['PasswordResetToken'] as const;

export type BackupRow = Record<string, unknown>;

export interface BackupFile {
  app: typeof BACKUP_APP;
  format_version: typeof BACKUP_FORMAT_VERSION;
  created_at: string;
  counts: Record<BackupTable, number>;
  data: Record<BackupTable, BackupRow[]>;
}

export interface ParsedBackup {
  app: typeof BACKUP_APP;
  format_version: number;
  created_at: Date;
  counts: Record<BackupTable, number>;
  data: Record<BackupTable, BackupRow[]>;
}

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(`Invalid backup file: ${message}`);
    this.name = 'BackupValidationError';
  }
}

interface BackupTableReader {
  findMany(args?: { orderBy?: { id: 'asc' } }): Promise<BackupRow[]>;
}

interface BackupTransactionClient {
  [delegate: string]: BackupTableReader;
}

interface BackupDataSource {
  $transaction<T>(
    operation: (tx: BackupTransactionClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number },
  ): Promise<T>;
}

interface DmmfField {
  name: string;
  type: string;
}

interface DmmfModel {
  name: string;
  fields: DmmfField[];
}

/**
 * Reads every backed-up table inside a single transaction. Rows are returned
 * unfiltered so soft-deleted records are included.
 *
 * The client is accepted as `unknown` so this module stays framework-free and
 * can be used from both route handlers and standalone scripts.
 */
export async function buildBackup(source: unknown): Promise<BackupFile> {
  const client = source as BackupDataSource;

  const data = await client.$transaction(async (tx) => {
    const rowsByTable = {} as Record<BackupTable, BackupRow[]>;

    for (const table of BACKUP_TABLES) {
      const delegate = BACKUP_TABLE_DELEGATE[table];
      const reader = tx[delegate];
      if (!reader || typeof reader.findMany !== 'function') {
        throw new Error(`Backup failed: Prisma client is missing the "${delegate}" delegate`);
      }
      const rows = await reader.findMany({ orderBy: { id: 'asc' } });
      rowsByTable[table] = rows.map(serializeRow);
    }

    return rowsByTable;
  });

  const counts = {} as Record<BackupTable, number>;
  for (const table of BACKUP_TABLES) {
    counts[table] = data[table].length;
  }

  return {
    app: BACKUP_APP,
    format_version: BACKUP_FORMAT_VERSION,
    created_at: new Date().toISOString(),
    counts,
    data,
  };
}

/**
 * Validates a parsed JSON backup and revives dates and decimals into the types
 * Prisma expects. Throws BackupValidationError with a clear message otherwise.
 */
export function parseBackup(input: unknown): ParsedBackup {
  if (!isPlainObject(input)) {
    throw new BackupValidationError('expected a JSON object at the top level');
  }
  if (input.app !== BACKUP_APP) {
    throw new BackupValidationError(
      `expected app "${BACKUP_APP}", got ${JSON.stringify(input.app)}`,
    );
  }
  if (input.format_version !== BACKUP_FORMAT_VERSION) {
    throw new BackupValidationError(
      `unsupported format_version ${JSON.stringify(input.format_version)} (expected ${BACKUP_FORMAT_VERSION})`,
    );
  }
  if (typeof input.created_at !== 'string' || Number.isNaN(Date.parse(input.created_at))) {
    throw new BackupValidationError('created_at must be a valid ISO date string');
  }
  if (!isPlainObject(input.data)) {
    throw new BackupValidationError('missing "data" object');
  }
  if (!isPlainObject(input.counts)) {
    throw new BackupValidationError('missing "counts" object');
  }

  const data = {} as Record<BackupTable, BackupRow[]>;
  const counts = {} as Record<BackupTable, number>;

  for (const table of BACKUP_TABLES) {
    const rows = input.data[table];
    if (!Array.isArray(rows)) {
      throw new BackupValidationError(`missing table "${table}" in data`);
    }

    const declaredCount = input.counts[table];
    if (
      typeof declaredCount !== 'number' ||
      !Number.isInteger(declaredCount) ||
      declaredCount < 0
    ) {
      throw new BackupValidationError(`missing row count for table "${table}" in counts`);
    }
    if (declaredCount !== rows.length) {
      throw new BackupValidationError(
        `row count mismatch for "${table}": counts.${table} is ${declaredCount} but data.${table} has ${rows.length} rows`,
      );
    }

    const fieldTypes = fieldTypeIndex(table);
    data[table] = rows.map((row, index) => {
      if (!isPlainObject(row)) {
        throw new BackupValidationError(`row ${index} in "${table}" is not an object`);
      }
      return reviveRow(row, fieldTypes);
    });
    counts[table] = declaredCount;
  }

  return {
    app: BACKUP_APP,
    format_version: BACKUP_FORMAT_VERSION,
    created_at: new Date(input.created_at),
    counts,
    data,
  };
}

/** Prisma model names present in the generated client (drives the guard test). */
export function getPrismaModelNames(): string[] {
  return dmmfModels().map((model) => model.name);
}

function dmmfModels(): DmmfModel[] {
  const prisma = Prisma as unknown as { dmmf?: { datamodel?: { models: DmmfModel[] } } };
  return prisma.dmmf?.datamodel?.models ?? [];
}

function fieldTypeIndex(table: BackupTable): Map<string, string> {
  const modelName = BACKUP_TABLE_MODEL[table];
  const model = dmmfModels().find((candidate) => candidate.name === modelName);
  return new Map((model?.fields ?? []).map((field) => [field.name, field.type]));
}

function reviveRow(row: BackupRow, fieldTypes: Map<string, string>): BackupRow {
  const revived: BackupRow = { ...row };

  for (const [field, value] of Object.entries(row)) {
    if (value === null) {
      continue;
    }

    const type = fieldTypes.get(field);
    if (type === 'DateTime') {
      if (value instanceof Date) {
        continue;
      }
      if (typeof value !== 'string') {
        throw new BackupValidationError(`field "${field}" must be an ISO date string`);
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new BackupValidationError(`field "${field}" contains an invalid date: ${value}`);
      }
      revived[field] = date;
    } else if (type === 'Decimal') {
      if (Prisma.Decimal.isDecimal(value)) {
        continue;
      }
      try {
        revived[field] = new Prisma.Decimal(value as string | number);
      } catch {
        throw new BackupValidationError(
          `field "${field}" contains an invalid decimal: ${String(value)}`,
        );
      }
    }
  }

  return revived;
}

function serializeRow(row: BackupRow): BackupRow {
  const serialized: BackupRow = {};
  for (const [key, value] of Object.entries(row)) {
    serialized[key] = serializeValue(value);
  }
  return serialized;
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Prisma.Decimal.isDecimal(value)) {
    return value.toString();
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
