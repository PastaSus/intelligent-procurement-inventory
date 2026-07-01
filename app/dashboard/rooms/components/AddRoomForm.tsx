'use client';

import { useState, useTransition } from 'react';
import { createLabRoom } from '@/app/_actions/rooms';
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
        addToast('Laboratory room created successfully!', 'success');
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
            <Input id="name" name="name" placeholder="e.g., Laboratory 127A" required disabled={isPending} />
          </div>

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
