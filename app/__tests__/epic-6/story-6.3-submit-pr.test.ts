import { describe, it, expect } from 'vitest';

type PRStatus = 'DRAFT' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'FULFILLED';

const TRANSITIONS: Record<PRStatus, PRStatus[]> = {
  DRAFT: ['REQUESTED'],
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['FULFILLED'],
  REJECTED: [],
  FULFILLED: [],
};

function submitForApproval(currentStatus: PRStatus): { status: PRStatus; error?: string } {
  if (currentStatus !== 'DRAFT') {
    return { status: currentStatus, error: `Cannot submit a ${currentStatus} request` };
  }
  return { status: 'REQUESTED' };
}

describe('Story 6.3: Submit Purchase Request for Approval', () => {
  it('transitions DRAFT to REQUESTED', () => {
    const result = submitForApproval('DRAFT');
    expect(result.status).toBe('REQUESTED');
    expect(result.error).toBeUndefined();
  });

  it('rejects submit when already REQUESTED', () => {
    const result = submitForApproval('REQUESTED');
    expect(result.error).toContain('Cannot submit');
  });

  it('rejects submit when already APPROVED', () => {
    const result = submitForApproval('APPROVED');
    expect(result.error).toContain('Cannot submit');
  });

  it('rejects submit when REJECTED', () => {
    const result = submitForApproval('REJECTED');
    expect(result.error).toContain('Cannot submit');
  });

  it('rejects submit when FULFILLED', () => {
    const result = submitForApproval('FULFILLED');
    expect(result.error).toContain('Cannot submit');
  });
});
