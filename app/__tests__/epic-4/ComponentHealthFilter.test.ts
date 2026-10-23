import { describe, it, expect } from 'vitest';
import {
  filterIssueComponents,
  groupIssueComponentsByRoom,
  issueStatusLabel,
  parseComponentType,
  parseIssueStatus,
  type IssueComponent,
} from '@/lib/component-health';

function makeComponent(overrides: Partial<IssueComponent> & { type?: string; status?: string } = {}): IssueComponent {
  return {
    id: overrides.id ?? 'comp-1',
    type: overrides.type ?? 'MOUSE',
    status: overrides.status ?? 'NEEDS_REPLACEMENT',
    computer_unit: overrides.computer_unit ?? {
      id: 'unit-1',
      unit_name: 'Unit 1',
      laboratory_room: { id: 'room-1', name: 'Lab 1' },
    },
  };
}

describe('component health filters', () => {
  it('parses valid component types and rejects invalid values', () => {
    expect(parseComponentType('MOUSE')).toBe('MOUSE');
    expect(parseComponentType('mouse')).toBeUndefined();
    expect(parseComponentType(undefined)).toBeUndefined();
    expect(parseComponentType('PRINTER')).toBeUndefined();
  });

  it('parses issue statuses and rejects other statuses', () => {
    expect(parseIssueStatus('NEEDS_REPAIR')).toBe('NEEDS_REPAIR');
    expect(parseIssueStatus('NEEDS_REPLACEMENT')).toBe('NEEDS_REPLACEMENT');
    expect(parseIssueStatus('FUNCTIONAL')).toBeUndefined();
    expect(parseIssueStatus(undefined)).toBeUndefined();
  });

  it('labels issue statuses for display', () => {
    expect(issueStatusLabel('NEEDS_REPAIR')).toBe('Needs Repair');
    expect(issueStatusLabel('NEEDS_REPLACEMENT')).toBe('Needs Replacement');
  });

  it('filters components by type and status', () => {
    const components = [
      makeComponent({ id: 'a', type: 'MOUSE', status: 'NEEDS_REPLACEMENT' }),
      makeComponent({ id: 'b', type: 'MOUSE', status: 'NEEDS_REPAIR' }),
      makeComponent({ id: 'c', type: 'KEYBOARD', status: 'NEEDS_REPLACEMENT' }),
    ];

    expect(filterIssueComponents(components, 'MOUSE').map((c) => c.id)).toEqual(['a', 'b']);
    expect(filterIssueComponents(components, undefined, 'NEEDS_REPLACEMENT').map((c) => c.id)).toEqual(['a', 'c']);
    expect(filterIssueComponents(components, 'MOUSE', 'NEEDS_REPAIR').map((c) => c.id)).toEqual(['b']);
    expect(filterIssueComponents(components).map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('groups matching components by room, then unit', () => {
    const components = [
      makeComponent({
        id: 'a',
        computer_unit: { id: 'unit-2', unit_name: 'Unit B', laboratory_room: { id: 'room-2', name: 'Lab 2' } },
      }),
      makeComponent({
        id: 'b',
        computer_unit: { id: 'unit-1', unit_name: 'Unit A', laboratory_room: { id: 'room-1', name: 'Lab 1' } },
      }),
      makeComponent({
        id: 'c',
        computer_unit: { id: 'unit-1', unit_name: 'Unit A', laboratory_room: { id: 'room-1', name: 'Lab 1' } },
      }),
      makeComponent({
        id: 'd',
        computer_unit: { id: 'unit-3', unit_name: 'Unit C', laboratory_room: { id: 'room-2', name: 'Lab 2' } },
      }),
    ];

    const grouped = groupIssueComponentsByRoom(components);

    expect(grouped.map((room) => room.roomName)).toEqual(['Lab 1', 'Lab 2']);
    expect(grouped[0].units).toHaveLength(1);
    expect(grouped[0].units[0]).toMatchObject({ unitId: 'unit-1', unitName: 'Unit A' });
    expect(grouped[0].units[0].components.map((c) => c.id)).toEqual(['b', 'c']);
    expect(grouped[1].units.map((unit) => unit.unitName)).toEqual(['Unit B', 'Unit C']);
  });

  it('returns an empty grouping when no components match', () => {
    expect(groupIssueComponentsByRoom([])).toEqual([]);
  });
});
