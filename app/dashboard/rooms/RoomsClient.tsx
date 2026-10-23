'use client';

import { useState, useMemo, useTransition } from 'react';
import { Plus, Building2, Search, X, ChevronLeft, ChevronRight, Pencil, Trash2, Monitor } from 'lucide-react';
import { AddRoomForm } from './components/AddRoomForm';
import { EditRoomForm } from './components/EditRoomForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { deleteLabRoom } from '@/app/_actions/rooms';

interface LabRoom {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  _count: { units: number };
}

interface RoomsClientProps {
  initialRooms: LabRoom[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isAdmin?: boolean;
}

type RoomSortColumn = 'name' | 'unitCount' | 'updated_at';

const sortColumns: { value: RoomSortColumn; label: string }[] = [
  { value: 'name', label: 'Room Name' },
  { value: 'unitCount', label: 'Computer Units' },
  { value: 'updated_at', label: 'Updated' },
];

export function RoomsClient({ initialRooms, totalCount, currentPage, pageSize, isAdmin = true }: RoomsClientProps) {
  const [rooms] = useState(initialRooms);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<LabRoom | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<LabRoom | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<RoomSortColumn>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingRoom(null);
    setTimeout(() => {
      window.location.href = '/dashboard/rooms';
    }, 300);
  };

  const handleDelete = () => {
    if (!deletingRoom) return;

    const formData = new FormData();
    formData.set('id', deletingRoom.id);

    startTransition(async () => {
      const result = await deleteLabRoom(formData);
      if (result.success) {
        setDeletingRoom(null);
        setTimeout(() => {
          window.location.href = '/dashboard/rooms';
        }, 300);
      } else {
        alert(result.error || 'Failed to delete room');
      }
    });
  };

  const filteredItems = useMemo(() => {
    let result = [...rooms];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        room => room.name.toLowerCase().includes(searchLower)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'unitCount':
          comparison = a._count.units - b._count.units;
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [rooms, search, sortBy, sortOrder]);

  const totalPages = Math.ceil(totalCount / pageSize);

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
          <h2 className="text-3xl font-bold">Laboratory Rooms</h2>
          <p className="text-muted-foreground">Manage computer lab locations</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Room
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search rooms..."
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

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as RoomSortColumn)}>
          <SelectTrigger className="w-[160px]" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortColumns.map((column) => (
              <SelectItem key={column.value} value={column.value}>{column.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Total: {totalCount} rooms</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">Showing {filteredItems.length}</span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No laboratory rooms found.</p>
            <p className="text-sm">Click &quot;Add Room&quot; to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium">Room Name</th>
                  <th className="text-center p-3 text-sm font-medium">Computer Units</th>
                  <th className="text-center p-3 text-sm font-medium">Updated</th>
                  <th className="text-center w-[100px] p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((room) => (
                  <tr key={room.id} className="border-b last:border-b-0 hover:bg-muted/30" tabIndex={0}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{room.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{room._count.units}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-sm text-muted-foreground">{formatDate(room.updated_at)}</td>
                    <td className="p-3 text-center w-[100px]">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingRoom(room)}
                          className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeletingRoom(room)}
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
                onClick={() => window.location.href = `/dashboard/rooms?page=${currentPage - 1}`}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages}
                onClick={() => window.location.href = `/dashboard/rooms?page=${currentPage + 1}`}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <AddRoomForm onClose={() => setIsFormOpen(false)} onSuccess={handleSuccess} />
      )}

      {editingRoom && (
        <EditRoomForm room={editingRoom} onClose={() => setEditingRoom(null)} onSuccess={handleSuccess} />
      )}

      {deletingRoom && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg border p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Delete Room</h3>
            </div>
            <p className="text-muted-foreground mb-2">
              Are you sure you want to delete <strong className="text-foreground">{deletingRoom.name}</strong>?
            </p>
            {deletingRoom._count.units > 0 && (
              <p className="text-sm text-red-600 mb-4">
                This room has {deletingRoom._count.units} computer unit{deletingRoom._count.units !== 1 ? 's' : ''}. Remove all units before deleting.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeletingRoom(null)} disabled={isPending}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isPending || deletingRoom._count.units > 0}>
                {isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
