import { z } from 'zod';
import { LicenseTypeEnum } from './enums';

export const createSoftwareSchema = z.object({
  computerUnitId: z.string().trim().min(1, 'Computer unit is required').max(50, 'Computer unit ID too long'),
  name: z.string().trim().min(1, 'Application name is required').max(200, 'Application name too long'),
  version: z.string().trim().max(50, 'Version too long').optional(),
  licenseKey: z.string().trim().max(200, 'License key too long').optional(),
  licenseType: LicenseTypeEnum.default('NONE'),
  installDate: z.string().trim().max(30, 'Install date too long').optional().refine(
    (v) => !v || !Number.isNaN(Date.parse(v)),
    { message: 'Install date must be a valid date' }
  ),
});

export const updateSoftwareSchema = z.object({
  id: z.string().min(1, 'Application ID is required'),
  name: z.string().trim().min(1, 'Application name is required').max(200, 'Application name too long').optional(),
  version: z.string().trim().max(50, 'Version too long').optional(),
  licenseKey: z.string().trim().max(200, 'License key too long').optional(),
  licenseType: LicenseTypeEnum.optional(),
  installDate: z.string().trim().max(30, 'Install date too long').optional().refine(
    (v) => !v || !Number.isNaN(Date.parse(v)),
    { message: 'Install date must be a valid date' }
  ),
});

export type CreateSoftware = z.infer<typeof createSoftwareSchema>;
export type UpdateSoftware = z.infer<typeof updateSoftwareSchema>;
