'use client';

import { useState, useTransition } from 'react';
import { createInventoryItem } from '@/app/_actions/inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast-context';
import { X } from 'lucide-react';

interface AddProductFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddProductForm({ onClose, onSuccess }: AddProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createInventoryItem(formData);

      if (!result.success) {
        addToast(result.error || 'Failed to create item', 'error');
        setErrors({ general: result.error || 'Failed to create item' });
      } else {
        addToast('Inventory item created successfully!', 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add New Product</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {errors.general}
            </div>
          )}

          <div>
            <label htmlFor="sku" className="block text-sm font-medium mb-1">
              SKU <span className="text-destructive">*</span>
            </label>
            <Input
              id="sku"
              name="sku"
              placeholder="e.g., SKU-001"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Widget A"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Optional product description..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium mb-1">
                Quantity <span className="text-destructive">*</span>
              </label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                placeholder="0"
                required
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="reorder_point" className="block text-sm font-medium mb-1">
                Reorder Point <span className="text-destructive">*</span>
              </label>
              <Input
                id="reorder_point"
                name="reorder_point"
                type="number"
                min="0"
                placeholder="10"
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Category
            </label>
            <Input
              id="category"
              name="category"
              placeholder="e.g., Electronics, Parts"
              disabled={isPending}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Creating...' : 'Create Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}