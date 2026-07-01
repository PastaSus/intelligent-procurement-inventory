import { z } from 'zod';

export const createLabRoomSchema = z.object({
  name: z.string().trim().min(1, 'Room name is required').max(100, 'Room name is too long'),
});

export const updateLabRoomSchema = z.object({
  id: z.string().min(1, 'Room ID is required'),
  name: z.string().trim().min(1, 'Room name is required').max(100, 'Room name is too long'),
});

export type CreateLabRoom = z.infer<typeof createLabRoomSchema>;
export type UpdateLabRoom = z.infer<typeof updateLabRoomSchema>;
