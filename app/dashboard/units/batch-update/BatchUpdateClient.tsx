'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { batchUpdateComponents } from '@/app/_actions/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/lib/toast-context';

interface BatchComponent {
  id: string;
  type: string;
  serial_number: string;
  specifications: string;
  status: string;
  computer_unit: {
    id: string;
    unit_name: string;
    laboratory_room: { id: string; name: string };
  };
}

interface BatchUpdateClientProps {
  initialComponents: BatchComponent[];
  componentTypes: readonly string[];
}

const STATUS_OPTIONS = [
  { value: 'FUNCTIONAL', label: 'Functional' },
  { value: 'NEEDS_REPAIR', label: 'Needs Repair' },
  { value: 'NEEDS_REPLACEMENT', label: 'Needs Replacement' },
] as const;

const statusStyles: Record<string, string> = {
  FUNCTIONAL: 'bg-green-100 text-green-800',
  NEEDS_REPAIR: 'bg-yellow-100 text-yellow-800',
  NEEDS_REPLACEMENT: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, React.ElementType> = {
  FUNCTIONAL: CheckCircle2,
  NEEDS_REPAIR: Wrench,
  NEEDS_REPLACEMENT: AlertTriangle,
};

function StatusBadge({ status }: { status: string }) {
  const Icon = statusIcons[status] ?? Cpu;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${statusStyles[status] ?? ''}`}>
      <Icon className="h-3 w-3" />
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function BatchUpdateClient({ initialComponents, componentTypes }: BatchUpdateClientProps) {
  const [components, setComponents] = useState(initialComponents);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roomFilter, setRoomFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updateStatus, setUpdateStatus] = useState('NO_CHANGE');
  const [specifications, setSpecifications] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const rooms = useMemo(() => {
    const map = new Map<string, string>();
    for (const component of components) {
      map.set(
        component.computer_unit.laboratory_room.id,
        component.computer_unit.laboratory_room.name,
      );
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [components]);

  const filteredComponents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return components.filter((component) => {
      if (roomFilter !== 'all' && component.computer_unit.laboratory_room.id !== roomFilter) {
        return false;
      }
      if (typeFilter !== 'all' && component.type !== typeFilter) {
        return false;
      }
      if (statusFilter !== 'all' && component.status !== statusFilter) {
        return false;
      }
      if (query) {
        const haystack = [
          component.computer_unit.unit_name,
          component.computer_unit.laboratory_room.name,
          component.type,
          component.serial_number,
          component.specifications,
        ].join(' ').toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [components, roomFilter, typeFilter, statusFilter, search]);

  const allVisibleSelected =
    filteredComponents.length > 0 &&
    filteredComponents.every((component) => selectedIds.has(component.id));

  const hasUpdate = updateStatus !== 'NO_CHANGE' || specifications.trim() !== '';

  function toggleComponent(id: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (allVisibleSelected) {
        for (const component of filteredComponents) {
          next.delete(component.id);
        }
      } else {
        for (const component of filteredComponents) {
          next.add(component.id);
        }
      }
      return next;
    });
  }

  function clearFilters() {
    setRoomFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setSearch('');
  }

  function handleApply() {
    if (selectedIds.size === 0) {
      setError('Select at least one component');
      return;
    }
    if (!hasUpdate) {
      setError('Choose a status or enter specifications');
      return;
    }

    setError('');
    const ids = [...selectedIds];
    const nextSpecifications = specifications.trim();
    const formData = new FormData();
    for (const id of ids) {
      formData.append('componentIds', id);
    }
    if (updateStatus !== 'NO_CHANGE') {
      formData.set('status', updateStatus);
    }
    if (nextSpecifications) {
      formData.set('specifications', nextSpecifications);
    }

    startTransition(async () => {
      const result = await batchUpdateComponents(formData);
      if (!result.success) {
        setError(result.error || 'Failed to update components');
        addToast(result.error || 'Failed to update components', 'error');
        return;
      }

      const updatedIds = new Set(ids);
      setComponents((previous) =>
        previous.map((component) =>
          updatedIds.has(component.id)
            ? {
                ...component,
                ...(updateStatus !== 'NO_CHANGE' && { status: updateStatus }),
                ...(nextSpecifications && { specifications: nextSpecifications }),
              }
            : component,
        ),
      );
      setSelectedIds(new Set());
      setSpecifications('');
      setUpdateStatus('NO_CHANGE');
      const count = result.data?.count ?? ids.length;
      addToast(`${count} component${count === 1 ? '' : 's'} updated`, 'success');
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/units"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Units
        </Link>
        <h2 className="text-3xl font-bold">Batch Update Components</h2>
        <p className="text-muted-foreground">
          Select components across different units and update their status or specifications at once.
        </p>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by unit, room, type, or serial..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              aria-label="Search components"
            />
          </div>

          <Select value={roomFilter} onValueChange={setRoomFilter}>
            <SelectTrigger className="w-[150px]" aria-label="Filter by room">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rooms</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[170px]" aria-label="Filter by component type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {componentTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(roomFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || search) && (
            <Button variant="ghost" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        <div className="p-4 border-b bg-muted/20 flex flex-wrap items-end gap-3">
          <div className="min-w-[190px]">
            <label htmlFor="bulkStatus" className="block text-sm font-medium mb-1">New Status</label>
            <Select value={updateStatus} onValueChange={setUpdateStatus}>
              <SelectTrigger id="bulkStatus" className="w-full" aria-label="New status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NO_CHANGE">No change</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[240px]">
            <label htmlFor="bulkSpecifications" className="block text-sm font-medium mb-1">
              Specifications (optional)
            </label>
            <Input
              id="bulkSpecifications"
              value={specifications}
              onChange={(event) => setSpecifications(event.target.value)}
              placeholder="Leave blank to keep existing specifications"
              maxLength={500}
              disabled={isPending}
            />
          </div>

          <Button
            onClick={handleApply}
            disabled={isPending || selectedIds.size === 0 || !hasUpdate}
            className="gap-2"
            title={
              selectedIds.size === 0
                ? 'Select at least one component'
                : !hasUpdate
                  ? 'Choose a status or enter specifications'
                  : undefined
            }
          >
            {isPending
              ? 'Updating...'
              : `Update ${selectedIds.size} Component${selectedIds.size === 1 ? '' : 's'}`}
          </Button>

          {selectedIds.size > 0 && (
            <Button
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              disabled={isPending}
            >
              Clear selection
            </Button>
          )}
        </div>

        {error && (
          <div className="m-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <div className="px-4 py-3 border-b flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredComponents.length} component{filteredComponents.length === 1 ? '' : 's'} shown
            {' · '}
            {selectedIds.size} selected
          </span>
          <span>{components.length} total components</span>
        </div>

        {filteredComponents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No components match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-12 p-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Select all filtered components"
                      className="h-4 w-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-left p-3 text-sm font-medium">Unit</th>
                  <th className="text-left p-3 text-sm font-medium">Room</th>
                  <th className="text-left p-3 text-sm font-medium">Type</th>
                  <th className="text-left p-3 text-sm font-medium">Serial Number</th>
                  <th className="text-left p-3 text-sm font-medium">Specifications</th>
                  <th className="text-center p-3 text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredComponents.map((component) => {
                  const selected = selectedIds.has(component.id);
                  return (
                    <tr
                      key={component.id}
                      className={`border-b last:border-b-0 ${selected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleComponent(component.id)}
                          aria-label={`Select ${component.computer_unit.unit_name} ${component.type}`}
                          className="h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/dashboard/units/${component.computer_unit.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {component.computer_unit.unit_name}
                        </Link>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {component.computer_unit.laboratory_room.name}
                      </td>
                      <td className="p-3 text-sm font-medium">{component.type}</td>
                      <td className="p-3 font-mono text-sm">{component.serial_number}</td>
                      <td className="p-3 text-sm max-w-[260px] truncate" title={component.specifications}>
                        {component.specifications}
                      </td>
                      <td className="p-3 text-center">
                        <StatusBadge status={component.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
