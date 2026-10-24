export interface UnitBatchInput {
  prefix: string;
  startNumber: number;
  count: number;
  padding?: number;
}

export function buildUnitNames({
  prefix,
  startNumber,
  count,
  padding = 2,
}: UnitBatchInput): string[] {
  return Array.from({ length: count }, (_, index) =>
    `${prefix}${String(startNumber + index).padStart(padding, '0')}`,
  );
}

export function deriveUnitPrefix(roomName: string): string {
  return roomName.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}
