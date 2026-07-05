import { describe, it, expect } from 'vitest';

type Role = 'ADMIN' | 'STAFF';
type PRStatus = 'DRAFT' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'FULFILLED';

interface ApprovalResult {
  status: PRStatus;
  error?: string;
}

function approveRequest(currentStatus: PRStatus, role: Role): ApprovalResult {
  if (role !== 'ADMIN') return { status: currentStatus, error: 'Only administrators can approve requests' };
  if (currentStatus !== 'REQUESTED') return { status: currentStatus, error: `Cannot approve a ${currentStatus} request` };
  return { status: 'APPROVED' };
}

function rejectRequest(currentStatus: PRStatus, role: Role, reason?: string): ApprovalResult & { reason?: string } {
  if (role !== 'ADMIN') return { status: currentStatus, error: 'Only administrators can reject requests' };
  if (currentStatus !== 'REQUESTED') return { status: currentStatus, error: `Cannot reject a ${currentStatus} request` };
  return { status: 'REJECTED', reason };
}

describe('Story 6.4: Approve / Reject Purchase Request', () => {
  describe('Approve', () => {
    it('ADMIN can approve REQUESTED PR', () => {
      const result = approveRequest('REQUESTED', 'ADMIN');
      expect(result.status).toBe('APPROVED');
    });

    it('STAFF cannot approve', () => {
      const result = approveRequest('REQUESTED', 'STAFF');
      expect(result.error).toContain('Only administrators');
    });

    it('cannot approve a DRAFT directly', () => {
      const result = approveRequest('DRAFT', 'ADMIN');
      expect(result.error).toContain('Cannot approve a DRAFT');
    });

    it('cannot approve an already APPROVED PR', () => {
      const result = approveRequest('APPROVED', 'ADMIN');
      expect(result.error).toContain('Cannot approve a APPROVED');
    });
  });

  describe('Reject', () => {
    it('ADMIN can reject REQUESTED PR', () => {
      const result = rejectRequest('REQUESTED', 'ADMIN');
      expect(result.status).toBe('REJECTED');
    });

    it('rejection stores optional reason', () => {
      const result = rejectRequest('REQUESTED', 'ADMIN', 'Budget constraints');
      expect(result.reason).toBe('Budget constraints');
    });

    it('STAFF cannot reject', () => {
      const result = rejectRequest('REQUESTED', 'STAFF');
      expect(result.error).toContain('Only administrators');
    });

    it('cannot reject a DRAFT', () => {
      const result = rejectRequest('DRAFT', 'ADMIN');
      expect(result.error).toContain('Cannot reject a DRAFT');
    });
  });
});
