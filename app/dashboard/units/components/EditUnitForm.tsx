'use client';

import { useState, useTransition } from 'react';
import { updateComputerUnit } from '@/app/_actions/units';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast-context';
import { X } from 'lucide-react';

interface Room {
  id: string;
  name: string;
}

interface ComputerUnit {
  id: string;
  unit_name: string;
  laboratory_room_id: string;
}

interface EditUnitFormProps {
  unit: ComputerUnit;
  onClose: () => void;
  onSuccess?: () => void;
  rooms: Room[];
}

export function EditUnitForm({ unit, onClose, onSuccess, rooms }: EditUnitFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    formData.set('id', unit.id);

    startTransition(async () => {
      const result = await updateComputerUnit(formData);
      if (!result.success) {
        addToast(result.error || 'Failed to update unit', 'error');
        setErrors({ general: result.error || 'Failed to update unit' });
      } else {
        addToast('Computer unit updated successfully!', 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Edit Computer Unit</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{errors.general}</div>
          )}

          <div>
            <label htmlFor="unitName" className="block text-sm font-medium mb-1">Unit Name <span className="text-destructive">*</span></label>
            <Input id="unitName" name="unitName" defaultValue={unit.unit_name} required disabled={isPending} />
          </div>

          <div>
            <label htmlFor="laboratoryRoomId" className="block text-sm font-medium mb-1">Laboratory Room <span className="text-destructive">*</span></label>
            <select id="laboratoryRoomId" name="laboratoryRoomId" defaultValue={unit.laboratory_room_id}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isPending}>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
