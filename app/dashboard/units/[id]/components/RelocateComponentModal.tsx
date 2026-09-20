'use client';

import { useState, useTransition } from 'react';
import { relocateComponent } from '@/app/_actions/components';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/lib/toast-context';
import { X, MoveRight } from 'lucide-react';

interface Unit {
  id: string;
  unit_name: string;
  roomName: string;
}

interface Component {
  id: string;
  type: string;
  serial_number: string;
}

interface RelocateComponentModalProps {
  component: Component;
  currentUnitId: string;
  allUnits: Unit[];
  onClose: () => void;
  onSuccess?: () => void;
}

export function RelocateComponentModal({ component, currentUnitId, allUnits, onClose, onSuccess }: RelocateComponentModalProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [targetUnitId, setTargetUnitId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableUnits = allUnits.filter(u => u.id !== currentUnitId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    if (!targetUnitId) {
      setErrors({ targetUnitId: 'Please select a target unit' });
      return;
    }

    const formData = new FormData();
    formData.set('componentId', component.id);
    formData.set('targetUnitId', targetUnitId);

    startTransition(async () => {
      const result = await relocateComponent(formData);
      if (!result.success) {
        addToast(result.error || 'Failed to relocate component', 'error');
        setErrors({ general: result.error || 'Failed to relocate component' });
      } else {
        if (result.warning) {
          addToast(`Component relocated. ${result.warning}`, 'warning');
        } else {
          addToast('Component relocated successfully!', 'success');
        }
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MoveRight className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Relocate Component</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">{component.type}</p>
          <p className="text-xs text-muted-foreground font-mono">{component.serial_number}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{errors.general}</div>
          )}

          <div>
            <label htmlFor="targetUnit" className="block text-sm font-medium mb-1">
              Move to Unit <span className="text-destructive">*</span>
            </label>
            <Select value={targetUnitId} onValueChange={setTargetUnitId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select target unit" />
              </SelectTrigger>
              <SelectContent>
                {availableUnits.map(unit => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.unit_name} — {unit.roomName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.targetUnitId && (
              <p className="text-sm text-destructive mt-1">{errors.targetUnitId}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !targetUnitId} className="flex-1">
              {isPending ? 'Moving...' : 'Relocate'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
