import { z } from 'zod';

const positiveDecimalSchema = z
  .union([
    z.string().regex(/^(?!0(\.0{1,2})?$)(\d+(\.\d{1,2})?)$/, 'Amount must be greater than 0 with up to 2 decimal places'),
    z.number().positive('Amount must be greater than 0')
  ])
  .transform((val) => val.toString());

export const disburseAdvanceSchema = z.object({
  fishermanId: z.string().uuid('fishermanId must be a valid UUID').optional(),
  sanctionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'sanctionDate must be formatted as YYYY-MM-DD').optional(),
  amount: positiveDecimalSchema,
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'UPI']),
  paymentRef: z.string().trim().max(100).optional().nullable(),
  idempotencyKey: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable()
});

export const recordRepaymentSchema = z.object({
  fishermanId: z.string().uuid('fishermanId must be a valid UUID').optional(),
  amount: positiveDecimalSchema,
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'UPI']),
  paymentRef: z.string().trim().max(100).optional().nullable(),
  idempotencyKey: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable()
});

export const writeOffAdvanceSchema = z.object({
  fishermanId: z.string().uuid('fishermanId must be a valid UUID'),
  advanceId: z.string().uuid('advanceId must be a valid UUID').optional(),
  amount: positiveDecimalSchema,
  reason: z.string().trim().min(3, 'A clear reason of at least 3 characters is mandatory for advance write-off').max(1000)
});

export const cancelAdvanceSchema = z.object({
  reason: z.string().trim().max(1000).optional()
});

export const advanceQuerySchema = z.object({
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
  fishermanId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'FULLY_RECOVERED', 'WRITTEN_OFF', 'CANCELLED']).optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'UPI']).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().trim().optional()
});

export const advanceLedgerQuerySchema = z.object({
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
  fishermanId: z.string().uuid().optional(),
  advanceId: z.string().uuid().optional(),
  entryType: z.enum(['DISBURSEMENT', 'RECOVERY_DEDUCTION', 'RECOVERY_REVERSAL', 'CASH_REPAYMENT', 'WRITE_OFF']).optional(),
  direction: z.enum(['DEBIT', 'CREDIT']).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const fishermanIdParamSchema = z.object({
  fishermanId: z.string().uuid('fishermanId must be a valid UUID')
});
