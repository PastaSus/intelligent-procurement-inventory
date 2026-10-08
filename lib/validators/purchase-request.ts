import { z } from 'zod';

export const createRequestItemSchema = z.object({
  itemName: z.string().trim().min(1, 'Item name is required').max(200, 'Item name is too long'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(999999, 'Quantity exceeds maximum'),
  unitPrice: z.number().positive('Unit price must be positive').optional(),
  inventoryItemId: z.string().min(1, 'Invalid stock part reference').optional(),
});

export const createPurchaseRequestSchema = z.object({
  items: z.array(createRequestItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().trim().max(2000, 'Notes cannot exceed 2000 characters').optional(),
});

export const approveRequestSchema = z.object({
  id: z.string().min(1, 'Request ID is required'),
});

export const rejectRequestSchema = z.object({
  id: z.string().min(1, 'Request ID is required'),
  reason: z.string().trim().min(1, 'Rejection reason is required').max(500, 'Reason too long'),
});

export type CreatePurchaseRequest = z.infer<typeof createPurchaseRequestSchema>;
export type CreateRequestItem = z.infer<typeof createRequestItemSchema>;
export type ApproveRequest = z.infer<typeof approveRequestSchema>;
export type RejectRequest = z.infer<typeof rejectRequestSchema>;
