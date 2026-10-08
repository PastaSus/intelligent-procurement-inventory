import { describe, it, expect, vi } from 'vitest';
import { generatePRNumber } from '@/app/_actions/purchase-requests';

vi.mock('@/lib/prisma');
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  setMockRole: vi.fn(),
  resetMockRole: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const PR_NUMBER_REGEX = /^PR-\d{8}-[A-Z0-9]{4}$/;

describe('PR Number Format', () => {
  it('matches PR-YYYYMMDD-XXXX format', () => {
    const prNumber = generatePRNumber();
    expect(prNumber).toMatch(PR_NUMBER_REGEX);
  });

  it('contains current date components', () => {
    const prNumber = generatePRNumber();
    const datePart = prNumber.slice(3, 11);
    const today = new Date();
    const expected = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    expect(datePart).toBe(expected);
  });

  it('generates unique numbers on successive calls', () => {
    const numbers = new Set(Array.from({ length: 100 }, () => generatePRNumber()));
    expect(numbers.size).toBe(100);
  });

  it('random part is 4 uppercase alphanumeric characters', () => {
    const prNumber = generatePRNumber();
    const randomPart = prNumber.slice(12);
    expect(randomPart).toHaveLength(4);
    expect(randomPart).toMatch(/^[A-Z0-9]{4}$/);
  });
});
