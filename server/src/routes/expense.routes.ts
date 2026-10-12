import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createExpenseSchema,
  createWorkerWageSchema,
  cancelExpenseSchema,
  expenseQuerySchema,
  expenseSummaryQuerySchema
} from '../validators/expense.validator';

const router = Router();

// 1. Expense summary reporting
router.get(
  '/summary',
  validateRequest({ query: expenseSummaryQuerySchema }),
  asyncHandler(ExpenseController.summary)
);

// 2. Query and list expenses
router.get(
  '/',
  validateRequest({ query: expenseQuerySchema }),
  asyncHandler(ExpenseController.list)
);

// 3. Get single expense by ID or expenseNumber
router.get('/:id', asyncHandler(ExpenseController.getById));

// 4. Create general operational expense
router.post(
  '/',
  validateRequest({ body: createExpenseSchema }),
  asyncHandler(ExpenseController.create)
);

// 5. Record worker wage
router.post(
  '/wages',
  validateRequest({ body: createWorkerWageSchema }),
  asyncHandler(ExpenseController.createWage)
);

// 6. Cancel / void expense
router.post(
  '/:id/cancel',
  validateRequest({ body: cancelExpenseSchema }),
  asyncHandler(ExpenseController.cancel)
);

export const expenseRoutes = router;
