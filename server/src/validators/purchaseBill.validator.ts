import { z } from 'zod';

const decimalValueSchema = z
  .union([
    z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal with up to 2 decimal places'),
    z.number().nonnegative()
  ])
  .transform((val) => val.toString());

const positiveDecimalSchema = z
  .union([
    z.string().regex(/^(?!0(\.0{1,2})?$)(\d+(\.\d{1,2})?)$/, 'Quantity must be greater than 0'),
    z.number().positive('Quantity must be greater than 0')
  ])
  .transform((val) => val.toString());

export const purchaseBillItemInputSchema = z.object({
  seafoodId: z.string().uuid('seafoodId must be a valid UUID'),
  gradeId: z.string().uuid('gradeId must be a valid UUID'),
  quantityKg: positiveDecimalSchema,
  purchaseRate: decimalValueSchema.optional()
});

export const createPurchaseBillSchema = z.object({
  fishermanId: z.string().uuid('fishermanId must be a valid UUID'),
  billDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'billDate must be formatted as YYYY-MM-DD'),
  items: z.array(purchaseBillItemInputSchema).min(1, 'Purchase bill must contain at least one item'),
  discount: decimalValueSchema.optional().default('0.00'),
  payment: z
    .object({
      amount: decimalValueSchema.default('0.00'),
      method: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CREDIT']),
      referenceNumber: z.string().trim().optional(),
      notes: z.string().trim().optional()
    })
    .optional(),
  notes: z.string().trim().max(1000).optional().nullable()
});

export const purchaseBillQuerySchema = z.object({
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
  billDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fishermanId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'POSTED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']).optional(),
  search: z.string().trim().optional()
});

export const updatePurchaseBillSchema = z.object({
  notes: z.string().trim().max(1000).optional().nullable()
});
