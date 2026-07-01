'use client';

import { useState, useTransition } from 'react';
import { updateComponent } from '@/app/_actions/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast-context';
import { X, ShoppingCart, Package } from 'lucide-react';

interface Component {
  id: string;
  type: string;
  serial_number: string;
  specifications: string;
  status: string;
}

interface EditComponentFormProps {
  component: Component;
  onClose: () => void;
  onSuccess?: () => void;
  componentTypes: readonly string[];
}

interface SparePartsAlert {
  message: string;
  variant: 'in_stock' | 'partial' | 'out_of_stock';
}

const alertStyles: Record<string, string> = {
  in_stock: 'bg-green-50 border-green-200 text-green-800',
  partial: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  out_of_stock: 'bg-red-50 border-red-200 text-red-800',
};

export function EditComponentForm({ component, onClose, onSuccess, componentTypes }: EditComponentFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [replenishmentAlert, setReplenishmentAlert] = useState<SparePartsAlert | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setReplenishmentAlert(null);

    const formData = new FormData(e.currentTarget);
    formData.set('id', component.id);

    startTransition(async () => {
      const result = await updateComponent(formData);
      if (!result.success) {
        addToast(result.error || 'Failed to update component', 'error');
        setErrors({ general: result.error || 'Failed to update component' });
      } else {
        addToast('Component updated successfully!', 'success');
        if (result.sparePartsAlert) {
          setReplenishmentAlert(result.sparePartsAlert);
        } else {
          if (onSuccess) onSuccess();
          onClose();
        }
      }
    });
  }

  function handleClose() {
    if (onSuccess) onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Edit Component</h2>
          <button onClick={handleClose} className="p-1 hover:bg-muted rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        {replenishmentAlert && (
          <div className={`mb-4 p-4 rounded-lg border ${alertStyles[replenishmentAlert.variant]}`}>
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-white/50 mt-0.5">
                {replenishmentAlert.variant === 'in_stock' ? (
                  <Package className="h-4 w-4" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {replenishmentAlert.variant === 'in_stock' ? 'In Stock' : 'Replenishment Needed'}
                </p>
                <p className="text-sm mt-1">{replenishmentAlert.message}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button type="button" size="sm" onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}

        {!replenishmentAlert && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{errors.general}</div>
            )}

            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">Component Type</label>
              <select id="type" name="type" defaultValue={component.type}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isPending}>
                {componentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="serialNumber" className="block text-sm font-medium mb-1">Serial Number <span className="text-destructive">*</span></label>
              <Input id="serialNumber" name="serialNumber" defaultValue={component.serial_number} required disabled={isPending} />
            </div>

            <div>
              <label htmlFor="specifications" className="block text-sm font-medium mb-1">Specifications <span className="text-destructive">*</span></label>
              <Input id="specifications" name="specifications" defaultValue={component.specifications} required disabled={isPending} />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
              <select id="status" name="status" defaultValue={component.status}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isPending}>
                <option value="FUNCTIONAL">Functional</option>
                <option value="NEEDS_REPAIR">Needs Repair</option>
                <option value="NEEDS_REPLACEMENT">Needs Replacement</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
