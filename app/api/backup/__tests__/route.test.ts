import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GET } from '../route';

vi.mock('@/lib/auth');
vi.mock('@/lib/prisma');

const ADMIN_SESSION = {
  userId: 'admin-001',
  email: 'admin@example.com',
  role: 'ADMIN',
};

const TECHNICIAN_SESSION = {
  userId: 'tech-001',
  email: 'tech@example.com',
  role: 'TECHNICIAN',
};

const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

function mockAllTables() {
  vi.mocked(prisma.user.findMany).mockResolvedValue([
    {
      id: 'user-1',
      email: 'admin@example.com',
      password_hash: 'hashed-password',
      role: 'ADMIN',
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
      created_by: null,
      updated_by: null,
      deleted: true,
    },
  ] as never);
  vi.mocked(prisma.laboratoryRoom.findMany).mockResolvedValue([
    {
      id: 'room-1',
      name: 'LR2',
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
      created_by: null,
      updated_by: null,
      deleted: false,
    },
  ] as never);
  vi.mocked(prisma.computerUnit.findMany).mockResolvedValue([
    {
      id: 'unit-1',
      unit_name: 'LR201',
      laboratory_room_id: 'room-1',
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
      created_by: null,
      updated_by: null,
      deleted: false,
    },
  ] as never);
  vi.mocked(prisma.computerComponent.findMany).mockResolvedValue([
    {
      id: 'comp-1',
      computer_unit_id: 'unit-1',
      type: 'KEYBOARD',
      specifications: 'Generic USB Keyboard',
      status: 'FUNCTIONAL',
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
      created_by: null,
      updated_by: null,
    },
  ] as never);
  vi.mocked(prisma.installedApplication.findMany).mockResolvedValue([
    {
      id: 'app-1',
      computer_unit_id: 'unit-1',
      name: 'Lab Suite',
      version: '1.0',
      license_key: 'XXXX-XXXX',
      license_type: 'COMMERCIAL',
      install_date: CREATED_AT,
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
    },
  ] as never);
  vi.mocked(prisma.inventoryItem.findMany).mockResolvedValue([
    {
      id: 'inv-1',
      sku: 'KB-LOGI-K120',
      name: 'Logitech K120 Keyboard',
      description: null,
      quantity: 5,
      reorder_point: 2,
      component_type: 'KEYBOARD',
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
      created_by: null,
      updated_by: null,
      deleted: false,
    },
  ] as never);
  vi.mocked(prisma.purchaseRequest.findMany).mockResolvedValue([
    {
      id: 'pr-1',
      pr_number: 'PR-20260101-AAAA',
      status: 'APPROVED',
      notes: null,
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
      created_by: null,
      updated_by: null,
      deleted: false,
    },
  ] as never);
  vi.mocked(prisma.requestItem.findMany).mockResolvedValue([
    {
      id: 'item-1',
      purchase_request_id: 'pr-1',
      inventory_item_id: 'inv-1',
      item_name: 'Logitech K120 Keyboard',
      quantity: 2,
      unit_price: '250.00',
      total: '500.00',
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
    },
  ] as never);
}

describe('GET /api/backup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 when there is no session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns 403 for technicians', async () => {
    vi.mocked(getSession).mockResolvedValue(TECHNICIAN_SESSION as never);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns the backup as a download for administrators', async () => {
    vi.mocked(getSession).mockResolvedValue(ADMIN_SESSION as never);
    mockAllTables();

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-disposition')).toMatch(
      /^attachment; filename="procurvin-backup-\d{4}-\d{2}-\d{2}\.json"$/,
    );

    const body = await response.json();

    expect(body.app).toBe('procurvin');
    expect(body.format_version).toBe(1);
    expect(body.counts).toEqual({
      users: 1,
      laboratoryRooms: 1,
      computerUnits: 1,
      computerComponents: 1,
      installedApplications: 1,
      inventoryItems: 1,
      purchaseRequests: 1,
      requestItems: 1,
    });

    expect(body.data.users).toHaveLength(1);
    expect(body.data.users[0].deleted).toBe(true);
    expect(typeof body.data.users[0].created_at).toBe('string');
    expect(body.data.users[0].created_at).toBe('2026-01-01T00:00:00.000Z');

    expect(body.data).not.toHaveProperty('passwordResetTokens');
    expect(body.counts).not.toHaveProperty('passwordResetTokens');
    expect(prisma.passwordResetToken.findMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
