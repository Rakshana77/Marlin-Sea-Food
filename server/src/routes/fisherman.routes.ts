import { Router } from 'express';
import { FishermanController } from '../controllers/fisherman.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createFishermanSchema, updateFishermanSchema } from '../validators/fisherman.validator';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validators';

const router = Router();

router.get('/', validateRequest({ query: paginationQuerySchema }), FishermanController.list);
router.get('/:id', validateRequest({ params: idParamSchema }), FishermanController.getById);
router.post('/', validateRequest({ body: createFishermanSchema }), FishermanController.create);
router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateFishermanSchema }),
  FishermanController.update
);
router.delete('/:id', validateRequest({ params: idParamSchema }), FishermanController.delete);

export const fishermanRoutes = router;
