import { vi } from 'vitest';

const laboratoryRoom = { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() };
const computerUnit = { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn() };
const computerComponent = { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn() };
const inventoryItem = { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findMany: vi.fn() };
const purchaseRequest = { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() };
const requestItem = { findMany: vi.fn(), create: vi.fn() };
const installedApplication = { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() };

const txModels = { laboratoryRoom, computerUnit, computerComponent, inventoryItem, purchaseRequest, requestItem, installedApplication };

export const prisma = {
  ...txModels,
  $transaction: vi.fn((fn: any) => fn(txModels)),
};
