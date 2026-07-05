let counter = 0;

function nextVal(prefix: string): string {
  counter++;
  return `${prefix}-${String(counter).padStart(4, '0')}`;
}

export function resetCounter() {
  counter = 0;
}

export interface LaboratoryRoom {
  id: string;
  name: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export function createRoom(overrides?: Partial<LaboratoryRoom>): LaboratoryRoom {
  return {
    id: nextVal('room'),
    name: `Laboratory ${nextVal('RM')}`,
    deleted: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

export function createRooms(count: number): LaboratoryRoom[] {
  return Array.from({ length: count }, () => createRoom());
}

export interface ComputerUnit {
  id: string;
  unit_name: string;
  laboratory_room_id: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export function createUnit(overrides?: Partial<ComputerUnit>): ComputerUnit {
  return {
    id: nextVal('unit'),
    unit_name: `U${nextVal('UNIT')}`,
    laboratory_room_id: nextVal('room'),
    deleted: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

export interface ComputerComponent {
  id: string;
  computer_unit_id: string;
  type: string;
  serial_number: string;
  specifications: string;
  status: 'FUNCTIONAL' | 'NEEDS_REPAIR' | 'NEEDS_REPLACEMENT';
}

export function createComponent(overrides?: Partial<ComputerComponent>): ComputerComponent {
  return {
    id: nextVal('comp'),
    computer_unit_id: nextVal('unit'),
    type: 'KEYBOARD',
    serial_number: `SN-${nextVal('SN')}`,
    specifications: 'Standard',
    status: 'FUNCTIONAL',
    ...overrides,
  };
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  reorder_point: number;
  component_type: string | null;
  deleted: boolean;
}

export function createInventoryItem(overrides?: Partial<InventoryItem>): InventoryItem {
  return {
    id: nextVal('inv'),
    sku: `SKU-${nextVal('SKU')}`,
    name: `Spare Part ${nextVal('part')}`,
    quantity: 10,
    reorder_point: 5,
    component_type: 'KEYBOARD',
    deleted: false,
    ...overrides,
  };
}

export interface PurchaseRequest {
  id: string;
  pr_number: string;
  status: 'DRAFT' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'FULFILLED';
  notes: string | null;
}

export function createPurchaseRequest(overrides?: Partial<PurchaseRequest>): PurchaseRequest {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return {
    id: nextVal('pr'),
    pr_number: `PR-${date}-${nextVal('R').slice(-6).toUpperCase()}`,
    status: 'DRAFT',
    notes: null,
    ...overrides,
  };
}
