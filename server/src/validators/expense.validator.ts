import { z } from 'zod';
import { ExpenseCategory, ExpensePaymentMethod, ExpenseStatus } from '@prisma/client';

const positiveDecimalSchema = z
  .union([
    z.string().regex(/^(?!0(\.0{1,2})?$)(\d+(\.\d{1,2})?)$/, 'Amount must be greater than 0 with up to 2 decimal places'),
    z.number().positive('Amount must be greater than 0')
  ])
  .transform((val) => val.toString());

const expenseCategoryEnum = z.nativeEnum(ExpenseCategory);
const expensePaymentMethodEnum = z.nativeEnum(ExpensePaymentMethod);
const expenseStatusEnum = z.nativeEnum(ExpenseStatus);

export const createExpenseSchema = z.object({
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expenseDate must be formatted as YYYY-MM-DD').optional(),
  category: expenseCategoryEnum,
  amount: positiveDecimalSchema,
  paymentMethod: expensePaymentMethodEnum,
  recipient: z.string().trim().min(1, 'Recipient is required').max(200),
  reference: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  idempotencyKey: z.string().trim().max(100).optional().nullable()
});

export const createWorkerWageSchema = z.object({
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expenseDate must be formatted as YYYY-MM-DD').optional(),
  workerName: z.string().trim().min(1, 'Worker name is required').max(200).optional(),
  recipient: z.string().trim().min(1, 'Recipient/Worker name is required').max(200).optional(),
  amount: positiveDecimalSchema,
  paymentMethod: expensePaymentMethodEnum,
  reference: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  idempotencyKey: z.string().trim().max(100).optional().nullable()
}).refine((data) => !!(data.workerName || data.recipient), {
  message: 'Worker name or recipient is required for worker wages',
  path: ['recipient']
});

export const cancelExpenseSchema = z.object({
  reason: z.string().trim().max(1000).optional()
});

export const expenseQuerySchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .default('1')
    .transform((val) => Math.max(1, typeof val === 'number' ? val : parseInt(val, 10) || 1)),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .default('20')
    .transform((val) => Math.min(100, Math.max(1, typeof val === 'number' ? val : parseInt(val, 10) || 20))),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: expenseCategoryEnum.optional(),
  paymentMethod: expensePaymentMethodEnum.optional(),
  status: expenseStatusEnum.optional(),
  recipient: z.string().trim().optional(),
  search: z.string().trim().optional()
});

export const expenseSummaryQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateWorkerWageInput = z.infer<typeof createWorkerWageSchema>;
export type CancelExpenseInput = z.infer<typeof cancelExpenseSchema>;
export type ExpenseQueryParams = z.infer<typeof expenseQuerySchema>;
export type ExpenseSummaryQueryParams = z.infer<typeof expenseSummaryQuerySchema>;
