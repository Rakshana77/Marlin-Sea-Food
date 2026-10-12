import { Router } from 'express';
import { StockController } from '../controllers/stock.controller';
import { validateRequest } from '../middleware/validateRequest';
import { requireRole } from '../middleware/auth.middleware';
import {
  stockQuerySchema,
  stockMovementQuerySchema,
  seafoodGradeParamSchema,
  recordWastageSchema,
  recordAdjustmentSchema,
  dailyFlowQuerySchema
} from '../validators/stock.validator';
import { idParamSchema } from '../validators/common.validators';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// 1. Daily Seafood Flow & Reconciliation (must be before :id routes)
router.get(
  '/daily-flow',
  validateRequest({ query: dailyFlowQuerySchema }),
  asyncHandler(StockController.getDailyFlow)
);

// 2. Stock movements history (must be before :id routes)
router.get(
  '/movements',
  validateRequest({ query: stockMovementQuerySchema }),
  asyncHandler(StockController.getMovements)
);

// 3. Record Wastage / Loss (Restricted to ADMIN)
router.post(
  '/wastage',
  requireRole(['ADMIN']),
  validateRequest({ body: recordWastageSchema }),
  asyncHandler(StockController.recordWastage)
);

// 4. Record Stock Adjustment (Restricted to ADMIN)
router.post(
  '/adjustment',
  requireRole(['ADMIN']),
  validateRequest({ body: recordAdjustmentSchema }),
  asyncHandler(StockController.recordAdjustment)
);

// 5. Stock balance by seafoodId + gradeId
router.get(
  '/:seafoodId/:gradeId',
  validateRequest({ params: seafoodGradeParamSchema }),
  asyncHandler(StockController.getBySeafoodAndGrade)
);

// 6. Stock list
router.get(
  '/',
  validateRequest({ query: stockQuerySchema }),
  asyncHandler(StockController.list)
);

// 7. Stock by ID
router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(StockController.getById)
);

export const stockRoutes = router;
