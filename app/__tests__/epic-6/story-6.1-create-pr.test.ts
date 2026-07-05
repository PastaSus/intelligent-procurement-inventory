import { describe, it, expect } from 'vitest';

type PRStatus = 'DRAFT';

interface CreatePRInput {
  items: Array<{ item_name: string; quantity: number; unit_price?: number }>;
}

function createPR(input: CreatePRInput): { id: string; status: PRStatus; items: typeof input.items } {
  if (!input.items || input.items.length === 0) {
    throw new Error('Purchase request must have at least one item');
  }
  for (const item of input.items) {
    if (!item.item_name?.trim()) throw new Error('Item name is required');
    if (item.quantity < 1) throw new Error('Quantity must be at least 1');
  }
  return {
    id: `pr-${Date.now()}`,
    status: 'DRAFT',
    items: input.items,
  };
}

describe('Story 6.1: Create Purchase Request', () => {
  it('creates a PR with DRAFT status', () => {
    const pr = createPR({ items: [{ item_name: 'Keyboard', quantity: 5 }] });
    expect(pr.status).toBe('DRAFT');
    expect(pr.id).toBeTruthy();
  });

  it('rejects empty items list', () => {
    expect(() => createPR({ items: [] })).toThrow('at least one item');
  });

  it('rejects missing item name', () => {
    expect(() => createPR({ items: [{ item_name: '', quantity: 1 }] })).toThrow('Item name is required');
  });

  it('rejects zero quantity', () => {
    expect(() => createPR({ items: [{ item_name: 'Mouse', quantity: 0 }] })).toThrow('at least 1');
  });

  it('stores all provided items', () => {
    const items = [
      { item_name: 'Keyboard', quantity: 5 },
      { item_name: 'Mouse', quantity: 10, unit_price: 15.99 },
    ];
    const pr = createPR({ items });
    expect(pr.items).toHaveLength(2);
    expect(pr.items[1].unit_price).toBe(15.99);
  });
});
