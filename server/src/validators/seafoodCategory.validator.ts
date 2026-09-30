import { z } from 'zod';

export const createSeafoodCategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters').max(50),
  description: z.string().trim().max(255).optional().nullable(),
  active: z.boolean().optional().default(true)
});

export const updateSeafoodCategorySchema = createSeafoodCategorySchema.partial();
