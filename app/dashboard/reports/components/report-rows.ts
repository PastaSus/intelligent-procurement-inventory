export type ReportDetail = 'detailed' | 'non-detailed';

export interface ReportComponent {
  id: string;
  type: string;
  specifications: string;
  status: string;
}

export interface ReportUnit {
  id: string;
  unit_name: string;
  components: ReportComponent[];
}

export interface ReportRoom {
  id: string;
  name: string;
  units: ReportUnit[];
}

const STATUS_RANK: Record<string, number> = {
  FUNCTIONAL: 0,
  NEEDS_REPAIR: 1,
  NEEDS_REPLACEMENT: 2,
};

export function getWorstStatus(components: { status: string }[]): string {
  return components.reduce((worst, component) => {
    const rank = STATUS_RANK[component.status] ?? -1;
    return rank > (STATUS_RANK[worst] ?? -1) ? component.status : worst;
  }, 'FUNCTIONAL');
}

export function getVisibleRooms(rooms: ReportRoom[]): ReportRoom[] {
  return rooms
    .map((room) => ({
      ...room,
      units: room.units.filter((unit) => unit.components.length > 0),
    }))
    .filter((room) => room.units.length > 0);
}

export function getReportTotals(rooms: ReportRoom[]) {
  const units = rooms.reduce((sum, room) => sum + room.units.length, 0);
  const components = rooms.reduce(
    (sum, room) => sum + room.units.reduce((unitSum, unit) => unitSum + unit.components.length, 0),
    0
  );
  return { rooms: rooms.length, units, components };
}

export function getDetailedRows(rooms: ReportRoom[]) {
  return rooms.flatMap((room) =>
    room.units.flatMap((unit) =>
      unit.components.map((component) => ({
        id: component.id,
        roomName: room.name,
        unitName: unit.unit_name,
        type: component.type,
        specifications: component.specifications,
        status: component.status,
      }))
    )
  );
}

export function getUnitRows(rooms: ReportRoom[]) {
  return rooms.flatMap((room) =>
    room.units.map((unit) => ({
      id: unit.id,
      roomName: room.name,
      unitName: unit.unit_name,
      status: getWorstStatus(unit.components),
    }))
  );
}

export function isRoomEnd(rows: { roomName: string }[], index: number): boolean {
  const next = rows[index + 1];
  return Boolean(next) && next.roomName !== rows[index].roomName;
}
