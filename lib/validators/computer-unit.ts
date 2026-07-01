import { z } from 'zod';

export const createComputerUnitSchema = z.object({
  unitName: z.string().trim().min(1, 'Unit name is required').max(50, 'Unit name is too long'),
  laboratoryRoomId: z.string().min(1, 'Laboratory room is required'),
});

export const updateComputerUnitSchema = z.object({
  id: z.string().min(1, 'Unit ID is required'),
  unitName: z.string().trim().min(1, 'Unit name is required').max(50, 'Unit name is too long'),
  laboratoryRoomId: z.string().min(1, 'Laboratory room is required'),
});

export type CreateComputerUnit = z.infer<typeof createComputerUnitSchema>;
export type UpdateComputerUnit = z.infer<typeof updateComputerUnitSchema>;
