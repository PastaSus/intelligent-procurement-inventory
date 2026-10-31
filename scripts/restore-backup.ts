import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import type { Prisma, PrismaClient } from '@prisma/client';
import {
  BACKUP_TABLES,
  parseBackup,
  type BackupRow,
  type BackupTable,
  type ParsedBackup,
} from '../lib/backup';

interface RestoreOptions {
  file: string;
  dryRun: boolean;
  yes: boolean;
}

function parseArgs(argv: string[]): RestoreOptions {
  let file: string | undefined;
  let dryRun = false;
  let yes = false;

  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--yes') {
      yes = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (file) {
      throw new Error(`Only one backup file may be provided (got "${file}" and "${arg}")`);
    } else {
      file = arg;
    }
  }

  if (!file) {
    throw new Error('Usage: pnpm restore:backup <file> [--dry-run] [--yes]');
  }

  return { file, dryRun, yes };
}

function printCounts(backup: ParsedBackup) {
  const width = Math.max(...BACKUP_TABLES.map((table) => table.length));
  let total = 0;

  console.log('Backup contents:');
  for (const table of BACKUP_TABLES) {
    const count = backup.counts[table];
    total += count;
    console.log(`  ${table.padEnd(width)}  ${count}`);
  }
  console.log(`  ${'TOTAL'.padEnd(width)}  ${total}`);
  console.log(`  created_at: ${backup.created_at.toISOString()}`);
}

function describeDatabase(databaseUrl: string): { host: string; name: string } {
  try {
    const url = new URL(databaseUrl);
    const name = decodeURIComponent(url.pathname.replace(/^\//, '')) || '(default)';
    return { host: url.hostname || '(unknown host)', name };
  } catch {
    return { host: '(unparseable DATABASE_URL)', name: '(unknown)' };
  }
}

async function confirmRestore(target: { host: string; name: string }): Promise<boolean> {
  const rl = createInterface({ input, output });

  try {
    console.log('');
    console.log(`Target database: ${target.name} on ${target.host}`);
    console.log(
      'This will DELETE all existing rows in the app tables and replace them with the backup.',
    );
    const answer = await rl.question('Type RESTORE to continue: ');
    return answer.trim() === 'RESTORE';
  } finally {
    rl.close();
  }
}

async function insertRows(
  tx: Prisma.TransactionClient,
  table: BackupTable,
  rows: BackupRow[],
): Promise<void> {
  switch (table) {
    case 'users':
      await tx.user.createMany({ data: rows as unknown as Prisma.UserCreateManyInput[] });
      break;
    case 'laboratoryRooms':
      await tx.laboratoryRoom.createMany({
        data: rows as unknown as Prisma.LaboratoryRoomCreateManyInput[],
      });
      break;
    case 'computerUnits':
      await tx.computerUnit.createMany({
        data: rows as unknown as Prisma.ComputerUnitCreateManyInput[],
      });
      break;
    case 'computerComponents':
      await tx.computerComponent.createMany({
        data: rows as unknown as Prisma.ComputerComponentCreateManyInput[],
      });
      break;
    case 'installedApplications':
      await tx.installedApplication.createMany({
        data: rows as unknown as Prisma.InstalledApplicationCreateManyInput[],
      });
      break;
    case 'inventoryItems':
      await tx.inventoryItem.createMany({
        data: rows as unknown as Prisma.InventoryItemCreateManyInput[],
      });
      break;
    case 'purchaseRequests':
      await tx.purchaseRequest.createMany({
        data: rows as unknown as Prisma.PurchaseRequestCreateManyInput[],
      });
      break;
    case 'requestItems':
      await tx.requestItem.createMany({
        data: rows as unknown as Prisma.RequestItemCreateManyInput[],
      });
      break;
  }
}

async function restore(prisma: PrismaClient, backup: ParsedBackup): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      // Delete in reverse foreign-key order, then insert in BACKUP_TABLES order.
      await tx.requestItem.deleteMany();
      await tx.purchaseRequest.deleteMany();
      await tx.installedApplication.deleteMany();
      await tx.computerComponent.deleteMany();
      await tx.computerUnit.deleteMany();
      await tx.laboratoryRoom.deleteMany();
      await tx.inventoryItem.deleteMany();
      await tx.passwordResetToken.deleteMany();
      await tx.user.deleteMany();

      for (const table of BACKUP_TABLES) {
        const rows = backup.data[table];
        if (rows.length === 0) {
          continue;
        }
        await insertRows(tx, table, rows);
      }
    },
    { timeout: 120_000, maxWait: 15_000 },
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(options.file, 'utf8'));
  } catch (error) {
    throw new Error(
      `Could not read backup file "${options.file}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const backup = parseBackup(raw);
  printCounts(backup);

  if (options.dryRun) {
    console.log('');
    console.log('Dry run: no database changes were made.');
    return;
  }

  const { PrismaClient } = await import('@prisma/client');
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Point it at the target database and try again.');
  }

  const target = describeDatabase(databaseUrl);
  console.log('');
  console.log(`Target database: ${target.name} on ${target.host}`);

  if (!options.yes) {
    const confirmed = await confirmRestore(target);
    if (!confirmed) {
      console.log('Restore cancelled. No database changes were made.');
      return;
    }
  }

  const prisma = new PrismaClient();

  try {
    await restore(prisma, backup);
    console.log('');
    console.log('Restore complete.');
    for (const table of BACKUP_TABLES) {
      console.log(`  ${table}: ${backup.counts[table]} rows`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
