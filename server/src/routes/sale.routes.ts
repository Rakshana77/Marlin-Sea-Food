import { Router } from 'express';
import { SaleController } from '../controllers/sale.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createSaleSchema, saleQuerySchema } from '../validators/sale.validator';
import { idParamSchema } from '../validators/common.validators';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// 1. List sales with filters, search, and pagination
router.get(
  '/',
  validateRequest({ query: saleQuerySchema }),
  asyncHandler(SaleController.list)
);

// 2. Retrieve single sale by ID
router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(SaleController.getById)
);

// 3. Create/complete a sale with atomic transactions & stock deduction
router.post(
  '/',
  validateRequest({ body: createSaleSchema }),
  asyncHandler(SaleController.create)
);

// 4. Cancel a sale with compensating stock reversal
router.post(
  '/:id/cancel',
  validateRequest({ params: idParamSchema }),
  asyncHandler(SaleController.cancel)
);

export const saleRoutes = router;