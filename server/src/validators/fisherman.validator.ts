import { z } from 'zod';

export const createFishermanSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  countryCode: z
    .string()
    .trim()
    .regex(/^\+\d{1,4}$/, 'Country code must start with + followed by 1 to 4 digits')
    .default('+91'),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^\d{7,15}$/, 'Mobile number must contain between 7 and 15 digits'),
  boatName: z.string().trim().max(100).optional().nullable(),
  boatRegistration: z.string().trim().max(50).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable()
});

export const updateFishermanSchema = createFishermanSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});
