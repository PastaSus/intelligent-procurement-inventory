'use client';

import { useState, useTransition } from 'react';
import { updateLabRoom } from '@/app/_actions/rooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast-context';
import { X } from 'lucide-react';

interface LabRoom {
  id: string;
  name: string;
}

interface EditRoomFormProps {
  room: LabRoom;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditRoomForm({ room, onClose, onSuccess }: EditRoomFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    formData.set('id', room.id);

    startTransition(async () => {
      const result = await updateLabRoom(formData);
      if (!result.success) {
        addToast(result.error || 'Failed to update room', 'error');
        setErrors({ general: result.error || 'Failed to update room' });
      } else {
        addToast('Laboratory room updated successfully!', 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Edit Laboratory Room</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{errors.general}</div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Room Name <span className="text-destructive">*</span></label>
            <Input id="name" name="name" defaultValue={room.name} required disabled={isPending} />
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
