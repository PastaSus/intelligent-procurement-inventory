'use client';

import { useState, useMemo, useTransition } from 'react';
import { Plus, Monitor, Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Pencil, Trash2, Building2, Cpu } from 'lucide-react';
import { AddUnitForm } from './components/AddUnitForm';
import { EditUnitForm } from './components/EditUnitForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteComputerUnit } from '@/app/_actions/units';

interface ComputerUnit {
  id: string;
  unit_name: string;
  laboratory_room_id: string;
  created_at: Date;
  updated_at: Date;
  laboratory_room: { name: string };
  _count: { components: number };
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
}

export function UnitsClient({ initialUnits, totalCount, currentPage, pageSize, rooms }: UnitsClientProps) {
  const [units] = useState(initialUnits);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ComputerUnit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<ComputerUnit | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('all');
  const [sortBy, setSortBy] = useState<'unitName' | 'roomName' | 'componentCount' | 'updated_at'>('unitName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSuccess = () => {
    setIsFormOpen(false);
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

  function handleSort(column: typeof sortBy) {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  }

  function SortHeader({ column, label }: { column: typeof sortBy; label: string }) {
    const isActive = sortBy === column;
    return (
      <button
        onClick={() => handleSort(column)}
        className="flex items-center gap-1 hover:bg-muted/50 px-2 py-1 rounded transition-colors"
      >
        <span>{label}</span>
        {isActive && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Computer Units</h2>
          <p className="text-muted-foreground">Manage individual computer machines</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Unit
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by unit name or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        <select
          value={selectedRoomId}
          onChange={(e) => setSelectedRoomId(e.target.value)}
          className="px-3 py-2 rounded-md border border-input bg-background text-sm"
        >
          <option value="all">All Rooms</option>
          {rooms.map(room => (
            <option key={room.id} value={room.id}>{room.name}</option>
          ))}
        </select>
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
                  <th className="text-left p-3 text-sm font-medium"><SortHeader column="unitName" label="Unit Name" /></th>
                  <th className="text-left p-3 text-sm font-medium"><SortHeader column="roomName" label="Room" /></th>
                  <th className="text-center p-3 text-sm font-medium"><SortHeader column="componentCount" label="Components" /></th>
                  <th className="text-center p-3 text-sm font-medium"><SortHeader column="updated_at" label="Updated" /></th>
                  <th className="text-center w-[100px] p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((unit) => (
                  <tr key={unit.id} className="border-b hover:bg-muted/30" tabIndex={0}>
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
                    <td className="p-3 text-center text-sm text-muted-foreground">{formatDate(unit.updated_at)}</td>
                    <td className="p-3 text-center w-[100px]">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingUnit(unit)}
                          className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingUnit(unit)}
                          className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                onClick={() => window.location.href = `/dashboard/units?page=${currentPage - 1}`}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages}
                onClick={() => window.location.href = `/dashboard/units?page=${currentPage + 1}`}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <AddUnitForm onClose={() => setIsFormOpen(false)} onSuccess={handleSuccess} rooms={rooms} />
      )}

      {editingUnit && (
        <EditUnitForm unit={editingUnit} onClose={() => setEditingUnit(null)} onSuccess={handleSuccess} rooms={rooms} />
      )}

      {deletingUnit && (
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
