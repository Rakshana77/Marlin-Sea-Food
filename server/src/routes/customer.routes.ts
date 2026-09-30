import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.validator';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validators';

const router = Router();

router.get('/', validateRequest({ query: paginationQuerySchema }), CustomerController.list);
router.get('/:id', validateRequest({ params: idParamSchema }), CustomerController.getById);
router.post('/', validateRequest({ body: createCustomerSchema }), CustomerController.create);
router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateCustomerSchema }),
  CustomerController.update
);
router.delete('/:id', validateRequest({ params: idParamSchema }), CustomerController.delete);

export const customerRoutes = router;
