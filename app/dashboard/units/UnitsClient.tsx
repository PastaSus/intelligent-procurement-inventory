'use client';

import { useState, useMemo, useTransition } from 'react';
import { Plus, Monitor, Search, X, ChevronLeft, ChevronRight, Pencil, Trash2, Building2, Cpu, ExternalLink, CheckCircle2, Wrench, AlertTriangle, ListPlus, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { AddUnitForm } from './components/AddUnitForm';
import { BatchAddUnitsForm } from './components/BatchAddUnitsForm';
import { EditUnitForm } from './components/EditUnitForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { deleteComputerUnit, deleteComputerUnitsBatch } from '@/app/_actions/units';

interface ComputerUnit {
  id: string;
  unit_name: string;
  laboratory_room_id: string;
  created_at: Date;
  updated_at: Date;
  laboratory_room: { name: string };
  _count: { components: number };
  components: { status: string }[];
}

function UnitHealthBadges({ unit }: { unit: ComputerUnit }) {
  if (unit.components.length === 0) {
    return <span className="text-xs text-muted-foreground">No components</span>;
  }

  const needsRepair = unit.components.filter(c => c.status === 'NEEDS_REPAIR').length;
  const needsReplacement = unit.components.filter(c => c.status === 'NEEDS_REPLACEMENT').length;

  if (needsRepair === 0 && needsReplacement === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        <CheckCircle2 className="h-3 w-3" />
        All OK
      </span>
    );
  }

  return (
    <>
      {needsRepair > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          <Wrench className="h-3 w-3" />
          {needsRepair} repair
        </span>
      )}
      {needsReplacement > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
          <AlertTriangle className="h-3 w-3" />
          {needsReplacement} replace
        </span>
      )}
    </>
  );
}

interface Room {
  id: string;
  name: string;
}

interface UnitsClientProps {
  initialUnits: ComputerUnit[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  rooms: Room[];
  initialRoomId?: string;
  isAdmin?: boolean;
}

export function UnitsClient({ initialUnits, totalCount, currentPage, pageSize, rooms, initialRoomId = 'all', isAdmin = true }: UnitsClientProps) {
  const [units] = useState(initialUnits);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ComputerUnit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<ComputerUnit | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);
  const [sortBy, setSortBy] = useState<'unitName' | 'roomName' | 'componentCount' | 'updated_at'>('unitName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSuccess = () => {
    setIsFormOpen(false);
    setIsBatchFormOpen(false);
    setEditingUnit(null);
    setTimeout(() => {
      window.location.href = '/dashboard/units';
    }, 300);
  };

  const handleDelete = () => {
    if (!deletingUnit) return;

    const formData = new FormData();
    formData.set('id', deletingUnit.id);

    startTransition(async () => {
      const result = await deleteComputerUnit(formData);
      if (result.success) {
        setDeletingUnit(null);
        setTimeout(() => {
          window.location.href = '/dashboard/units';
        }, 300);
      } else {
        alert(result.error || 'Failed to delete unit');
      }
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;

    const formData = new FormData();
    selectedIds.forEach((id) => formData.append('ids', id));

    startTransition(async () => {
      const result = await deleteComputerUnitsBatch(formData);
      if (result.success) {
        setSelectedIds(new Set());
        setIsBatchDeleteOpen(false);
        setTimeout(() => {
          window.location.href = '/dashboard/units';
        }, 300);
      } else {
        alert(result.error || 'Failed to delete units');
      }
    });
  };

  const filteredItems = useMemo(() => {
    let result = [...units];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        unit => unit.unit_name.toLowerCase().includes(searchLower) ||
                unit.laboratory_room.name.toLowerCase().includes(searchLower)
      );
    }

    if (selectedRoomId !== 'all') {
      result = result.filter(unit => unit.laboratory_room_id === selectedRoomId);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'unitName':
          comparison = a.unit_name.localeCompare(b.unit_name);
          break;
        case 'roomName':
          comparison = a.laboratory_room.name.localeCompare(b.laboratory_room.name);
          break;
        case 'componentCount':
          comparison = a._count.components - b._count.components;
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [units, search, selectedRoomId, sortBy, sortOrder]);

  const totalPages = Math.ceil(totalCount / pageSize);

  function pageHref(page: number) {
    const params = new URLSearchParams({ page: String(page) });
    if (selectedRoomId !== 'all') params.set('room_id', selectedRoomId);
    return `/dashboard/units?${params.toString()}`;
  }

  const filteredIds = useMemo(() => filteredItems.map((unit) => unit.id), [filteredItems]);
  const selectedUnits = useMemo(
    () => units.filter((unit) => selectedIds.has(unit.id)),
    [units, selectedIds]
  );
  const selectedComponentCount = selectedUnits.reduce(
    (sum, unit) => sum + unit._count.components,
    0
  );
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.has(id));

  function toggleUnit(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function formatDate(date: Date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 text-left sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Computer Units</h2>
          <p className="text-muted-foreground">Manage individual computer machines</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/units/batch-update" className="gap-2">
              <ListChecks className="h-4 w-4" />
              Batch Update
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setIsBatchFormOpen(true)} className="gap-2">
            <ListPlus className="h-4 w-4" />
            Batch Add
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Unit
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by unit name or room..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedIds(new Set()); }}
            className="pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Room</span>
          <Select value={selectedRoomId} onValueChange={(value) => {
            setSelectedRoomId(value);
            setSelectedIds(new Set());
            window.location.href = value === 'all'
              ? '/dashboard/units'
              : `/dashboard/units?room_id=${encodeURIComponent(value)}`;
          }}>
            <SelectTrigger className="w-[170px]" aria-label="Filter by room">
              <SelectValue placeholder="All Rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {rooms.map(room => (
                <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by</span>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-[160px]" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unitName">Unit Name</SelectItem>
              <SelectItem value="roomName">Room</SelectItem>
              <SelectItem value="componentCount">Components</SelectItem>
              <SelectItem value="updated_at">Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Order</span>
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
            <SelectTrigger className="w-[150px]" aria-label="Sort order">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Total: {totalCount} units</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">Showing {filteredItems.length}</span>
          </div>
          {isAdmin && selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBatchDeleteOpen(true)}
              disabled={isPending}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete {selectedIds.size} Selected
            </Button>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No computer units found.</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {isAdmin && (
                    <th className="w-[44px] p-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input accent-primary"
                        aria-label="Select all filtered units on this page"
                        checked={allFilteredSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected;
                        }}
                        onChange={toggleAllFiltered}
                      />
                    </th>
                  )}
                  <th aria-sort={sortBy === 'unitName' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'} className="text-left p-3 text-sm font-medium">Unit Name</th>
                  <th aria-sort={sortBy === 'roomName' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'} className="text-left p-3 text-sm font-medium">Room</th>
                  <th aria-sort={sortBy === 'componentCount' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'} className="text-center p-3 text-sm font-medium">Components</th>
                  <th className="text-center p-3 text-sm font-medium">Component Status</th>
                  <th aria-sort={sortBy === 'updated_at' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'} className="text-center p-3 text-sm font-medium">Updated</th>
                  <th className="text-center w-[100px] p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((unit) => (
                  <tr key={unit.id} className="border-b last:border-b-0 hover:bg-muted/30" tabIndex={0}>
                    {isAdmin && (
                      <td className="p-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-input accent-primary"
                          aria-label={`Select ${unit.unit_name}`}
                          checked={selectedIds.has(unit.id)}
                          onChange={() => toggleUnit(unit.id)}
                        />
                      </td>
                    )}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-medium">{unit.unit_name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{unit.laboratory_room.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{unit._count.components}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Link
                        href={`/dashboard/units/${unit.id}`}
                        className="inline-flex flex-wrap items-center justify-center gap-1"
                        title="View components"
                      >
                        <UnitHealthBadges unit={unit} />
                      </Link>
                    </td>
                    <td className="p-3 text-center text-sm text-muted-foreground">{formatDate(unit.updated_at)}</td>
                    <td className="p-3 text-center w-[130px]">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/dashboard/units/${unit.id}`}
                          className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors"
                          title="View Components"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setEditingUnit(unit)}
                          className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeletingUnit(unit)}
                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1}
                onClick={() => window.location.href = pageHref(currentPage - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages}
                onClick={() => window.location.href = pageHref(currentPage + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <AddUnitForm onClose={() => setIsFormOpen(false)} onSuccess={handleSuccess} rooms={rooms} />
      )}

      {isBatchFormOpen && (
        <BatchAddUnitsForm onClose={() => setIsBatchFormOpen(false)} onSuccess={handleSuccess} rooms={rooms} />
      )}

      {editingUnit && (
        <EditUnitForm unit={editingUnit} onClose={() => setEditingUnit(null)} onSuccess={handleSuccess} rooms={rooms} />
      )}

      {isBatchDeleteOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg border p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">
                Delete {selectedIds.size} Unit{selectedIds.size !== 1 ? 's' : ''}
              </h3>
            </div>
            <p className="text-muted-foreground mb-2">
              Are you sure you want to delete {selectedIds.size} selected unit{selectedIds.size !== 1 ? 's' : ''}?
            </p>
            {selectedComponentCount > 0 && (
              <p className="text-sm text-amber-600 mb-2">
                This will also permanently delete {selectedComponentCount} component
                {selectedComponentCount !== 1 ? 's' : ''}.
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-4">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsBatchDeleteOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBatchDelete} disabled={isPending}>
                {isPending
                  ? 'Deleting...'
                  : `Delete ${selectedIds.size} Unit${selectedIds.size !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deletingUnit && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg border p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Delete Computer Unit</h3>
            </div>
            <p className="text-muted-foreground mb-2">
              Are you sure you want to delete <strong className="text-foreground">{deletingUnit.unit_name}</strong>?
            </p>
            {deletingUnit._count.components > 0 && (
              <p className="text-sm text-amber-600 mb-4">
                This unit has {deletingUnit._count.components} component{deletingUnit._count.components !== 1 ? 's' : ''} that will also be deleted.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeletingUnit(null)} disabled={isPending}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
