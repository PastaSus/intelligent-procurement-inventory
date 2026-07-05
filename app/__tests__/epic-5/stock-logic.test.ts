import { describe, it, expect } from 'vitest';

type StockStatus = 'ok' | 'low' | 'critical';

function getStockStatus(quantity: number, reorderPoint: number): StockStatus {
  if (quantity === 0) return 'critical';
  if (quantity <= reorderPoint) return 'low';
  return 'ok';
}

function isLowStock(quantity: number, reorderPoint: number): boolean {
  return quantity <= reorderPoint;
}

function isCritical(quantity: number): boolean {
  return quantity === 0;
}

describe('Stock Logic', () => {
  describe('getStockStatus', () => {
    it('returns "ok" when quantity exceeds reorder point', () => {
      expect(getStockStatus(10, 5)).toBe('ok');
    });

    it('returns "low" when quantity equals reorder point', () => {
      expect(getStockStatus(5, 5)).toBe('low');
    });

    it('returns "low" when quantity is below reorder point but above zero', () => {
      expect(getStockStatus(3, 5)).toBe('low');
    });

    it('returns "critical" when quantity is zero', () => {
      expect(getStockStatus(0, 5)).toBe('critical');
    });

    it('returns "ok" when reorder point is zero and quantity > 0', () => {
      expect(getStockStatus(10, 0)).toBe('ok');
    });
  });

  describe('isLowStock', () => {
    it('uses <= comparison (not <)', () => {
      expect(isLowStock(5, 5)).toBe(true);
      expect(isLowStock(4, 5)).toBe(true);
      expect(isLowStock(6, 5)).toBe(false);
    });
  });

  describe('isCritical', () => {
    it('returns true only for zero quantity', () => {
      expect(isCritical(0)).toBe(true);
      expect(isCritical(1)).toBe(false);
      expect(isCritical(-1)).toBe(false);
    });
  });
});
