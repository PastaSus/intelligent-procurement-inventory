import { z } from 'zod';

const ComponentTypeEnum = z.enum([
  'MOTHERBOARD', 'PROCESSOR', 'MEMORY', 'HDD',
  'MONITOR', 'KEYBOARD', 'MOUSE', 'AVR', 'OPTICAL_DRIVE',
]);

export const createInventoryItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  reorder_point: z.number().int().min(0, 'Reorder point cannot be negative'),
  component_type: ComponentTypeEnum.optional().nullable(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export type CreateInventoryItem = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItem = z.infer<typeof updateInventoryItemSchema>;
