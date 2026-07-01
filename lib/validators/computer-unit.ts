import { z } from 'zod';

const createUnitFields = {
  unitName: z.string().trim().min(1, 'Unit name is required').max(50, 'Unit name is too long'),
  laboratoryRoomId: z.string().trim().min(1, 'Laboratory room is required').max(50, 'Room ID too long'),
};

export const createComputerUnitSchema = z.object(createUnitFields);

export const updateComputerUnitSchema = z.object({
  id: z.string().min(1, 'Unit ID is required'),
  unitName: z.string().trim().min(1, 'Unit name is required').max(50, 'Unit name is too long').optional(),
  laboratoryRoomId: z.string().trim().min(1, 'Laboratory room is required').max(50, 'Room ID too long').optional(),
});

export type CreateComputerUnit = z.infer<typeof createComputerUnitSchema>;
export type UpdateComputerUnit = z.infer<typeof updateComputerUnitSchema>;
