import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createRoleSchema } from '../validators/role.validator';
import { idParamSchema } from '../validators/common.validators';

const router = Router();

router.get('/', RoleController.list);
router.get('/:id', validateRequest({ params: idParamSchema }), RoleController.getById);
router.post('/', validateRequest({ body: createRoleSchema }), RoleController.create);

export const roleRoutes = router;
