import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { removeInstalledApplication } from '@/app/_actions/software';

vi.mock('@/lib/prisma');
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn().mockResolvedValue({ userId: 'admin-001', email: 'admin@example.com', role: 'ADMIN' }),
  setMockRole: vi.fn(),
  resetMockRole: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

async function techSession() {
  const { getSession } = await import('@/lib/auth');
  vi.mocked(getSession).mockResolvedValue({ userId: 'tech-001', email: 'tech@example.com', role: 'TECHNICIAN' });
}

describe('removeInstalledApplication', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await techSession();
  });

  it('denies TECHNICIAN remove with zero DB change', async () => {
    const fd = new FormData();
    fd.set('id', 'app-1');
    const result = await removeInstalledApplication(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain('administrators');
    expect(prisma.installedApplication.delete).not.toHaveBeenCalled();
  });
});
