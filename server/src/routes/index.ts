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
import { fishermanAdvanceRoutes } from './fishermanAdvance.routes';
import { stockRoutes } from './stock.routes';
import { saleRoutes } from './sale.routes';
import { authRoutes } from './auth.routes';
import { expenseRoutes } from './expense.routes';
import { dayEndRoutes } from './dayEnd.routes';
import { pnlRoutes } from './pnl.routes';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/response';

const router = Router();

// API Base Information
router.get('/', (_req, res) => {
  return sendSuccess(res, {
    name: 'Marine Seafoods ERP API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      ping: '/api/health/ping',
      users: '/api/users',
      roles: '/api/roles',
      permissions: '/api/permissions',
      fishermen: '/api/fishermen',
      fishermanAdvances: '/api/fisherman-advances',
      expenses: '/api/expenses',
      customers: '/api/customers',
      exportCompanies: '/api/export-companies',
      seafoodCategories: '/api/seafood-categories',
      seafoodGrades: '/api/seafood-grades',
      seafood: '/api/seafood',
      dailyRates: '/api/daily-rates',
      purchaseBills: '/api/purchase-bills',
      stock: '/api/stock',
      sales: '/api/sales',
      dayEnd: '/api/day-end',
      pnl: '/api/pnl'
    }
  });
});

// 1. Public & Auth Modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// 2. Operational Modules accessible by both ADMIN and WORKER
router.use('/customers', authenticate, requireRole(['ADMIN', 'WORKER']), customerRoutes);
router.use('/export-companies', authenticate, requireRole(['ADMIN', 'WORKER']), exportCompanyRoutes);
router.use('/sales', authenticate, requireRole(['ADMIN', 'WORKER']), saleRoutes);
router.use('/daily-rates', authenticate, requireRole(['ADMIN', 'WORKER']), dailyRateRoutes);
router.use('/seafood', authenticate, requireRole(['ADMIN', 'WORKER']), seafoodRoutes);
router.use('/seafood-categories', authenticate, requireRole(['ADMIN', 'WORKER']), seafoodCategoryRoutes);
router.use('/seafood-grades', authenticate, requireRole(['ADMIN', 'WORKER']), seafoodGradeRoutes);
router.use('/stock', authenticate, requireRole(['ADMIN', 'WORKER']), stockRoutes);
router.use('/day-end', authenticate, dayEndRoutes);

// 3. Administrative Modules strictly restricted to ADMIN
router.use('/pnl', authenticate, requireRole(['ADMIN']), pnlRoutes);
router.use('/purchase-bills', authenticate, requireRole(['ADMIN']), purchaseBillRoutes);
router.use('/fisherman-advances', authenticate, requireRole(['ADMIN']), fishermanAdvanceRoutes);
router.use('/expenses', authenticate, requireRole(['ADMIN']), expenseRoutes);
router.use('/fishermen', authenticate, requireRole(['ADMIN']), fishermanRoutes);
router.use('/users', authenticate, requireRole(['ADMIN']), userRoutes);
router.use('/roles', authenticate, requireRole(['ADMIN']), roleRoutes);
router.use('/permissions', authenticate, requireRole(['ADMIN']), permissionRoutes);

export const apiRouter = router;