import { describe, it, expect } from 'vitest';

type StatusInfo = {
  label: string;
  bgClass: string;
  textClass: string;
  barBgClass: string;
  barColorClass: string;
};

function getStatusDisplay(
  quantity: number,
  reorderPoint: number
): StatusInfo {
  if (quantity === 0) {
    return {
      label: 'CRITICAL',
      bgClass: 'bg-red-100',
      textClass: 'text-red-800',
      barBgClass: 'bg-red-200',
      barColorClass: 'bg-red-500',
    };
  }
  if (quantity <= reorderPoint) {
    return {
      label: 'LOW',
      bgClass: 'bg-yellow-100',
      textClass: 'text-yellow-800',
      barBgClass: 'bg-yellow-200',
      barColorClass: 'bg-yellow-500',
    };
  }
  return {
    label: 'OK',
    bgClass: 'bg-green-100',
    textClass: 'text-green-800',
    barBgClass: 'bg-green-200',
    barColorClass: 'bg-green-500',
  };
}

describe('Stock Status Badge', () => {
  it('shows OK with green colors when stock is healthy', () => {
    const status = getStatusDisplay(10, 5);
    expect(status.label).toBe('OK');
    expect(status.bgClass).toContain('green');
    expect(status.textClass).toContain('green');
  });

  it('shows LOW with yellow colors when stock is at reorder point', () => {
    const status = getStatusDisplay(5, 5);
    expect(status.label).toBe('LOW');
    expect(status.bgClass).toContain('yellow');
    expect(status.textClass).toContain('yellow');
  });

  it('shows LOW with yellow colors when stock is below reorder point', () => {
    const status = getStatusDisplay(3, 5);
    expect(status.label).toBe('LOW');
    expect(status.bgClass).toContain('yellow');
    expect(status.textClass).toContain('yellow');
  });

  it('shows CRITICAL with red colors when quantity is zero', () => {
    const status = getStatusDisplay(0, 5);
    expect(status.label).toBe('CRITICAL');
    expect(status.bgClass).toContain('red');
    expect(status.textClass).toContain('red');
  });

  it('calculates progress percentage correctly', () => {
    const percentage = (qty: number, rp: number) =>
      rp > 0 ? Math.min((qty / rp) * 100, 100) : 100;

    expect(percentage(10, 5)).toBe(100);
    expect(percentage(5, 10)).toBe(50);
    expect(percentage(0, 5)).toBe(0);
    expect(percentage(10, 0)).toBe(100);
  });
});
