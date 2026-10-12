import { Router } from 'express';
import { ExportCompanyController } from '../controllers/exportCompany.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  createExportCompanySchema,
  updateExportCompanySchema
} from '../validators/exportCompany.validator';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validators';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', validateRequest({ query: paginationQuerySchema }), ExportCompanyController.list);
router.get('/:id', validateRequest({ params: idParamSchema }), ExportCompanyController.getById);
router.post(
  '/',
  requireRole(['ADMIN']),
  validateRequest({ body: createExportCompanySchema }),
  ExportCompanyController.create
);
router.patch(
  '/:id',
  requireRole(['ADMIN']),
  validateRequest({ params: idParamSchema, body: updateExportCompanySchema }),
  ExportCompanyController.update
);
router.delete(
  '/:id',
  requireRole(['ADMIN']),
  validateRequest({ params: idParamSchema }),
  ExportCompanyController.delete
);

export const exportCompanyRoutes = router;
