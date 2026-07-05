import { describe, it, expect, beforeEach } from 'vitest';

interface RoomRecord {
  id: string;
  name: string;
  unitCount: number;
  deleted: boolean;
}

function makeRoomList(rooms: RoomRecord[]) {
  return {
    getActive: () => rooms.filter(r => !r.deleted),
    getById: (id: string) => rooms.find(r => r.id === id && !r.deleted),
    totalCount: () => rooms.filter(r => !r.deleted).length,
  };
}

describe('Story 2.2: View Laboratory Rooms List', () => {
  let rooms: RoomRecord[];

  beforeEach(() => {
    rooms = [
      { id: '1', name: 'Lab 127A', unitCount: 3, deleted: false },
      { id: '2', name: 'Lab 127B', unitCount: 5, deleted: false },
      { id: '3', name: 'Lab 127C', unitCount: 0, deleted: true },
      { id: '4', name: 'Lab 127D', unitCount: 2, deleted: false },
    ];
  });

  it('shows all active rooms', () => {
    const list = makeRoomList(rooms);
    expect(list.getActive()).toHaveLength(3);
  });

  it('excludes soft-deleted rooms', () => {
    const list = makeRoomList(rooms);
    const active = list.getActive();
    expect(active.find(r => r.id === '3')).toBeUndefined();
  });

  it('shows unit count per room', () => {
    const list = makeRoomList(rooms);
    const room = list.getById('2');
    expect(room?.unitCount).toBe(5);
  });

  it('returns correct total count', () => {
    const list = makeRoomList(rooms);
    expect(list.totalCount()).toBe(3);
  });
});
