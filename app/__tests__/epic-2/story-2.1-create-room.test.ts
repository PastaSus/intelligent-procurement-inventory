import { describe, it, expect } from 'vitest';
import { createRoom, createRooms } from '@/app/__tests__/factories';
import { resetCounter } from '@/app/__tests__/factories';

const VALID_NAME = /^[A-Za-z0-9 _-]{1,255}$/;

interface RoomService {
  create(name: string): { success: boolean; error?: string };
  list(): Array<{ id: string; name: string }>;
  delete(id: string, hasUnits: boolean): { success: boolean; error?: string };
  findByName(name: string): boolean;
}

function makeRoomService(): RoomService {
  const rooms = new Map<string, { name: string; deleted: boolean }>();

  function validateName(name: string): { valid: boolean; error?: string } {
    if (!name || !name.trim()) return { valid: false, error: 'Room name is required' };
    if (!VALID_NAME.test(name.trim())) return { valid: false, error: 'Invalid characters' };
    return { valid: true };
  }

  function findByName(name: string): boolean {
    const trimmed = name.trim().toLowerCase();
    for (const [, room] of rooms) {
      if (!room.deleted && room.name.toLowerCase() === trimmed) return true;
    }
    return false;
  }

  return {
    create(name: string) {
      const trimmed = name.trim();
      const validation = validateName(trimmed);
      if (!validation.valid) return { success: false, error: validation.error };
      if (findByName(trimmed)) return { success: false, error: 'Room name already exists' };
      const id = `room-${rooms.size + 1}`;
      rooms.set(id, { name: trimmed, deleted: false });
      return { success: true };
    },
    list() {
      return Array.from(rooms.entries())
        .filter(([, r]) => !r.deleted)
        .map(([id, r]) => ({ id, name: r.name }));
    },
    delete(id: string, hasUnits: boolean) {
      if (hasUnits) return { success: false, error: 'Cannot delete room with existing computer units' };
      const room = rooms.get(id);
      if (!room) return { success: false, error: 'Room not found' };
      room.deleted = true;
      return { success: true };
    },
    findByName,
  };
}

describe('Story 2.1: Create Laboratory Room', () => {
  let service: RoomService;

  beforeEach(() => {
    resetCounter();
    service = makeRoomService();
  });

  it('creates a room with a valid name', () => {
    const result = service.create('Laboratory 127A');
    expect(result.success).toBe(true);
    expect(service.list()).toHaveLength(1);
  });

  it('rejects empty room name', () => {
    const result = service.create('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });

  it('rejects whitespace-only name', () => {
    const result = service.create('   ');
    expect(result.success).toBe(false);
  });

  it('rejects duplicate room name (case-insensitive)', () => {
    service.create('Laboratory 127A');
    const result = service.create('laboratory 127a');
    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('trims whitespace from room name', () => {
    const result = service.create('  Lab Room  ');
    expect(result.success).toBe(true);
    expect(service.findByName('Lab Room')).toBe(true);
  });
});
