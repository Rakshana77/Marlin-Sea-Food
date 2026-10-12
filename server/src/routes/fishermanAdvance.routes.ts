import { Router } from 'express';
import { FishermanAdvanceController } from '../controllers/fishermanAdvance.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  disburseAdvanceSchema,
  recordRepaymentSchema,
  writeOffAdvanceSchema,
  cancelAdvanceSchema,
  advanceQuerySchema,
  advanceLedgerQuerySchema,
  fishermanIdParamSchema
} from '../validators/fishermanAdvance.validator';
import { idParamSchema } from '../validators/common.validators';

const router = Router();

// 1. Advance disbursement
router.post(
  '/disburse',
  validateRequest({ body: disburseAdvanceSchema }),
  FishermanAdvanceController.disburse
);

// 2. Direct cash repayment
router.post(
  '/repay',
  validateRequest({ body: recordRepaymentSchema }),
  FishermanAdvanceController.repay
);

// 3. Advance write-off
router.post(
  '/write-off',
  validateRequest({ body: writeOffAdvanceSchema }),
  FishermanAdvanceController.writeOff
);

// 4. Advance cancellation / void
router.post(
  '/:id/cancel',
  validateRequest({ params: idParamSchema, body: cancelAdvanceSchema }),
  FishermanAdvanceController.cancel
);

// 5. Global ledger query
router.get(
  '/ledger',
  validateRequest({ query: advanceLedgerQuerySchema }),
  FishermanAdvanceController.getLedger
);

// 6. Fisherman-specific balance summary
router.get(
  '/fishermen/:fishermanId/balance',
  validateRequest({ params: fishermanIdParamSchema }),
  FishermanAdvanceController.getBalance
);

// 7. Fisherman-specific ledger
router.get(
  '/fishermen/:fishermanId/ledger',
  validateRequest({ params: fishermanIdParamSchema, query: advanceLedgerQuerySchema }),
  FishermanAdvanceController.getFishermanLedger
);

// 8. List advances
router.get(
  '/',
  validateRequest({ query: advanceQuerySchema }),
  FishermanAdvanceController.list
);

// 9. Get advance by ID
router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  FishermanAdvanceController.getById
);

export const fishermanAdvanceRoutes = router;
