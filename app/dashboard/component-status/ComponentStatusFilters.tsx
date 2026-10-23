'use client';

import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  COMPONENT_STATUSES,
  COMPONENT_TYPES,
  issueStatusLabel,
  type ComponentStatusValue,
  type ComponentTypeValue,
} from '@/lib/component-health';

interface ComponentStatusFiltersProps {
  selectedType?: ComponentTypeValue;
  selectedStatus?: ComponentStatusValue;
}

export function ComponentStatusFilters({ selectedType, selectedStatus }: ComponentStatusFiltersProps) {
  const router = useRouter();

  function applyFilter(key: 'type' | 'status', value: string) {
    const nextType = key === 'type' ? value : selectedType;
    const nextStatus = key === 'status' ? value : selectedStatus;
    const params = new URLSearchParams();
    if (nextType && nextType !== 'all') params.set('type', nextType);
    if (nextStatus && nextStatus !== 'all') params.set('status', nextStatus);
    const query = params.toString();
    router.push(`/dashboard/component-status${query ? `?${query}` : ''}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select value={selectedType ?? 'all'} onValueChange={(value) => applyFilter('type', value)}>
        <SelectTrigger className="w-[200px]" aria-label="Filter by component type">
          <SelectValue placeholder="All Component Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Component Types</SelectItem>
          {COMPONENT_TYPES.map((type) => (
            <SelectItem key={type} value={type}>{type}</SelectItem>
          ))}
        </SelectContent>
      </Select>

        <Select value={selectedStatus ?? 'all'} onValueChange={(value) => applyFilter('status', value)}>
          <SelectTrigger className="w-[200px]" aria-label="Filter by component status">
            <SelectValue placeholder="All Issues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Issues</SelectItem>
            {COMPONENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>{issueStatusLabel(status)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
    </div>
  );
}
