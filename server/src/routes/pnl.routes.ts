import { Router } from 'express';
import { PnlController } from '../controllers/pnl.controller';
import { validateRequest } from '../middleware/validateRequest';
import { requireRole } from '../middleware/auth.middleware';
import {
  dailyPnlQuerySchema,
  dateRangePnlQuerySchema
} from '../validators/pnl.validator';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Strict RBAC: Financial P&L engine is strictly restricted to ADMIN
router.use(requireRole(['ADMIN']));

// 1. Single-day P&L Report
router.get(
  '/daily',
  validateRequest({ query: dailyPnlQuerySchema }),
  asyncHandler(PnlController.getDaily)
);

// 2. High-level P&L Summary Totals
router.get(
  '/summary',
  validateRequest({ query: dateRangePnlQuerySchema }),
  asyncHandler(PnlController.getSummary)
);

// 3. Multi-dimensional P&L Breakdowns (Seafood, Category, Grade, Buyer, Export, Expense)
router.get(
  '/breakdown',
  validateRequest({ query: dateRangePnlQuerySchema }),
  asyncHandler(PnlController.getBreakdowns)
);

// 4. Date-range P&L Report
router.get(
  '/range',
  validateRequest({ query: dateRangePnlQuerySchema }),
  asyncHandler(PnlController.getDateRange)
);

// 5. Default base route /api/pnl (supports both date range & single date)
router.get(
  '/',
  validateRequest({ query: dateRangePnlQuerySchema }),
  asyncHandler(PnlController.getDateRange)
);

export const pnlRoutes = router;
