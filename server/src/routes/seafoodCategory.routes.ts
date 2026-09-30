import { Router } from 'express';
import { SeafoodCategoryController } from '../controllers/seafoodCategory.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  createSeafoodCategorySchema,
  updateSeafoodCategorySchema
} from '../validators/seafoodCategory.validator';
import { idParamSchema } from '../validators/common.validators';

const router = Router();

router.get('/', SeafoodCategoryController.list);
router.get('/:id', validateRequest({ params: idParamSchema }), SeafoodCategoryController.getById);
router.post(
  '/',
  validateRequest({ body: createSeafoodCategorySchema }),
  SeafoodCategoryController.create
);
router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateSeafoodCategorySchema }),
  SeafoodCategoryController.update
);
router.delete('/:id', validateRequest({ params: idParamSchema }), SeafoodCategoryController.delete);

export const seafoodCategoryRoutes = router;
