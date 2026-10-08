import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  createPurchaseRequest, submitPurchaseRequest,
  approvePurchaseRequest, rejectPurchaseRequest, fulfillPurchaseRequest,
} from '@/app/_actions/purchase-requests';
import { createPurchaseRequest as factoryPR, resetCounter } from '@/app/__tests__/factories';

vi.mock('@/lib/prisma');
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn().mockResolvedValue({ userId: 'admin-001', email: 'admin@example.com', role: 'ADMIN' }),
  setMockRole: vi.fn(),
  resetMockRole: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

async function defaultSession() {
  const { getSession } = await import('@/lib/auth');
  vi.mocked(getSession).mockResolvedValue({ userId: 'admin-001', email: 'admin@example.com', role: 'ADMIN' });
}

async function noSession() {
  const { getSession } = await import('@/lib/auth');
  vi.mocked(getSession).mockResolvedValue(null);
}

async function techSession() {
  const { getSession } = await import('@/lib/auth');
  vi.mocked(getSession).mockResolvedValue({ userId: 'tech-001', email: 'tech@example.com', role: 'TECHNICIAN' });
}

function makePRForm(items: Array<{ itemName: string; quantity: number; unitPrice?: number; inventoryItemId?: string }>, notes?: string): FormData {
  const fd = new FormData();
  fd.set('items', JSON.stringify(items));
  if (notes) fd.set('notes', notes);
  return fd;
}

describe('createPurchaseRequest', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = makePRForm([{ itemName: 'Mouse', quantity: 10 }]);
    const result = await createPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error for invalid items JSON', async () => {
    const fd = new FormData();
    fd.set('items', 'not-json');
    const result = await createPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid');
  });

  it('returns error for empty items array', async () => {
    const fd = makePRForm([]);
    const result = await createPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });

  it('creates purchase request successfully', async () => {
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(null);
    const mockPR = factoryPR({ status: 'DRAFT' });
    vi.mocked(prisma.purchaseRequest.create).mockResolvedValue(mockPR);

    const fd = makePRForm([{ itemName: 'Mouse', quantity: 10 }], 'Urgent');
    const result = await createPurchaseRequest(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockPR);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('stores inventoryItemId when a stock part is linked', async () => {
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([{ id: 'inv-1' }] as any);
    const mockPR = factoryPR({ status: 'DRAFT' });
    vi.mocked(prisma.purchaseRequest.create).mockResolvedValue(mockPR);

    const fd = makePRForm([{ itemName: 'Mouse', quantity: 10, inventoryItemId: 'inv-1' }]);
    const result = await createPurchaseRequest(fd);

    expect(result.success).toBe(true);
    const createArg = vi.mocked(prisma.purchaseRequest.create).mock.calls[0][0] as any;
    expect(createArg.data.items.create[0].inventory_item_id).toBe('inv-1');
    expect(createArg.data.items.create[0].item_name).toBe('Mouse');
  });

  it('rejects unknown stock part references with zero DB change', async () => {
    vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([]);

    const fd = makePRForm([{ itemName: 'Mouse', quantity: 10, inventoryItemId: 'inv-gone' }]);
    const result = await createPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('no longer exist');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('retries PR number on collision', async () => {
    const collided = factoryPR({ pr_number: 'PR-20260705-ABCD' });
    vi.mocked(prisma.purchaseRequest.findUnique)
      .mockResolvedValueOnce(collided)
      .mockResolvedValueOnce(null);
    const mockPR = factoryPR({ status: 'DRAFT' });
    vi.mocked(prisma.purchaseRequest.create).mockResolvedValue(mockPR);

    const fd = makePRForm([{ itemName: 'Keyboard', quantity: 5 }]);
    const result = await createPurchaseRequest(fd);

    expect(result.success).toBe(true);
    expect(prisma.purchaseRequest.findUnique).toHaveBeenCalledTimes(2);
  });

  it('returns error when PR number generation exhausted', async () => {
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(factoryPR());

    const fd = makePRForm([{ itemName: 'Mouse', quantity: 10 }]);
    const result = await createPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('unique');
  });

  it('denies TECHNICIAN create with zero DB change', async () => {
    await techSession();

    const fd = makePRForm([{ itemName: 'Mouse', quantity: 10 }]);
    const result = await createPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('administrators');
    expect(prisma.$transaction).not.toHaveBeenCalled();

    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(null);
    const recheck = await prisma.purchaseRequest.findUnique({ where: { id: 'pr-tech' } });
    expect(recheck).toBeNull();
  });
});

describe('submitPurchaseRequest', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await submitPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when PR not found', async () => {
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await submitPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error when PR is not in DRAFT status', async () => {
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(factoryPR({ id: 'pr-1', status: 'REQUESTED' }) as any);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await submitPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('draft');
  });

  it('submits DRAFT PR successfully', async () => {
    const draft = factoryPR({ id: 'pr-1', status: 'DRAFT' });
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(draft as any);
    const submitted = { ...draft, status: 'REQUESTED' };
    vi.mocked(prisma.purchaseRequest.update).mockResolvedValue(submitted as any);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await submitPurchaseRequest(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(submitted);
  });

  it('denies TECHNICIAN submit with zero DB change', async () => {
    await techSession();
    const draft = factoryPR({ id: 'pr-1', status: 'DRAFT' });
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(draft as any);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await submitPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('administrators');
    expect(prisma.purchaseRequest.update).not.toHaveBeenCalled();

    const recheck = await prisma.purchaseRequest.findUnique({ where: { id: 'pr-1' } });
    expect(recheck?.status).toBe('DRAFT');
  });
});

describe('approvePurchaseRequest', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await approvePurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when user is not ADMIN', async () => {
    const { getSession } = await import('@/lib/auth');
    vi.mocked(getSession).mockResolvedValue({ userId: 'tech-001', email: 'tech@example.com', role: 'TECHNICIAN' });

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await approvePurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('administrators');
  });

  it('returns error when PR not found', async () => {
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await approvePurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error when PR is not REQUESTED', async () => {
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(factoryPR({ id: 'pr-1', status: 'APPROVED' }) as any);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await approvePurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('requested');
  });

  it('approves REQUESTED PR', async () => {
    const requested = factoryPR({ id: 'pr-1', status: 'REQUESTED' });
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(requested as any);
    const approved = { ...requested, status: 'APPROVED' };
    vi.mocked(prisma.purchaseRequest.update).mockResolvedValue(approved as any);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await approvePurchaseRequest(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(approved);
  });
});

describe('rejectPurchaseRequest', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('id', 'pr-1');
    fd.set('reason', 'Budget constraints');
    const result = await rejectPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when user is not ADMIN', async () => {
    const { getSession } = await import('@/lib/auth');
    vi.mocked(getSession).mockResolvedValue({ userId: 'tech-001', email: 'tech@example.com', role: 'TECHNICIAN' });

    const fd = new FormData();
    fd.set('id', 'pr-1');
    fd.set('reason', 'Budget constraints');
    const result = await rejectPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('administrators');
  });

  it('returns error when reason is missing', async () => {
    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await rejectPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects REQUESTED PR successfully', async () => {
    const requested = factoryPR({ id: 'pr-1', status: 'REQUESTED', notes: null });
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(requested as any);
    const rejected = { ...requested, status: 'REJECTED', notes: 'REJECTED: Budget constraints' };
    vi.mocked(prisma.purchaseRequest.update).mockResolvedValue(rejected as any);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    fd.set('reason', 'Budget constraints');
    const result = await rejectPurchaseRequest(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(rejected);
  });

  it('appends rejection reason to existing notes', async () => {
    const requested = factoryPR({ id: 'pr-1', status: 'REQUESTED', notes: 'Original note' });
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(requested as any);
    const rejected = { ...requested, status: 'REJECTED', notes: 'Original note\nREJECTED: Duplicate request' };
    vi.mocked(prisma.purchaseRequest.update).mockResolvedValue(rejected as any);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    fd.set('reason', 'Duplicate request');
    const result = await rejectPurchaseRequest(fd);

    expect(result.success).toBe(true);
  });
});

describe('fulfillPurchaseRequest', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetCounter();
    await defaultSession();
  });

  it('returns error when not authenticated', async () => {
    await noSession();

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await fulfillPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('logged in');
  });

  it('returns error when PR not found', async () => {
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(null);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await fulfillPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error when PR is not APPROVED', async () => {
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(factoryPR({ id: 'pr-1', status: 'REQUESTED' }) as any);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await fulfillPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('approved');
  });

  it('fulfills APPROVED PR and increments inventory', async () => {
    const approved = factoryPR({ id: 'pr-1', status: 'APPROVED' });
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(approved as any);
    const fulfilled = { ...approved, status: 'FULFILLED' };
    vi.mocked(prisma.purchaseRequest.update).mockResolvedValue(fulfilled as any);

    vi.mocked(prisma.requestItem.findMany).mockResolvedValue([
      { id: 'ri-1', purchase_request_id: 'pr-1', item_name: 'Mouse', quantity: 10, inventory_item_id: null },
    ] as any);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await fulfillPurchaseRequest(fd);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(fulfilled);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.inventoryItem.updateMany).toHaveBeenCalled();
    expect(prisma.inventoryItem.update).not.toHaveBeenCalled();
  });

  it('fulfills linked items by exact id without fuzzy name match', async () => {
    const approved = factoryPR({ id: 'pr-1', status: 'APPROVED' });
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(approved as any);
    const fulfilled = { ...approved, status: 'FULFILLED' };
    vi.mocked(prisma.purchaseRequest.update).mockResolvedValue(fulfilled as any);

    vi.mocked(prisma.requestItem.findMany).mockResolvedValue([
      { id: 'ri-1', purchase_request_id: 'pr-1', item_name: 'Mouse', quantity: 10, inventory_item_id: 'inv-1' },
    ] as any);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await fulfillPurchaseRequest(fd);

    expect(result.success).toBe(true);
    expect(prisma.inventoryItem.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { quantity: { increment: 10 } },
    });
    expect(prisma.inventoryItem.updateMany).not.toHaveBeenCalled();
  });

  it('denies TECHNICIAN fulfill with zero DB change', async () => {
    await techSession();
    const approved = factoryPR({ id: 'pr-1', status: 'APPROVED' });
    vi.mocked(prisma.purchaseRequest.findUnique).mockResolvedValue(approved as any);

    const fd = new FormData();
    fd.set('id', 'pr-1');
    const result = await fulfillPurchaseRequest(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('administrators');
    expect(prisma.$transaction).not.toHaveBeenCalled();

    const recheck = await prisma.purchaseRequest.findUnique({ where: { id: 'pr-1' } });
    expect(recheck?.status).toBe('APPROVED');
  });
});
