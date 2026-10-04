import { vi } from 'vitest';

export type MockSessionRole = 'ADMIN' | 'TECHNICIAN';

const mockUser: Record<MockSessionRole, {
  id: string;
  email: string;
  role: MockSessionRole;
  name: string;
}> = {
  ADMIN: { id: 'admin-001', email: 'admin@example.com', role: 'ADMIN', name: 'Admin User' },
  TECHNICIAN: { id: 'tech-001', email: 'tech@example.com', role: 'TECHNICIAN', name: 'Tech User' },
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
