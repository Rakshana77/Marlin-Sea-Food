import { z } from 'zod';

export const stockQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 20))),
  seafoodId: z.string().uuid().optional(),
  gradeId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().trim().optional()
});

export const stockMovementQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 20))),
  seafoodId: z.string().uuid().optional(),
  gradeId: z.string().uuid().optional(),
  movementType: z.enum(['PURCHASE', 'EXPORT', 'ADJUSTMENT', 'RETURN', 'WASTE']).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  referenceType: z.string().trim().optional()
});

export const seafoodGradeParamSchema = z.object({
  seafoodId: z.string().uuid('seafoodId must be a valid UUID'),
  gradeId: z.string().uuid('gradeId must be a valid UUID')
});
