import { describe, it, expect } from 'vitest';
import { buildUnitNames } from '@/lib/unit-batch';

describe('buildUnitNames', () => {
  it('generates zero-padded sequential unit names', () => {
    expect(buildUnitNames({ prefix: 'MM3', startNumber: 26, count: 5 })).toEqual([
      'MM326',
      'MM327',
      'MM328',
      'MM329',
      'MM330',
    ]);
  });

  it('generates a single unit', () => {
    expect(buildUnitNames({ prefix: 'LR4U', startNumber: 1, count: 1 })).toEqual(['LR4U01']);
  });

  it('respects custom padding', () => {
    expect(buildUnitNames({ prefix: 'PC-', startNumber: 7, count: 2, padding: 4 })).toEqual([
      'PC-0007',
      'PC-0008',
    ]);
  });

  it('does not truncate numbers wider than the padding', () => {
    expect(buildUnitNames({ prefix: 'U', startNumber: 99, count: 2 })).toEqual(['U99', 'U100']);
  });
});
