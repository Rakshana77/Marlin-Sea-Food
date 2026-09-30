import { z } from 'zod';

export const createExportCompanySchema = z.object({
  companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').max(150),
  contactPerson: z.string().trim().max(100).optional().nullable(),
  countryCode: z
    .string()
    .trim()
    .regex(/^\+\d{1,4}$/, 'Country code must start with + followed by 1 to 4 digits')
    .default('+91'),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^\d{7,15}$/, 'Mobile number must contain between 7 and 15 digits')
    .optional()
    .nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  taxNumber: z.string().trim().max(50, 'Tax/GST/IEC number must not exceed 50 characters').optional().nullable()
});

export const updateExportCompanySchema = createExportCompanySchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});
