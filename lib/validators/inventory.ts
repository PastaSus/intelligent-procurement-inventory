import { z } from 'zod';
import { ComponentTypeEnum } from './enums';

export const createInventoryItemSchema = z.object({
  sku: z.string().trim().min(1, 'SKU is required').max(50, 'SKU too long'),
  name: z.string().trim().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().trim().max(1000, 'Description too long').optional(),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  reorderPoint: z.number().int().min(0, 'Reorder point cannot be negative'),
  componentType: ComponentTypeEnum.nullable().optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export type CreateInventoryItem = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItem = z.infer<typeof updateInventoryItemSchema>;
