import { describe, it, expect } from 'vitest';

const PR_NUMBER_REGEX = /^PR-\d{8}-[A-Z0-9]{6}$/;

function generatePRNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Array.from({ length: 6 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
  ).join('');
  return `PR-${y}${m}${d}-${rand}`;
}

describe('PR Number Format', () => {
  it('matches PR-YYYYMMDD-RRRRRR format', () => {
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

  it('random part is 6 uppercase alphanumeric characters', () => {
    const prNumber = generatePRNumber();
    const randomPart = prNumber.slice(12);
    expect(randomPart).toHaveLength(6);
    expect(randomPart).toMatch(/^[A-Z0-9]{6}$/);
  });
});
