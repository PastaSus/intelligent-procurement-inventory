import { z } from 'zod';

const createUnitFields = {
  unitName: z.string().trim().min(1, 'Unit name is required').max(50, 'Unit name is too long'),
  laboratoryRoomId: z.string().trim().min(1, 'Laboratory room is required').max(50, 'Room ID too long'),
};

export const createComputerUnitSchema = z.object(createUnitFields);

export const createComputerUnitsBatchSchema = z.object({
  prefix: z
    .string()
    .trim()
    .min(1, 'Prefix is required')
    .max(20, 'Prefix is too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Prefix can only contain letters, numbers, hyphens, and underscores'),
  startNumber: z.coerce
    .number()
    .int('Start number must be a whole number')
    .min(1, 'Start number must be at least 1')
    .max(9999, 'Start number is too large'),
  count: z.coerce
    .number()
    .int('Number of units must be a whole number')
    .min(1, 'Create at least 1 unit')
    .max(100, 'Create at most 100 units at a time'),
  laboratoryRoomId: createUnitFields.laboratoryRoomId,
});

export const updateComputerUnitSchema = z.object({
  id: z.string().min(1, 'Unit ID is required'),
  unitName: z.string().trim().min(1, 'Unit name is required').max(50, 'Unit name is too long').optional(),
  laboratoryRoomId: z.string().trim().min(1, 'Laboratory room is required').max(50, 'Room ID too long').optional(),
});

export const deleteComputerUnitsBatchSchema = z.object({
  ids: z
    .array(z.string().min(1, 'Unit ID is required'))
    .min(1, 'Select at least one unit')
    .max(200, 'Delete at most 200 units at a time'),
});

export type CreateComputerUnit = z.infer<typeof createComputerUnitSchema>;
export type CreateComputerUnitsBatch = z.infer<typeof createComputerUnitsBatchSchema>;
export type UpdateComputerUnit = z.infer<typeof updateComputerUnitSchema>;
export type DeleteComputerUnitsBatch = z.infer<typeof deleteComputerUnitsBatchSchema>;
