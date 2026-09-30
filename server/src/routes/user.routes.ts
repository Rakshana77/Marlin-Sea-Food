import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validators';

const router = Router();

router.get('/', validateRequest({ query: paginationQuerySchema }), UserController.list);
router.get('/:id', validateRequest({ params: idParamSchema }), UserController.getById);
router.post('/', validateRequest({ body: createUserSchema }), UserController.create);
router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateUserSchema }),
  UserController.update
);
router.delete('/:id', validateRequest({ params: idParamSchema }), UserController.delete);

export const userRoutes = router;
