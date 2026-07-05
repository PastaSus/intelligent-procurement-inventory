import { describe, it, expect, beforeEach } from 'vitest';

interface RoomRecord {
  id: string;
  name: string;
  unitCount: number;
  deleted: boolean;
}

function makeRoomService(initial: RoomRecord[]) {
  const rooms = new Map(initial.map(r => [r.id, { ...r }]));

  return {
    delete(id: string): { success: boolean; error?: string } {
      const room = rooms.get(id);
      if (!room) return { success: false, error: 'Room not found' };
      if (room.unitCount > 0) {
        return { success: false, error: 'Cannot delete room with existing computer units' };
      }
      room.deleted = true;
      return { success: true };
    },
    isDeleted(id: string): boolean {
      return rooms.get(id)?.deleted === true;
    },
    getActive(): RoomRecord[] {
      return Array.from(rooms.values()).filter(r => !r.deleted);
    },
  };
}

describe('Story 2.4: Delete Laboratory Room', () => {
  it('blocks deletion when room has computer units', () => {
    const service = makeRoomService([
      { id: '1', name: 'Lab 127A', unitCount: 3, deleted: false },
    ]);
    const result = service.delete('1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot delete');
  });

  it('soft-deletes room with no units', () => {
    const service = makeRoomService([
      { id: '1', name: 'Lab 127A', unitCount: 0, deleted: false },
    ]);
    const result = service.delete('1');
    expect(result.success).toBe(true);
    expect(service.isDeleted('1')).toBe(true);
  });

  it('removes deleted room from active list', () => {
    const service = makeRoomService([
      { id: '1', name: 'Lab 127A', unitCount: 0, deleted: false },
      { id: '2', name: 'Lab 127B', unitCount: 2, deleted: false },
    ]);
    service.delete('1');
    expect(service.getActive()).toHaveLength(1);
    expect(service.getActive()[0].id).toBe('2');
  });

  it('returns error for non-existent room', () => {
    const service = makeRoomService([]);
    const result = service.delete('non-existent');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});
