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
  seafoodId: z.string().min(1, 'seafoodId must be provided'),
  gradeId: z.string().min(1, 'gradeId must be provided')
});

export const recordWastageSchema = z.object({
  seafoodId: z.string().min(1, 'seafoodId is required'),
  gradeId: z.string().min(1, 'gradeId is required'),
  quantityKg: z.union([z.string(), z.number()]).transform((val) => String(val)),
  reason: z.string().trim().min(1, 'Reason for wastage is required'),
  notes: z.string().trim().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional()
});

export const recordAdjustmentSchema = z.object({
  seafoodId: z.string().min(1, 'seafoodId is required'),
  gradeId: z.string().min(1, 'gradeId is required'),
  quantityKg: z.union([z.string(), z.number()]).transform((val) => String(val)),
  reason: z.string().trim().min(1, 'Reason for adjustment is required'),
  notes: z.string().trim().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional()
});

export const dailyFlowQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

