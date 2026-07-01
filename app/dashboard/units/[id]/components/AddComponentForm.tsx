'use client';

import { useState, useTransition } from 'react';
import { createComponent } from '@/app/_actions/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast-context';
import { X } from 'lucide-react';

interface AddComponentFormProps {
  computerUnitId: string;
  onClose: () => void;
  onSuccess?: () => void;
  componentTypes: readonly string[];
}

export function AddComponentForm({ computerUnitId, onClose, onSuccess, componentTypes }: AddComponentFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    formData.set('computerUnitId', computerUnitId);

    startTransition(async () => {
      const result = await createComponent(formData);
      if (!result.success) {
        addToast(result.error || 'Failed to create component', 'error');
        setErrors({ general: result.error || 'Failed to create component' });
      } else {
        addToast('Component added successfully!', 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Component</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{errors.general}</div>
          )}

          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-1">Component Type <span className="text-destructive">*</span></label>
            <select id="type" name="type" required
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isPending}>
              <option value="">-- Select Type --</option>
              {componentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="serialNumber" className="block text-sm font-medium mb-1">Serial Number <span className="text-destructive">*</span></label>
            <Input id="serialNumber" name="serialNumber" placeholder="e.g., SN-12345-ABCDE" required disabled={isPending} />
          </div>

          <div>
            <label htmlFor="specifications" className="block text-sm font-medium mb-1">Specifications <span className="text-destructive">*</span></label>
            <Input id="specifications" name="specifications" placeholder="e.g., Intel Core i5 4460" required disabled={isPending} />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
            <select id="status" name="status" defaultValue="FUNCTIONAL"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isPending}>
              <option value="FUNCTIONAL">Functional</option>
              <option value="NEEDS_REPAIR">Needs Repair</option>
              <option value="NEEDS_REPLACEMENT">Needs Replacement</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Adding...' : 'Add Component'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
