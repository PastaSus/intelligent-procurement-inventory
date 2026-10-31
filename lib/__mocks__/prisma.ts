import { vi } from 'vitest';

const laboratoryRoom = { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() };
const computerUnit = { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn(), createMany: vi.fn() };
const computerComponent = { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn(), updateMany: vi.fn(), groupBy: vi.fn() };
const inventoryItem = { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() };
const purchaseRequest = { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() };
const requestItem = { findMany: vi.fn(), create: vi.fn(), deleteMany: vi.fn() };
const installedApplication = { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() };
const user = { findMany: vi.fn(), deleteMany: vi.fn() };
const passwordResetToken = { findMany: vi.fn(), deleteMany: vi.fn() };

const txModels = { laboratoryRoom, computerUnit, computerComponent, inventoryItem, purchaseRequest, requestItem, installedApplication, user, passwordResetToken };

export const prisma = {
  ...txModels,
  $transaction: vi.fn((fn: (tx: typeof txModels) => unknown) => fn(txModels)),
};
