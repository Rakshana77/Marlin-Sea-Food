import { Router } from 'express';
import { SeafoodController } from '../controllers/seafood.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createSeafoodSchema, updateSeafoodSchema } from '../validators/seafood.validator';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validators';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', validateRequest({ query: paginationQuerySchema }), asyncHandler(SeafoodController.list));
router.get('/:id', validateRequest({ params: idParamSchema }), asyncHandler(SeafoodController.getById));
router.post('/', validateRequest({ body: createSeafoodSchema }), asyncHandler(SeafoodController.create));
router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateSeafoodSchema }),
  asyncHandler(SeafoodController.update)
);
router.delete('/:id', validateRequest({ params: idParamSchema }), asyncHandler(SeafoodController.delete));

export const seafoodRoutes = router;
