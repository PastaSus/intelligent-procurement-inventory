'use client';

import { useMemo, useState, useTransition } from 'react';
import { createLabRoom } from '@/app/_actions/rooms';
import { buildUnitNames, deriveUnitPrefix } from '@/lib/unit-batch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast-context';
import { X } from 'lucide-react';

interface AddRoomFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddRoomForm({ onClose, onSuccess }: AddRoomFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [unitCount, setUnitCount] = useState('0');

  const prefix = deriveUnitPrefix(name);
  const count = Number(unitCount);
  const previewNames = useMemo(() => {
    if (prefix.length === 0 || !Number.isInteger(count) || count < 1 || count > 100) return [];
    return buildUnitNames({ prefix, startNumber: 1, count });
  }, [prefix, count]);

  const previewSummary =
    previewNames.length <= 6
      ? previewNames.join(', ')
      : `${previewNames.slice(0, 3).join(', ')}, …, ${previewNames[previewNames.length - 1]}`;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createLabRoom(formData);
      if (!result.success) {
        addToast(result.error || 'Failed to create room', 'error');
        setErrors({ general: result.error || 'Failed to create room' });
      } else {
        addToast(
          previewNames.length > 0
            ? `Room created with ${previewNames.length} unit${previewNames.length === 1 ? '' : 's'}`
            : 'Laboratory room created successfully!',
          'success',
        );
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Laboratory Room</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{errors.general}</div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Room Name <span className="text-destructive">*</span></label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Laboratory 127A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="unitCount" className="block text-sm font-medium mb-1">Number of PCs / Units</label>
            <Input
              id="unitCount"
              name="unitCount"
              type="number"
              min={0}
              max={100}
              value={unitCount}
              onChange={(e) => setUnitCount(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional. Units are named from the room name (e.g. LR2 → LR201, LR202).
            </p>
          </div>

          {previewNames.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3" aria-live="polite">
              <p className="text-sm font-medium">Units to be created</p>
              <p className="mt-1 break-all font-mono text-sm">{previewSummary}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {previewNames.length} unit{previewNames.length === 1 ? '' : 's'} will be seeded into this room.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
