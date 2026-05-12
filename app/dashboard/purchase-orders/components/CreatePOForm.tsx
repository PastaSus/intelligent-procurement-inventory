'use client';

import { useState, useTransition, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { createPurchaseOrder, updatePurchaseOrder } from '@/app/_actions/purchase-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast-context';
import { Decimal } from 'decimal.js';

interface LineItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  status: string;
  vendor: {
    id: string;
    name: string;
  };
  line_items: Array<{
    item_name: string;
    quantity: number;
    unit_price: unknown;
  }>;
}

interface CreatePOFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  prefilledData?: {
    vendorId: string;
    vendorName: string;
    items: LineItem[];
  };
  editingPO?: PurchaseOrder | null;
}

export function CreatePOForm({ onClose, onSuccess, prefilledData, editingPO }: CreatePOFormProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(!prefilledData && !editingPO);
  const [vendorId, setVendorId] = useState(editingPO?.vendor.id || prefilledData?.vendorId || '');
  const [vendorName, setVendorName] = useState(editingPO?.vendor.name || prefilledData?.vendorName || '');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>(
    editingPO
      ? editingPO.line_items.map((item) => ({
          itemName: item.item_name,
          quantity: item.quantity,
          unitPrice: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : (item.unit_price as number),
        }))
      : prefilledData?.items || [{ itemName: '', quantity: 1, unitPrice: 0 }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditingMode = !!editingPO;
  const canEdit = isEditing || (!prefilledData && !editingPO);

  const handleAddLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, { itemName: '', quantity: 1, unitPrice: 0 }]);
  }, []);

  const handleRemoveLineItem = useCallback((index: number) => {
    if (lineItems.length === 1) {
      setErrors((prev) => ({ ...prev, items: 'At least one line item is required' }));
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.items;
      return newErrors;
    });
  }, [lineItems.length]);

  const handleLineItemChange = useCallback((index: number, field: keyof LineItem, newValue: string | number) => {
    setLineItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: newValue };
      return newItems;
    });
  }, []);

  const calculateLineTotal = (quantity: number, unitPrice: number) => {
    return new Decimal(quantity).times(unitPrice).toDecimalPlaces(2).toNumber();
  };

  const calculateGrandTotal = () => {
    return lineItems.reduce((sum, item) => {
      return sum + calculateLineTotal(item.quantity, item.unitPrice);
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrors({});

    if (!vendorId) {
      setErrors({ vendorId: 'Vendor is required' });
      return;
    }

    const validItems = lineItems.filter((item) => item.itemName.trim() !== '');
    if (validItems.length === 0) {
      setErrors({ items: 'At least one line item with a name is required' });
      return;
    }

    const filteredItems = lineItems.filter((item) => item.itemName.trim() !== '');
    const formData = new FormData();
    formData.set('vendorId', vendorId);
    formData.set('items', JSON.stringify(filteredItems));
    if (notes) {
      formData.set('notes', notes);
    }
    if (editingPO) {
      formData.set('id', editingPO.id);
    }

    setIsSubmitting(true);

    startTransition(async () => {
      const result = isEditingMode
        ? await updatePurchaseOrder(formData)
        : await createPurchaseOrder(formData);

      if (!result.success) {
        addToast(result.error || `Failed to ${isEditingMode ? 'update' : 'create'} purchase order`, 'error');
        setErrors({ general: result.error || `Failed to ${isEditingMode ? 'update' : 'create'} purchase order` });
        setIsSubmitting(false);
      } else {
        addToast(`Purchase order ${isEditingMode ? 'updated' : 'created'} successfully!`, 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {editingPO ? 'Edit Purchase Order' : prefilledData ? 'Create Purchase Order' : 'New Purchase Order'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">
              {errors.general}
            </div>
          )}

          <div>
            <label htmlFor="vendor" className="block text-sm font-medium mb-1">
              Vendor <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="vendor"
                  value={vendorName}
                  onChange={(e) => {
                    setVendorName(e.target.value);
                    setVendorId('');
                  }}
                  placeholder="Enter vendor name or ID"
                  disabled={!canEdit}
                  className={errors.vendorId ? 'border-destructive' : ''}
                  aria-invalid={!!errors.vendorId}
                />
                {errors.vendorId && (
                  <p className="text-sm text-destructive mt-1" role="alert">{errors.vendorId}</p>
                )}
              </div>
              {!canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>
            <input
              type="hidden"
              id="vendorId"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Line Items <span className="text-destructive">*</span>
              </label>
              {canEdit ? (
                <Button type="button" variant="ghost" size="sm" onClick={handleAddLineItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              ) : null}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left p-2 font-medium">Item Name</th>
                    <th className="text-center p-2 font-medium w-24">Quantity</th>
                    <th className="text-center p-2 font-medium w-32">Unit Price</th>
                    <th className="text-right p-2 font-medium w-28">Total</th>
                    {canEdit && <th className="w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="p-2">
                        <Input
                          value={item.itemName}
                          onChange={(e) => handleLineItemChange(index, 'itemName', e.target.value)}
                          placeholder="Item name"
                          disabled={isPending || !canEdit}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="1"
                          max="999999"
                          value={item.quantity}
                          onChange={(e) =>
                            handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 0)
                          }
                          disabled={isPending || !canEdit}
                          className="text-center"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          max="999999999.99"
                          step="0.01"
                          value={item.unitPrice || ''}
                          onChange={(e) =>
                            handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          disabled={isPending || !canEdit}
                          className="text-right"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(calculateLineTotal(item.quantity, item.unitPrice))}
                      </td>
                      {canEdit && (
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(index)}
                            className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-red-600"
                            disabled={isPending}
                            aria-label="Remove line item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50">
                    <td colSpan={3} className="p-2 text-right font-medium">
                      Grand Total:
                    </td>
                    <td className="p-2 text-right font-semibold text-lg">
                      {formatCurrency(calculateGrandTotal())}
                    </td>
                    {canEdit && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
            {errors.items && (
              <p className="text-sm text-destructive" role="alert">{errors.items}</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes or special instructions..."
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || isSubmitting} className="flex-1">
              {isPending ? (isEditingMode ? 'Updating...' : 'Creating...') : (isEditingMode ? 'Update PO' : 'Create PO')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
