import { z } from 'zod';

const decimalAmountSchema = z
  .union([
    z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal amount with up to 2 decimal places'),
    z.number().nonnegative()
  ])
  .transform((val) => val.toString());

const positiveWeightSchema = z
  .union([
    z.string().regex(/^(?!0(\.0{1,3})?$)(\d+(\.\d{1,3})?)$/, 'Quantity must be greater than 0 with up to 3 decimal places'),
    z.number().positive('Quantity must be greater than 0')
  ])
  .transform((val) => val.toString());

export const saleItemInputSchema = z.object({
  seafoodId: z.string().min(1, 'seafoodId is required'),
  gradeId: z.string().min(1, 'gradeId is required'),
  quantityKg: positiveWeightSchema
});

export const createSaleSchema = z.object({
  customerId: z.string().trim().optional().default('walk-in'),
  saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'saleDate must be formatted as YYYY-MM-DD'),
  items: z.array(saleItemInputSchema).min(1, 'Sale must contain at least one item'),
  discount: decimalAmountSchema.optional().default('0.00'),
  payment: z
    .object({
      method: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CREDIT']),
      amount: decimalAmountSchema.optional(),
      referenceNumber: z.string().trim().optional(),
      notes: z.string().trim().optional()
    })
    .optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
  idempotencyKey: z.string().trim().max(100).optional()
});

export const saleQuerySchema = z.object({
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
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  customerId: z.string().optional(),
  seafoodId: z.string().uuid().optional(),
  gradeId: z.string().uuid().optional(),
  paymentStatus: z.enum(['PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']).optional(),
  status: z.enum(['DRAFT', 'COMPLETED', 'CANCELLED']).optional(),
  search: z.string().trim().optional()
});