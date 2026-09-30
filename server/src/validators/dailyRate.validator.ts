import { z } from 'zod';

const rateValueSchema = z
  .union([
    z.string().regex(/^\d+(\.\d{1,2})?$/, 'Rate must be a non-negative decimal with up to 2 decimal places'),
    z.number().nonnegative('Rate must be non-negative')
  ])
  .transform((val) => val.toString());

export const createDailyRateSchema = z.object({
  rateDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'rateDate must be formatted as YYYY-MM-DD'),
  seafoodId: z.string().uuid('seafoodId must be a valid UUID'),
  gradeId: z.string().uuid('gradeId must be a valid UUID'),
  purchaseRate: rateValueSchema,
  sellingRate: rateValueSchema
});

export const updateDailyRateSchema = z.object({
  purchaseRate: rateValueSchema.optional(),
  sellingRate: rateValueSchema.optional(),
  gradeId: z.string().uuid('gradeId must be a valid UUID').optional(),
  seafoodId: z.string().uuid('seafoodId must be a valid UUID').optional()
});

export const publishAllDailyRatesSchema = z.object({
  rateDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'rateDate must be formatted as YYYY-MM-DD')
});

export const copyYesterdayRatesSchema = z.object({
  sourceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'sourceDate must be formatted as YYYY-MM-DD'),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'targetDate must be formatted as YYYY-MM-DD')
});

export const bulkRateAdjustmentSchema = z.object({
  rateDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'rateDate must be formatted as YYYY-MM-DD'),
  percentage: z
    .number()
    .min(-90, 'Percentage reduction cannot exceed -90%')
    .max(500, 'Percentage increase cannot exceed +500%'),
  scope: z
    .object({
      categoryId: z.string().uuid('categoryId must be a valid UUID').optional(),
      gradeId: z.string().uuid('gradeId must be a valid UUID').optional()
    })
    .optional()
});

export const currentRateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be formatted as YYYY-MM-DD'),
  seafoodId: z.string().uuid('seafoodId must be a valid UUID'),
  gradeId: z.string().uuid('gradeId must be a valid UUID')
});

export const rateHistoryQuerySchema = z.object({
  seafoodId: z.string().uuid('seafoodId must be a valid UUID'),
  gradeId: z.string().uuid('gradeId must be a valid UUID').optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fromDate must be formatted as YYYY-MM-DD').optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'toDate must be formatted as YYYY-MM-DD').optional()
});

export const dailyRateQuerySchema = z.object({
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
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be formatted as YYYY-MM-DD').optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fromDate must be formatted as YYYY-MM-DD').optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'toDate must be formatted as YYYY-MM-DD').optional(),
  seafoodId: z.string().uuid('seafoodId must be a valid UUID').optional(),
  categoryId: z.string().uuid('categoryId must be a valid UUID').optional(),
  gradeId: z.string().uuid('gradeId must be a valid UUID').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  search: z.string().trim().optional()
});
