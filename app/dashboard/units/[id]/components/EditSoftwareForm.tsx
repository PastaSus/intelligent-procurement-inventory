'use client';

import { useState, useTransition } from 'react';
import { updateInstalledApplication } from '@/app/_actions/software';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/lib/toast-context';
import { X } from 'lucide-react';
import type { SoftwareItem } from './SoftwareList';

interface EditSoftwareFormProps {
  application: SoftwareItem;
  onClose: () => void;
  onSuccess?: () => void;
}

const LICENSE_TYPES = ['NONE', 'FREE', 'COMMERCIAL', 'OPEN_SOURCE', 'EDUCATIONAL'] as const;

function toDateInputValue(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function EditSoftwareForm({ application, onClose, onSuccess }: EditSoftwareFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [licenseType, setLicenseType] = useState(application.license_type);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    formData.set('id', application.id);

    startTransition(async () => {
      const result = await updateInstalledApplication(formData);
      if (!result.success) {
        addToast(result.error || 'Failed to update application', 'error');
        setErrors({ general: result.error || 'Failed to update application' });
      } else {
        addToast('Application updated successfully!', 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Edit Software</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{errors.general}</div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Application Name <span className="text-destructive">*</span></label>
            <Input id="name" name="name" defaultValue={application.name} required disabled={isPending} />
          </div>

          <div>
            <label htmlFor="version" className="block text-sm font-medium mb-1">Version</label>
            <Input id="version" name="version" defaultValue={application.version ?? ''} disabled={isPending} />
          </div>

          <div>
            <label htmlFor="licenseType" className="block text-sm font-medium mb-1">License Type</label>
            <input type="hidden" name="licenseType" value={licenseType} />
            <Select value={licenseType} onValueChange={setLicenseType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select license type" />
              </SelectTrigger>
              <SelectContent>
                {LICENSE_TYPES.map(lt => (
                  <SelectItem key={lt} value={lt}>{lt.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="licenseKey" className="block text-sm font-medium mb-1">License Key</label>
            <Input id="licenseKey" name="licenseKey" defaultValue={application.license_key ?? ''} disabled={isPending} />
          </div>

          <div>
            <label htmlFor="installDate" className="block text-sm font-medium mb-1">Install Date</label>
            <Input id="installDate" name="installDate" type="date" defaultValue={toDateInputValue(application.install_date)} disabled={isPending} />
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
