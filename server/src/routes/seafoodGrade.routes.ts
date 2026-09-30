import { Router } from 'express';
import { SeafoodGradeController } from '../controllers/seafoodGrade.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  createSeafoodGradeSchema,
  updateSeafoodGradeSchema
} from '../validators/seafoodGrade.validator';
import { idParamSchema } from '../validators/common.validators';

const router = Router();

router.get('/', SeafoodGradeController.list);
router.get('/:id', validateRequest({ params: idParamSchema }), SeafoodGradeController.getById);
router.post(
  '/',
  validateRequest({ body: createSeafoodGradeSchema }),
  SeafoodGradeController.create
);
router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateSeafoodGradeSchema }),
  SeafoodGradeController.update
);
router.delete('/:id', validateRequest({ params: idParamSchema }), SeafoodGradeController.delete);

export const seafoodGradeRoutes = router;
