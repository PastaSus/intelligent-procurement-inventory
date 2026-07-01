'use client';

import { useState, useTransition } from 'react';
import { updateInventoryItem } from '@/app/_actions/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast-context';
import { X } from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  quantity: number;
  reorder_point: number;
  component_type: string | null;
}

interface EditProductFormProps {
  item: InventoryItem;
  onClose: () => void;
  onSuccess?: () => void;
  componentTypes: readonly string[];
}

export function EditProductForm({ item, onClose, onSuccess, componentTypes }: EditProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    formData.set('id', item.id);

    startTransition(async () => {
      const result = await updateInventoryItem(formData);
      if (!result.success) {
        addToast(result.error || 'Failed to update item', 'error');
        setErrors({ general: result.error || 'Failed to update item' });
      } else {
        addToast('Spare part updated successfully!', 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Edit Spare Part</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{errors.general}</div>
          )}

          <div>
            <label htmlFor="sku" className="block text-sm font-medium mb-1">SKU</label>
            <Input id="sku" name="sku" defaultValue={item.sku} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">SKU cannot be changed</p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Name <span className="text-destructive">*</span></label>
            <Input id="name" name="name" defaultValue={item.name} required disabled={isPending} />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
            <textarea id="description" name="description" defaultValue={item.description || ''} rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending} />
          </div>

          <div>
            <label htmlFor="component_type" className="block text-sm font-medium mb-1">Component Type</label>
            <select id="component_type" name="component_type" defaultValue={item.component_type || ''}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isPending}>
              <option value="">-- None --</option>
              {componentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium mb-1">Quantity <span className="text-destructive">*</span></label>
              <Input id="quantity" name="quantity" type="number" min="0" defaultValue={item.quantity} required disabled={isPending} />
            </div>
            <div>
              <label htmlFor="reorder_point" className="block text-sm font-medium mb-1">Reorder Point <span className="text-destructive">*</span></label>
              <Input id="reorder_point" name="reorder_point" type="number" min="0" defaultValue={item.reorder_point} required disabled={isPending} />
            </div>
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
