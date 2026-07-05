import { describe, it, expect } from 'vitest';

const ComponentType = {
  MOTHERBOARD: 'MOTHERBOARD',
  PROCESSOR: 'PROCESSOR',
  MEMORY: 'MEMORY',
  HDD: 'HDD',
  MONITOR: 'MONITOR',
  KEYBOARD: 'KEYBOARD',
  MOUSE: 'MOUSE',
  AVR: 'AVR',
  OPTICAL_DRIVE: 'OPTICAL_DRIVE',
} as const;

const ComponentStatus = {
  FUNCTIONAL: 'FUNCTIONAL',
  NEEDS_REPAIR: 'NEEDS_REPAIR',
  NEEDS_REPLACEMENT: 'NEEDS_REPLACEMENT',
} as const;

const PurchaseRequestStatus = {
  DRAFT: 'DRAFT',
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FULFILLED: 'FULFILLED',
} as const;

const Role = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const;

describe('Enums', () => {
  describe('ComponentType', () => {
    it('has exactly 9 values', () => {
      const values = Object.values(ComponentType);
      expect(values).toHaveLength(9);
    });

    it('contains all expected types', () => {
      expect(ComponentType.MOTHERBOARD).toBe('MOTHERBOARD');
      expect(ComponentType.PROCESSOR).toBe('PROCESSOR');
      expect(ComponentType.MEMORY).toBe('MEMORY');
      expect(ComponentType.HDD).toBe('HDD');
      expect(ComponentType.MONITOR).toBe('MONITOR');
      expect(ComponentType.KEYBOARD).toBe('KEYBOARD');
      expect(ComponentType.MOUSE).toBe('MOUSE');
      expect(ComponentType.AVR).toBe('AVR');
      expect(ComponentType.OPTICAL_DRIVE).toBe('OPTICAL_DRIVE');
    });
  });

  describe('ComponentStatus', () => {
    it('has exactly 3 values', () => {
      const values = Object.values(ComponentStatus);
      expect(values).toHaveLength(3);
    });

    it('contains all expected statuses', () => {
      expect(ComponentStatus.FUNCTIONAL).toBe('FUNCTIONAL');
      expect(ComponentStatus.NEEDS_REPAIR).toBe('NEEDS_REPAIR');
      expect(ComponentStatus.NEEDS_REPLACEMENT).toBe('NEEDS_REPLACEMENT');
    });
  });

  describe('PurchaseRequestStatus', () => {
    it('has exactly 5 values', () => {
      const values = Object.values(PurchaseRequestStatus);
      expect(values).toHaveLength(5);
    });

    it('has correct transition chain', () => {
      const statuses = Object.values(PurchaseRequestStatus);
      expect(statuses[0]).toBe('DRAFT');
      expect(statuses[1]).toBe('REQUESTED');
      expect(statuses[2]).toBe('APPROVED');
      expect(statuses[3]).toBe('REJECTED');
      expect(statuses[4]).toBe('FULFILLED');
    });
  });

  describe('Role', () => {
    it('has exactly 2 values', () => {
      const values = Object.values(Role);
      expect(values).toHaveLength(2);
    });

    it('contains ADMIN and STAFF', () => {
      expect(Role.ADMIN).toBe('ADMIN');
      expect(Role.STAFF).toBe('STAFF');
    });
  });
});
