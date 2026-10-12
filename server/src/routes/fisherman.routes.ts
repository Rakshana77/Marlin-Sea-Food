import { Router } from 'express';
import { z } from 'zod';
import { FishermanController } from '../controllers/fisherman.controller';
import { FishermanAdvanceController } from '../controllers/fishermanAdvance.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createFishermanSchema, updateFishermanSchema } from '../validators/fisherman.validator';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validators';
import {
  disburseAdvanceSchema,
  recordRepaymentSchema,
  cancelAdvanceSchema,
  advanceQuerySchema,
  advanceLedgerQuerySchema
} from '../validators/fishermanAdvance.validator';

const router = Router();

const advanceNestedParamSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
  advanceId: z.string().uuid('advanceId must be a valid UUID')
});

router.get('/', validateRequest({ query: paginationQuerySchema }), FishermanController.list);

// Fisherman Advance Nested Capabilities
router.get('/:id/advances', validateRequest({ params: idParamSchema, query: advanceQuerySchema }), FishermanAdvanceController.getFishermanAdvances);
router.get('/:id/advance-balance', validateRequest({ params: idParamSchema }), FishermanAdvanceController.getBalance);
router.get('/:id/advance-ledger', validateRequest({ params: idParamSchema, query: advanceLedgerQuerySchema }), FishermanAdvanceController.getFishermanLedger);
router.post('/:id/advances', validateRequest({ params: idParamSchema, body: disburseAdvanceSchema }), FishermanAdvanceController.disburse);
router.post('/:id/advances/repay', validateRequest({ params: idParamSchema, body: recordRepaymentSchema }), FishermanAdvanceController.repay);
router.post('/:id/advances/:advanceId/repay', validateRequest({ params: advanceNestedParamSchema, body: recordRepaymentSchema }), FishermanAdvanceController.repay);
router.post('/:id/advances/:advanceId/cancel', validateRequest({ params: advanceNestedParamSchema, body: cancelAdvanceSchema }), FishermanAdvanceController.cancel);

router.get('/:id', validateRequest({ params: idParamSchema }), FishermanController.getById);
router.post('/', validateRequest({ body: createFishermanSchema }), FishermanController.create);
router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateFishermanSchema }),
  FishermanController.update
);
router.delete('/:id', validateRequest({ params: idParamSchema }), FishermanController.delete);

export const fishermanRoutes = router;
