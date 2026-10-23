import { describe, it, expect } from 'vitest';
import { buildReplenishmentRows, calculateNetShortage } from '@/lib/spare-parts';

describe('spare parts net shortage', () => {
  it('subtracts available spares from replacement demand', () => {
    expect(calculateNetShortage(7, 5)).toBe(2);
    expect(calculateNetShortage(5, 2)).toBe(3);
  });

  it('never returns a negative request quantity', () => {
    expect(calculateNetShortage(2, 5)).toBe(0);
    expect(calculateNetShortage(5, 5)).toBe(0);
    expect(calculateNetShortage(0, 10)).toBe(0);
  });

  it('builds a request list containing only net shortages, sorted largest first', () => {
    const rows = [
      { type: 'KEYBOARD', label: 'KEYBOARD', forReplacement: 7, spareQty: 5 },
      { type: 'MOUSE', label: 'MOUSE', forReplacement: 2, spareQty: 5 },
      { type: 'MONITOR', label: 'MONITOR', forReplacement: 5, spareQty: 2 },
    ];

    expect(buildReplenishmentRows(rows)).toEqual([
      { type: 'MONITOR', label: 'MONITOR', forReplacement: 5, spareQty: 2, netShortage: 3 },
      { type: 'KEYBOARD', label: 'KEYBOARD', forReplacement: 7, spareQty: 5, netShortage: 2 },
    ]);
  });
});
