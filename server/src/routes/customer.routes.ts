import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.validator';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validators';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', validateRequest({ query: paginationQuerySchema }), asyncHandler(CustomerController.list));
router.get('/:id', validateRequest({ params: idParamSchema }), asyncHandler(CustomerController.getById));
router.post('/', validateRequest({ body: createCustomerSchema }), asyncHandler(CustomerController.create));
router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateCustomerSchema }),
  asyncHandler(CustomerController.update)
);
router.delete('/:id', validateRequest({ params: idParamSchema }), asyncHandler(CustomerController.delete));

export const customerRoutes = router;
