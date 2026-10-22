export const COMPONENT_TYPES = [
  'MOTHERBOARD',
  'PROCESSOR',
  'MEMORY',
  'STORAGE',
  'MONITOR',
  'KEYBOARD',
  'MOUSE',
  'AVR',
  'OPTICAL_DRIVE',
] as const;

export type ComponentTypeValue = (typeof COMPONENT_TYPES)[number];

export const ISSUE_STATUSES = ['NEEDS_REPAIR', 'NEEDS_REPLACEMENT'] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export interface IssueComponent {
  id: string;
  type: string;
  serial_number: string;
  status: string;
  computer_unit: {
    id: string;
    unit_name: string;
    laboratory_room: { id: string; name: string };
  };
}

export interface IssueUnitGroup {
  unitId: string;
  unitName: string;
  components: IssueComponent[];
}

export interface IssueRoomGroup {
  roomId: string;
  roomName: string;
  units: IssueUnitGroup[];
}

export function parseComponentType(value: unknown): ComponentTypeValue | undefined {
  return typeof value === 'string' && (COMPONENT_TYPES as readonly string[]).includes(value)
    ? (value as ComponentTypeValue)
    : undefined;
}

export function parseIssueStatus(value: unknown): IssueStatus | undefined {
  return value === 'NEEDS_REPAIR' || value === 'NEEDS_REPLACEMENT' ? value : undefined;
}

export function issueStatusLabel(status: IssueStatus): string {
  return status === 'NEEDS_REPAIR' ? 'Needs Repair' : 'Needs Replacement';
}

export function filterIssueComponents(
  components: IssueComponent[],
  type?: ComponentTypeValue,
  status?: IssueStatus
): IssueComponent[] {
  return components.filter(
    (component) =>
      (!type || component.type === type) && (!status || component.status === status)
  );
}

export function groupIssueComponentsByRoom(components: IssueComponent[]): IssueRoomGroup[] {
  const rooms = new Map<string, IssueRoomGroup>();

  for (const component of components) {
    const room = component.computer_unit.laboratory_room;
    let roomGroup = rooms.get(room.id);
    if (!roomGroup) {
      roomGroup = { roomId: room.id, roomName: room.name, units: [] };
      rooms.set(room.id, roomGroup);
    }

    const unit = component.computer_unit;
    let unitGroup = roomGroup.units.find((entry) => entry.unitId === unit.id);
    if (!unitGroup) {
      unitGroup = { unitId: unit.id, unitName: unit.unit_name, components: [] };
      roomGroup.units.push(unitGroup);
    }

    unitGroup.components.push(component);
  }

  return Array.from(rooms.values())
    .map((room) => ({
      ...room,
      units: [...room.units].sort((a, b) => a.unitName.localeCompare(b.unitName)),
    }))
    .sort((a, b) => a.roomName.localeCompare(b.roomName));
}
