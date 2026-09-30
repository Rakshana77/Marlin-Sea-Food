import { z } from 'zod';

export const createSeafoodSchema = z.object({
  name: z.string().trim().min(2, 'Seafood name must be at least 2 characters').max(100),
  categoryId: z.string().uuid('Category ID must be a valid UUID'),
  unit: z.string().trim().default('KG'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
  description: z.string().trim().max(500).optional().nullable()
});

export const updateSeafoodSchema = createSeafoodSchema.partial();
