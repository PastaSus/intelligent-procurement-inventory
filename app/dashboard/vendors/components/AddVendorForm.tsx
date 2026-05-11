'use client';

import { useState, useTransition } from 'react';
import { createVendor } from '@/app/_actions/vendor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast-context';
import { X } from 'lucide-react';

interface AddVendorFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddVendorForm({ onClose, onSuccess }: AddVendorFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createVendor(formData);

      if (!result.success) {
        addToast(result.error || 'Failed to create vendor', 'error');
        setErrors({ general: result.error || 'Failed to create vendor' });
      } else {
        addToast('Vendor created successfully!', 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add New Vendor</h2>
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
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Vendor Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Acme Supplies Co."
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="contact_name" className="block text-sm font-medium mb-1">
              Contact Name
            </label>
            <Input
              id="contact_name"
              name="contact_name"
              placeholder="e.g., John Smith"
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="e.g., john@example.com"
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone
            </label>
            <Input
              id="phone"
              name="phone"
              placeholder="e.g., 555-0100"
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-1">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              placeholder="Vendor address..."
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Creating...' : 'Create Vendor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}