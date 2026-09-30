import { Router } from 'express';
import { StockController } from '../controllers/stock.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  stockQuerySchema,
  stockMovementQuerySchema,
  seafoodGradeParamSchema
} from '../validators/stock.validator';
import { idParamSchema } from '../validators/common.validators';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// 1. Stock movements history (must be before /:id)
router.get(
  '/movements',
  validateRequest({ query: stockMovementQuerySchema }),
  asyncHandler(StockController.getMovements)
);

// 2. Stock balance by seafoodId + gradeId
router.get(
  '/:seafoodId/:gradeId',
  validateRequest({ params: seafoodGradeParamSchema }),
  asyncHandler(StockController.getBySeafoodAndGrade)
);

// 3. Stock list
router.get(
  '/',
  validateRequest({ query: stockQuerySchema }),
  asyncHandler(StockController.list)
);

// 4. Stock by ID
router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(StockController.getById)
);

export const stockRoutes = router;
