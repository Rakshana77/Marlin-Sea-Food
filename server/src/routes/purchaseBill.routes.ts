import { Router } from 'express';
import { PurchaseBillController } from '../controllers/purchaseBill.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  createPurchaseBillSchema,
  updatePurchaseBillSchema,
  purchaseBillQuerySchema
} from '../validators/purchaseBill.validator';
import { idParamSchema } from '../validators/common.validators';

const router = Router();

// 1. Purchase bill list
router.get(
  '/',
  validateRequest({ query: purchaseBillQuerySchema }),
  PurchaseBillController.list
);

// 2. Purchase bill by ID
router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  PurchaseBillController.getById
);

// 3. Create purchase bill
router.post(
  '/',
  validateRequest({ body: createPurchaseBillSchema }),
  PurchaseBillController.create
);

// 4. Update purchase bill (notes only for posted bills)
router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updatePurchaseBillSchema }),
  PurchaseBillController.update
);

export const purchaseBillRoutes = router;
