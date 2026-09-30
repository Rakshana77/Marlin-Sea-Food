import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { fishermanRoutes } from './fisherman.routes';
import { customerRoutes } from './customer.routes';
import { exportCompanyRoutes } from './exportCompany.routes';
import { seafoodCategoryRoutes } from './seafoodCategory.routes';
import { seafoodGradeRoutes } from './seafoodGrade.routes';
import { seafoodRoutes } from './seafood.routes';
import { dailyRateRoutes } from './dailyRate.routes';
import { userRoutes } from './user.routes';
import { roleRoutes } from './role.routes';
import { permissionRoutes } from './permission.routes';
import { purchaseBillRoutes } from './purchaseBill.routes';
import { stockRoutes } from './stock.routes';
import { saleRoutes } from './sale.routes';
import { sendSuccess } from '../utils/response';

const router = Router();

// API Base Information
router.get('/', (_req, res) => {
  return sendSuccess(res, {
    name: 'Marlin Sea Food ERP API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/api/health',
      ping: '/api/health/ping',
      users: '/api/users',
      roles: '/api/roles',
      permissions: '/api/permissions',
      fishermen: '/api/fishermen',
      customers: '/api/customers',
      exportCompanies: '/api/export-companies',
      seafoodCategories: '/api/seafood-categories',
      seafoodGrades: '/api/seafood-grades',
      seafood: '/api/seafood',
      dailyRates: '/api/daily-rates',
      purchaseBills: '/api/purchase-bills',
      stock: '/api/stock',
      sales: '/api/sales'
    }
  });
});

// Mount modules
router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/fishermen', fishermanRoutes);
router.use('/customers', customerRoutes);
router.use('/export-companies', exportCompanyRoutes);
router.use('/seafood-categories', seafoodCategoryRoutes);
router.use('/seafood-grades', seafoodGradeRoutes);
router.use('/seafood', seafoodRoutes);
router.use('/daily-rates', dailyRateRoutes);
router.use('/purchase-bills', purchaseBillRoutes);
router.use('/stock', stockRoutes);
router.use('/sales', saleRoutes);

export const apiRouter = router;