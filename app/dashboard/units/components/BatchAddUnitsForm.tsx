'use client';

import { useMemo, useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { createComputerUnitsBatch } from '@/app/_actions/units';
import { buildUnitNames, deriveUnitPrefix } from '@/lib/unit-batch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/lib/toast-context';

interface Room {
  id: string;
  name: string;
}

interface BatchAddUnitsFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  rooms: Room[];
}

export function BatchAddUnitsForm({ onClose, onSuccess, rooms }: BatchAddUnitsFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [laboratoryRoomId, setLaboratoryRoomId] = useState('');
  const [prefix, setPrefix] = useState('');
  const [startNumber, setStartNumber] = useState('1');
  const [count, setCount] = useState('5');
  const [error, setError] = useState('');

  const normalizedPrefix = prefix.trim().toUpperCase();
  const start = Number(startNumber);
  const amount = Number(count);
  const numbersValid =
    startNumber.trim() !== '' &&
    count.trim() !== '' &&
    Number.isInteger(start) &&
    Number.isInteger(amount) &&
    start >= 1 &&
    start <= 9999 &&
    amount >= 1 &&
    amount <= 100;
  const prefixValid =
    normalizedPrefix.length > 0 &&
    normalizedPrefix.length <= 20 &&
    /^[A-Za-z0-9_-]+$/.test(normalizedPrefix);

  const previewNames = useMemo(() => {
    if (!prefixValid || !numbersValid) return [];
    return buildUnitNames({ prefix: normalizedPrefix, startNumber: start, count: amount });
  }, [prefixValid, normalizedPrefix, numbersValid, start, amount]);

  function handleRoomChange(roomId: string) {
    setLaboratoryRoomId(roomId);
    setError('');
    if (!prefix.trim()) {
      const room = rooms.find((candidate) => candidate.id === roomId);
      const suggestion = room ? deriveUnitPrefix(room.name) : '';
      if (suggestion) {
        setPrefix(suggestion);
      }
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!laboratoryRoomId) {
      setError('Select a laboratory room');
      return;
    }

    const formData = new FormData();
    formData.set('prefix', prefix);
    formData.set('startNumber', startNumber);
    formData.set('count', count);
    formData.set('laboratoryRoomId', laboratoryRoomId);

    startTransition(async () => {
      const result = await createComputerUnitsBatch(formData);
      if (!result.success) {
        setError(result.error || 'Failed to create units');
        addToast(result.error || 'Failed to create units', 'error');
      } else if (result.data) {
        const range = result.data.first === result.data.last
          ? result.data.first
          : `${result.data.first}–${result.data.last}`;
        addToast(`${result.data.count} unit${result.data.count === 1 ? '' : 's'} created (${range})`, 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  }

  const previewSummary =
    previewNames.length <= 6
      ? previewNames.join(', ')
      : `${previewNames.slice(0, 3).join(', ')}, …, ${previewNames[previewNames.length - 1]}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Batch Add Computer Units</h2>
            <p className="text-sm text-muted-foreground">Generate numbered units for a laboratory room.</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          <div>
            <label htmlFor="batchLaboratoryRoomId" className="block text-sm font-medium mb-1">
              Laboratory Room <span className="text-destructive">*</span>
            </label>
            <Select value={laboratoryRoomId} onValueChange={handleRoomChange}>
              <SelectTrigger id="batchLaboratoryRoomId" className="w-full">
                <SelectValue placeholder="-- Select Room --" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="batchPrefix" className="block text-sm font-medium mb-1">
              Unit Prefix <span className="text-destructive">*</span>
            </label>
            <Input
              id="batchPrefix"
              name="prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="e.g. MM3 or LR4U"
              maxLength={20}
              required
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Letters, numbers, hyphens, and underscores. Suggested from the room name.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="batchStartNumber" className="block text-sm font-medium mb-1">
                Start Number <span className="text-destructive">*</span>
              </label>
              <Input
                id="batchStartNumber"
                name="startNumber"
                type="number"
                min={1}
                max={9999}
                value={startNumber}
                onChange={(e) => setStartNumber(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
            <div>
              <label htmlFor="batchCount" className="block text-sm font-medium mb-1">
                Number of Units <span className="text-destructive">*</span>
              </label>
              <Input
                id="batchCount"
                name="count"
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-3" aria-live="polite">
            <p className="text-sm font-medium">Preview</p>
            {previewNames.length > 0 ? (
              <>
                <p className="mt-1 break-all font-mono text-sm">{previewSummary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {previewNames.length} unit{previewNames.length === 1 ? '' : 's'} will be created
                  {previewNames.length > 1
                    ? ` (${previewNames[0]} to ${previewNames[previewNames.length - 1]})`
                    : ''}.
                </p>
              </>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Enter a prefix, start number, and count to preview the generated names.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending
                ? 'Creating...'
                : previewNames.length > 0
                  ? `Create ${previewNames.length} Unit${previewNames.length === 1 ? '' : 's'}`
                  : 'Create Units'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
