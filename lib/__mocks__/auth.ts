import { vi } from 'vitest';

export type MockSessionRole = 'ADMIN' | 'STAFF';

const mockUser: Record<MockSessionRole, {
  id: string;
  email: string;
  role: MockSessionRole;
  name: string;
}> = {
  ADMIN: { id: 'admin-001', email: 'admin@example.com', role: 'ADMIN', name: 'Admin User' },
  STAFF: { id: 'staff-001', email: 'staff@example.com', role: 'STAFF', name: 'Staff User' },
};

let currentRole: MockSessionRole = 'ADMIN';

export function setMockRole(role: MockSessionRole) {
  currentRole = role;
}

export function resetMockRole() {
  currentRole = 'ADMIN';
}

export const getSession = vi.fn().mockImplementation(async () => mockUser[currentRole]);

export type SessionPayload = typeof mockUser.ADMIN;
