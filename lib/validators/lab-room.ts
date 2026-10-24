import { z } from 'zod';
import { deriveUnitPrefix } from '@/lib/unit-batch';

export const createLabRoomSchema = z
  .object({
    name: z.string().trim().min(1, 'Room name is required').max(100, 'Room name is too long'),
    prefix: z
      .string()
      .trim()
      .max(20, 'Prefix is too long')
      .regex(/^[A-Za-z0-9_-]+$/, 'Prefix can only contain letters, numbers, hyphens, and underscores')
      .optional(),
    unitCount: z.coerce
      .number()
      .int('Number of units must be a whole number')
      .min(0, 'Number of units cannot be negative')
      .max(100, 'Create at most 100 units at a time')
      .default(0),
  })
  .refine((data) => data.unitCount === 0 || Boolean(data.prefix) || deriveUnitPrefix(data.name).length > 0, {
    message: 'Room name or unit prefix must contain letters or numbers to generate unit names',
    path: ['name'],
  });

export const updateLabRoomSchema = z.object({
  id: z.string().min(1, 'Room ID is required'),
  name: z.string().trim().min(1, 'Room name is required').max(100, 'Room name is too long').optional(),
});

export type CreateLabRoom = z.infer<typeof createLabRoomSchema>;
export type UpdateLabRoom = z.infer<typeof updateLabRoomSchema>;
