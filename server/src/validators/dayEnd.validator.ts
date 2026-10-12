import { z } from 'zod';
import { DayEndStatus } from '@prisma/client';

const nonNegativeDecimalSchema = z
  .union([
    z.string().regex(/^\d+(\.\d{1,3})?$/, 'Value must be non-negative with up to 3 decimal places'),
    z.number().nonnegative('Value must be non-negative')
  ])
  .transform((val) => val.toString());

export const dateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date parameter must be formatted as YYYY-MM-DD')
});

export const closeDaySchema = z.object({
  openingCash: nonNegativeDecimalSchema.optional(),
  actualPhysicalCash: nonNegativeDecimalSchema.optional(),
  actualPhysicalStockKg: nonNegativeDecimalSchema.optional(),
  varianceReason: z.string().trim().max(1000).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable()
});

export const reopenDaySchema = z.object({
  reason: z.string().trim().min(3, 'Reopen reason must be at least 3 characters').max(1000)
});

export const dayEndQuerySchema = z.object({
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
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.nativeEnum(DayEndStatus).optional()
});

export type CloseDayInput = z.infer<typeof closeDaySchema>;
export type ReopenDayInput = z.infer<typeof reopenDaySchema>;
export type DayEndQueryParams = z.infer<typeof dayEndQuerySchema>;
