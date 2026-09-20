import { z } from 'zod';

export const ComponentTypeEnum = z.enum([
  'MOTHERBOARD', 'PROCESSOR', 'MEMORY', 'HDD',
  'MONITOR', 'KEYBOARD', 'MOUSE', 'AVR', 'OPTICAL_DRIVE',
]);

export const ComponentStatusEnum = z.enum([
  'FUNCTIONAL', 'NEEDS_REPAIR', 'NEEDS_REPLACEMENT',
]);

export const LicenseTypeEnum = z.enum([
  'NONE', 'FREE', 'COMMERCIAL', 'OPEN_SOURCE', 'EDUCATIONAL',
]);
