export interface SparePartsCount {
  forReplacement: number;
  spareQty: number;
}

export interface ReplenishmentRow extends SparePartsCount {
  type: string;
  label: string;
  netShortage: number;
}

export function calculateNetShortage(forReplacement: number, spareQty: number): number {
  return Math.max(0, forReplacement - spareQty);
}

export function withNetShortage<T extends SparePartsCount>(row: T): T & { netShortage: number } {
  return {
    ...row,
    netShortage: calculateNetShortage(row.forReplacement, row.spareQty),
  };
}

export function buildReplenishmentRows<T extends SparePartsCount & { type: string; label: string }>(
  rows: T[]
): (T & { netShortage: number })[] {
  return rows
    .map(withNetShortage)
    .filter((row) => row.netShortage > 0)
    .sort((a, b) => b.netShortage - a.netShortage || a.label.localeCompare(b.label));
}
