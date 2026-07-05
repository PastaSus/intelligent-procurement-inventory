import { describe, it, expect } from 'vitest';

type PRStatus = 'DRAFT' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'FULFILLED';

interface FulfillResult {
  status: PRStatus;
  inventoryDelta?: Record<string, number>;
  error?: string;
}

function fulfillRequest(
  currentStatus: PRStatus,
  inventoryItems: Array<{ id: string; quantity: number }>
): FulfillResult {
  if (currentStatus !== 'APPROVED') {
    return { status: currentStatus, error: `Cannot fulfill a ${currentStatus} request` };
  }
  const delta: Record<string, number> = {};
  for (const item of inventoryItems) {
    delta[item.id] = item.quantity;
  }
  return { status: 'FULFILLED', inventoryDelta: delta };
}

describe('Story 6.5: Fulfill Purchase Request', () => {
  it('transitions APPROVED to FULFILLED', () => {
    const result = fulfillRequest('APPROVED', []);
    expect(result.status).toBe('FULFILLED');
  });

  it('increments inventory quantities', () => {
    const inventory = [
      { id: 'inv-1', quantity: 5 },
      { id: 'inv-2', quantity: 3 },
    ];
    const result = fulfillRequest('APPROVED', inventory);
    expect(result.inventoryDelta).toEqual({ 'inv-1': 5, 'inv-2': 3 });
  });

  it('rejects fulfill from DRAFT', () => {
    const result = fulfillRequest('DRAFT', []);
    expect(result.error).toContain('Cannot fulfill a DRAFT');
  });

  it('rejects fulfill from REQUESTED', () => {
    const result = fulfillRequest('REQUESTED', []);
    expect(result.error).toContain('Cannot fulfill a REQUESTED');
  });

  it('rejects fulfill from REJECTED', () => {
    const result = fulfillRequest('REJECTED', []);
    expect(result.error).toContain('Cannot fulfill a REJECTED');
  });

  it('rejects fulfill from FULFILLED (already done)', () => {
    const result = fulfillRequest('FULFILLED', []);
    expect(result.error).toContain('Cannot fulfill a FULFILLED');
  });

  it('returns empty delta for PR with no inventory items', () => {
    const result = fulfillRequest('APPROVED', []);
    expect(result.inventoryDelta).toEqual({});
  });
});
