import { z } from 'zod';

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  contact_name: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

export const vendorIdSchema = z.object({
  id: z.string().min(1, 'Vendor ID is required'),
});

export type CreateVendor = z.infer<typeof createVendorSchema>;
export type UpdateVendor = z.infer<typeof updateVendorSchema>;
export type VendorId = z.infer<typeof vendorIdSchema>;