import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { addInstalledApplication, removeInstalledApplication } from '@/app/_actions/software';
import { createUnit } from '@/app/__tests__/factories';

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

async function adminSession() {
  const { getSession } = await import('@/lib/auth');
  vi.mocked(getSession).mockResolvedValue({ userId: 'admin-001', email: 'admin@example.com', role: 'ADMIN' });
}

describe('addInstalledApplication', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await adminSession();
  });

  it('persists an optional license key', async () => {
    vi.mocked(prisma.computerUnit.findUnique).mockResolvedValue(createUnit({ id: 'unit-1' }));
    vi.mocked(prisma.installedApplication.create).mockResolvedValue({} as never);

    const fd = new FormData();
    fd.set('computerUnitId', 'unit-1');
    fd.set('name', 'Microsoft Office');
    fd.set('licenseKey', 'XXXXX-XXXXX-XXXXX');
    const result = await addInstalledApplication(fd);

    expect(result.success).toBe(true);
    expect(prisma.installedApplication.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ license_key: 'XXXXX-XXXXX-XXXXX' }),
    });
  });
});

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
