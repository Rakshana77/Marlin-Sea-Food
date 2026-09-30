import { z } from 'zod';

export const createSeafoodGradeSchema = z.object({
  name: z.string().trim().min(1, 'Grade name must be at least 1 character').max(20),
  description: z.string().trim().max(255).optional().nullable(),
  active: z.boolean().optional().default(true)
});

export const updateSeafoodGradeSchema = createSeafoodGradeSchema.partial();
