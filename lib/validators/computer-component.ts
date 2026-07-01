import { z } from 'zod';
import { ComponentTypeEnum, ComponentStatusEnum } from './enums';

export const createComponentSchema = z.object({
  computerUnitId: z.string().trim().min(1, 'Computer unit is required').max(50, 'Computer unit ID too long'),
  type: ComponentTypeEnum,
  serialNumber: z.string().trim().min(1, 'Serial number is required').max(100, 'Serial number too long'),
  specifications: z.string().trim().min(1, 'Specifications are required').max(500, 'Specifications too long'),
  status: ComponentStatusEnum.default('FUNCTIONAL'),
});

export const updateComponentSchema = z.object({
  id: z.string().min(1, 'Component ID is required'),
  computerUnitId: z.string().trim().min(1, 'Computer unit is required').max(50, 'Computer unit ID too long').optional(),
  type: ComponentTypeEnum.optional(),
  serialNumber: z.string().trim().min(1, 'Serial number is required').max(100, 'Serial number too long').optional(),
  specifications: z.string().trim().min(1, 'Specifications are required').max(500, 'Specifications too long').optional(),
  status: ComponentStatusEnum.optional(),
});

export type CreateComponent = z.infer<typeof createComponentSchema>;
export type UpdateComponent = z.infer<typeof updateComponentSchema>;
