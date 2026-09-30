import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';

const router = Router();

router.get('/', PermissionController.list);

export const permissionRoutes = router;
