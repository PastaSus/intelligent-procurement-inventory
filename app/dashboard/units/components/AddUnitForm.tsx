'use client';

import { useState, useTransition } from 'react';
import { createComputerUnit } from '@/app/_actions/units';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast-context';
import { X } from 'lucide-react';

interface Room {
  id: string;
  name: string;
}

interface AddUnitFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  rooms: Room[];
}

export function AddUnitForm({ onClose, onSuccess, rooms }: AddUnitFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createComputerUnit(formData);
      if (!result.success) {
        addToast(result.error || 'Failed to create unit', 'error');
        setErrors({ general: result.error || 'Failed to create unit' });
      } else {
        addToast('Computer unit created successfully!', 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Computer Unit</h2>
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
            <Input id="unitName" name="unitName" placeholder="e.g., LR1U01" required disabled={isPending} />
            <p className="text-xs text-muted-foreground mt-1">Use a unique identifier like &quot;LR1U01&quot; for room 1, unit 1</p>
          </div>

          <div>
            <label htmlFor="laboratoryRoomId" className="block text-sm font-medium mb-1">Laboratory Room <span className="text-destructive">*</span></label>
            <select id="laboratoryRoomId" name="laboratoryRoomId" required
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isPending}>
              <option value="">-- Select Room --</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Creating...' : 'Create Unit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
