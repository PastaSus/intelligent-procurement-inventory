import { z } from 'zod';
import { Decimal } from 'decimal.js';

const MAX_QUANTITY = 999999;
const MAX_UNIT_PRICE = 999999999.99;
const MAX_NOTES_LENGTH = 2000;

export const createPOItemSchema = z.object({
  itemName: z.string().trim().min(1, 'Item name is required').max(200, 'Item name is too long'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(MAX_QUANTITY, `Quantity cannot exceed ${MAX_QUANTITY}`),
  unitPrice: z.number().min(0.01, 'Unit price must be at least $0.01').max(MAX_UNIT_PRICE, 'Unit price exceeds maximum allowed'),
});

export const createPOSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  items: z.array(createPOItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().trim().max(MAX_NOTES_LENGTH, `Notes cannot exceed ${MAX_NOTES_LENGTH} characters`).optional(),
});

export const updatePOSchema = z.object({
  id: z.string().min(1, 'PO ID is required'),
  vendorId: z.string().min(1, 'Vendor is required'),
  items: z.array(createPOItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().trim().max(MAX_NOTES_LENGTH, `Notes cannot exceed ${MAX_NOTES_LENGTH} characters`).optional(),
});

export const approvePOSchema = z.object({
  id: z.string().min(1, 'PO ID is required'),
});

export const sendPOSchema = z.object({
  id: z.string().min(1, 'PO ID is required'),
});

export type CreatePO = z.infer<typeof createPOSchema>;
export type UpdatePO = z.infer<typeof updatePOSchema>;
export type CreatePOItem = z.infer<typeof createPOItemSchema>;
export type ApprovePO = z.infer<typeof approvePOSchema>;
export type SendPO = z.infer<typeof sendPOSchema>;

export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return new Decimal(quantity).times(unitPrice).toDecimalPlaces(2).toNumber();
}

export function calculateGrandTotal(
  items: Array<{ quantity: number; unitPrice: number }>
): number {
  return items.reduce((sum, item) => {
    return new Decimal(sum).plus(calculateLineTotal(item.quantity, item.unitPrice)).toNumber();
  }, 0);
}

export function safeFormatCurrency(value: unknown): string {
  const num = new Decimal(String(value ?? '0')).toDecimalPlaces(2).toNumber();
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

export function escapeText(value: string | null | undefined): string {
  if (!value) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
