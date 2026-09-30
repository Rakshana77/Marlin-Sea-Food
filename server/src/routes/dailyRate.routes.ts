import { Router } from 'express';
import { DailyRateController } from '../controllers/dailyRate.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  createDailyRateSchema,
  updateDailyRateSchema,
  dailyRateQuerySchema,
  publishAllDailyRatesSchema,
  copyYesterdayRatesSchema,
  bulkRateAdjustmentSchema,
  currentRateQuerySchema,
  rateHistoryQuerySchema
} from '../validators/dailyRate.validator';
import { idParamSchema } from '../validators/common.validators';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// 1. Current published rate lookup (for transactions/billing)
router.get('/current', validateRequest({ query: currentRateQuerySchema }), asyncHandler(DailyRateController.getCurrent));

// 2. Historical rate trend lookup
router.get('/history', validateRequest({ query: rateHistoryQuerySchema }), asyncHandler(DailyRateController.getHistory));

// 3. Batch operations on date
router.post(
  '/publish',
  validateRequest({ body: publishAllDailyRatesSchema }),
  asyncHandler(DailyRateController.publishAll)
);

router.post(
  '/copy-yesterday',
  validateRequest({ body: copyYesterdayRatesSchema }),
  asyncHandler(DailyRateController.copyYesterday)
);

router.post(
  '/bulk-adjust',
  validateRequest({ body: bulkRateAdjustmentSchema }),
  asyncHandler(DailyRateController.bulkAdjust)
);

// 4. Standard CRUD & individual actions
router.get('/', validateRequest({ query: dailyRateQuerySchema }), asyncHandler(DailyRateController.list));

router.get('/:id', validateRequest({ params: idParamSchema }), asyncHandler(DailyRateController.getById));

router.post('/', validateRequest({ body: createDailyRateSchema }), asyncHandler(DailyRateController.create));

router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateDailyRateSchema }),
  asyncHandler(DailyRateController.update)
);

router.post('/:id/publish', validateRequest({ params: idParamSchema }), asyncHandler(DailyRateController.publish));

router.delete('/:id', validateRequest({ params: idParamSchema }), asyncHandler(DailyRateController.delete));

export const dailyRateRoutes = router;
