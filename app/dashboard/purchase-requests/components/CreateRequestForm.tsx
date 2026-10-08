'use client';

import { useState, useTransition } from 'react';
import { createPurchaseRequest } from '@/app/_actions/purchase-requests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/lib/toast-context';
import { X, Plus, Trash2 } from 'lucide-react';

export interface StockPart {
  id: string;
  sku: string;
  name: string;
  quantity: number;
}

interface LineItem {
  key: string;
  itemName: string;
  quantity: number;
  unitPrice: string;
  inventoryItemId: string;
}

interface CreateRequestFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  stockParts?: StockPart[];
}

const CUSTOM_VALUE = '__custom__';

export function CreateRequestForm({ onClose, onSuccess, stockParts = [] }: CreateRequestFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { key: crypto.randomUUID(), itemName: '', quantity: 1, unitPrice: '', inventoryItemId: '' },
  ]);

  function addLineItem() {
    setLineItems(prev => [...prev, { key: crypto.randomUUID(), itemName: '', quantity: 1, unitPrice: '', inventoryItemId: '' }]);
  }

  function removeLineItem(key: string) {
    setLineItems(prev => prev.filter(item => item.key !== key));
  }

  function updateLineItem(key: string, field: keyof LineItem, value: string) {
    setLineItems(prev => prev.map(item =>
      item.key === key ? { ...item, [field]: value } : item
    ));
  }

  function selectStockPart(key: string, value: string) {
    if (value === CUSTOM_VALUE) {
      setLineItems(prev => prev.map(item =>
        item.key === key ? { ...item, inventoryItemId: '' } : item
      ));
      return;
    }
    const part = stockParts.find(p => p.id === value);
    if (!part) return;
    setLineItems(prev => prev.map(item =>
      item.key === key ? { ...item, inventoryItemId: part.id, itemName: part.name } : item
    ));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const filtered = lineItems.filter(item => item.itemName.trim());
    if (filtered.length === 0) {
      addToast('At least one line item is required', 'error');
      setErrors({ general: 'At least one line item is required' });
      return;
    }

    const items = filtered.map(item => ({
      itemName: item.itemName.trim(),
      quantity: item.quantity,
      ...(item.unitPrice ? { unitPrice: parseFloat(item.unitPrice) } : {}),
      ...(item.inventoryItemId ? { inventoryItemId: item.inventoryItemId } : {}),
    }));

    const formData = new FormData();
    formData.set('items', JSON.stringify(items));
    formData.set('notes', notes);

    startTransition(async () => {
      const result = await createPurchaseRequest(formData);
      if (!result.success) {
        addToast(result.error || 'Failed to create request', 'error');
        setErrors({ general: result.error || 'Failed to create request' });
      } else {
        addToast(`Purchase request ${(result.data as { pr_number: string }).pr_number} created!`, 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">New Purchase Request</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{errors.general}</div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Line Items</label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="gap-1">
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>

            {lineItems.map((item, index) => (
              <div key={item.key} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/20">
                <div className="flex-1 space-y-2">
                  <Select
                    value={item.inventoryItemId || CUSTOM_VALUE}
                    onValueChange={(v) => selectStockPart(item.key, v)}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stock part…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CUSTOM_VALUE}>Custom / not in stock</SelectItem>
                      {stockParts.map(part => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.sku} — {part.name} (qty {part.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Item name"
                    value={item.itemName}
                    onChange={(e) => updateLineItem(item.key, 'itemName', e.target.value)}
                    required
                    disabled={isPending || !!item.inventoryItemId}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Qty</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.key, 'quantity', e.target.value)}
                        required
                        disabled={isPending}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Unit Price (optional)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.key, 'unitPrice', e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                  </div>
                </div>
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.key)}
                    className="p-1.5 hover:bg-red-100 rounded-md text-muted-foreground hover:text-red-600 mt-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea id="notes" name="notes" rows={2} placeholder="Reason for request..." value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Creating...' : 'Create & Save as Draft'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
