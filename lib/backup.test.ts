import { describe, it, expect, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import {
  BACKUP_APP,
  BACKUP_FORMAT_VERSION,
  BACKUP_TABLES,
  BACKUP_TABLE_DELEGATE,
  BACKUP_TABLE_MODEL,
  BackupValidationError,
  buildBackup,
  getPrismaModelNames,
  parseBackup,
  EXCLUDED_PRISMA_MODELS,
  type BackupFile,
} from './backup';

type Rows = Record<string, Record<string, unknown>[]>;

function fakeSource(rows: Rows = {}) {
  const delegates = Object.fromEntries(
    Object.entries(BACKUP_TABLE_DELEGATE).map(([table, delegate]) => [
      delegate,
      { findMany: vi.fn(async () => rows[table] ?? []) },
    ]),
  );

  const source = {
    $transaction: vi.fn(async (operation: (tx: unknown) => Promise<unknown>) =>
      operation(delegates),
    ),
  };

  return { source, delegates };
}

const deletedUser = {
  id: 'user-1',
  email: 'admin@example.com',
  password_hash: 'hashed-password',
  role: 'ADMIN',
  created_at: new Date('2026-01-02T03:04:05.000Z'),
  updated_at: new Date('2026-01-02T03:04:05.000Z'),
  created_by: null,
  updated_by: null,
  deleted: true,
};

const requestItem = {
  id: 'item-1',
  purchase_request_id: 'pr-1',
  inventory_item_id: null,
  item_name: 'Mouse',
  quantity: 2,
  unit_price: new Prisma.Decimal('10.50'),
  total: new Prisma.Decimal('21.00'),
  created_at: new Date('2026-02-03T04:05:06.000Z'),
  updated_at: new Date('2026-02-03T04:05:06.000Z'),
};

function validBackup(overrides: Partial<BackupFile> = {}): BackupFile {
  const data = Object.fromEntries(
    BACKUP_TABLES.map((table) => [table, []]),
  ) as unknown as BackupFile['data'];
  data.users = [{ ...deletedUser }] as never;
  data.requestItems = [{ ...requestItem }] as never;

  const counts = Object.fromEntries(
    BACKUP_TABLES.map((table) => [table, data[table].length]),
  ) as BackupFile['counts'];

  return {
    app: BACKUP_APP,
    format_version: BACKUP_FORMAT_VERSION,
    created_at: '2026-03-04T05:06:07.000Z',
    counts,
    data,
    ...overrides,
  };
}

describe('buildBackup', () => {
  it('reads all tables in one transaction and serializes dates and decimals', async () => {
    const { source } = fakeSource({ users: [deletedUser], requestItems: [requestItem] });

    const backup = await buildBackup(source);

    expect(source.$transaction).toHaveBeenCalledTimes(1);
    expect(backup.app).toBe('procurvin');
    expect(backup.format_version).toBe(1);
    expect(Number.isNaN(Date.parse(backup.created_at))).toBe(false);
    expect(backup.counts.users).toBe(1);
    expect(backup.counts.requestItems).toBe(1);
    expect(Object.keys(backup.data).sort()).toEqual([...BACKUP_TABLES].sort());

    const user = backup.data.users[0];
    expect(user.created_at).toBe('2026-01-02T03:04:05.000Z');
    expect(user.deleted).toBe(true);

    const item = backup.data.requestItems[0];
    expect(item.unit_price).toBe('10.5');
    expect(item.total).toBe('21');
    expect(item.created_at).toBe('2026-02-03T04:05:06.000Z');
  });

  it('includes soft-deleted rows and excludes password reset tokens', async () => {
    const { source, delegates } = fakeSource({ users: [deletedUser] });

    const backup = await buildBackup(source);

    expect(backup.data.users).toHaveLength(1);
    expect((backup.data.users[0] as { deleted: boolean }).deleted).toBe(true);
    expect(backup.data).not.toHaveProperty('passwordResetTokens');
    expect(backup.counts).not.toHaveProperty('passwordResetTokens');
    expect(delegates).not.toHaveProperty('passwordResetToken');
  });
});

describe('parseBackup', () => {
  it('round-trips a serialized backup, reviving dates and decimals', async () => {
    const { source } = fakeSource({ users: [deletedUser], requestItems: [requestItem] });
    const backup = await buildBackup(source);

    const parsed = parseBackup(JSON.parse(JSON.stringify(backup)));

    expect(parsed.app).toBe('procurvin');
    expect(parsed.format_version).toBe(1);
    expect(parsed.created_at).toBeInstanceOf(Date);
    expect(parsed.created_at.toISOString()).toBe(backup.created_at);

    const user = parsed.data.users[0];
    expect(user.created_at).toBeInstanceOf(Date);
    expect((user.created_at as Date).toISOString()).toBe('2026-01-02T03:04:05.000Z');
    expect(user.deleted).toBe(true);

    const item = parsed.data.requestItems[0];
    expect(item.created_at).toBeInstanceOf(Date);
    expect(item.unit_price).toBeInstanceOf(Prisma.Decimal);
    expect((item.unit_price as Prisma.Decimal).toFixed(2)).toBe('10.50');
    expect((item.total as Prisma.Decimal).toFixed(2)).toBe('21.00');
    expect(parsed.counts).toEqual(backup.counts);
  });

  it('accepts a hand-written valid backup', () => {
    const parsed = parseBackup(validBackup());

    expect(parsed.data.users[0].email).toBe('admin@example.com');
    expect(parsed.data.users[0].created_at).toBeInstanceOf(Date);
  });

  it.each([
    ['a non-object', null, 'expected a JSON object'],
    ['a wrong app name', { ...validBackup(), app: 'other' }, 'expected app "procurvin"'],
    ['an unsupported format version', { ...validBackup(), format_version: 2 }, 'unsupported format_version'],
    ['a missing table', { ...validBackup(), data: {} }, 'missing table'],
    ['a missing count', { ...validBackup(), counts: {} }, 'missing row count'],
    [
      'a count mismatch',
      (() => {
        const backup = validBackup();
        backup.counts.users = 5;
        return backup;
      })(),
      'row count mismatch',
    ],
    [
      'an invalid date',
      (() => {
        const backup = validBackup();
        backup.data.users[0].created_at = 'not-a-date';
        return backup;
      })(),
      'invalid date',
    ],
    [
      'an invalid decimal',
      (() => {
        const backup = validBackup();
        backup.data.requestItems[0].unit_price = 'not-a-number';
        return backup;
      })(),
      'invalid decimal',
    ],
  ])('rejects %s', (label, input, message) => {
    expect(() => parseBackup(input)).toThrow(BackupValidationError);
    expect(() => parseBackup(input)).toThrow(message);
  });
});

describe('schema guard', () => {
  it('backs up every Prisma model or lists it as an explicit exclusion', () => {
    const modelNames = getPrismaModelNames();
    expect(modelNames.length).toBeGreaterThan(0);

    const covered = new Set(Object.values(BACKUP_TABLE_MODEL));
    const excluded = new Set<string>(EXCLUDED_PRISMA_MODELS);
    const uncovered = modelNames.filter((name) => !covered.has(name) && !excluded.has(name));

    expect(uncovered).toEqual([]);
  });

  it('only excludes models that actually exist in the Prisma client', () => {
    const modelNames = new Set(getPrismaModelNames());
    for (const model of EXCLUDED_PRISMA_MODELS) {
      expect(modelNames.has(model)).toBe(true);
    }
  });
});
