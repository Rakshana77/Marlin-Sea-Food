import { Router } from 'express';
import { DayEndController } from '../controllers/dayEnd.controller';
import { validateRequest } from '../middleware/validateRequest';
import { requireRole } from '../middleware/auth.middleware';
import {
  dateParamSchema,
  closeDaySchema,
  reopenDaySchema,
  dayEndQuerySchema
} from '../validators/dayEnd.validator';

const router = Router();

// 1. List historical day-end closing records (Admin & Worker)
router.get(
  '/',
  validateRequest({ query: dayEndQuerySchema }),
  DayEndController.list
);

// 2. Read-only dynamic Day-End Preview for a date (Admin & Worker)
router.get(
  '/:date/preview',
  validateRequest({ params: dateParamSchema }),
  DayEndController.preview
);

// 3. Get Day-End record or status for a date (Admin & Worker)
router.get(
  '/:date',
  validateRequest({ params: dateParamSchema }),
  DayEndController.getRecord
);

// 4. Close business date & lock all mutations (Strictly Admin only)
router.post(
  '/:date/close',
  requireRole(['ADMIN']),
  validateRequest({ params: dateParamSchema, body: closeDaySchema }),
  DayEndController.close
);

// 5. Reopen closed business date (Strictly Admin only)
router.post(
  '/:date/reopen',
  requireRole(['ADMIN']),
  validateRequest({ params: dateParamSchema, body: reopenDaySchema }),
  DayEndController.reopen
);

export const dayEndRoutes = router;
