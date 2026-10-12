import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { createApp } from '../src/app';
import { signToken } from '../src/utils/jwt';
import { prisma } from '../src/lib/prisma';
import { ExpenseService } from '../src/services/expense.service';
import { FishermanAdvanceService } from '../src/services/fishermanAdvance.service';
import { PurchaseBillService } from '../src/services/purchaseBill.service';
import { StockService } from '../src/services/stock.service';
import { DailyRateService } from '../src/services/dailyRate.service';
import { SeafoodService } from '../src/services/seafood.service';
import { SeafoodCategoryService } from '../src/services/seafoodCategory.service';
import { SeafoodGradeService } from '../src/services/seafoodGrade.service';
import { FishermanService } from '../src/services/fisherman.service';
import { AppError } from '../src/utils/appError';
import {
  Prisma,
  ExpenseCategory,
  ExpensePaymentMethod,
  ExpenseStatus,
  AdvancePaymentMethod,
  PaymentMethod,
  DayEndStatus
} from '@prisma/client';

describe('Phase 4 Expenses, Worker Wages & Operational Cash Tests', () => {
  const expenseService = new ExpenseService();
  const advanceService = new FishermanAdvanceService();
  const purchaseBillService = new PurchaseBillService();
  const stockService = new StockService();
  const dailyRateService = new DailyRateService();
  const seafoodService = new SeafoodService();
  const categoryService = new SeafoodCategoryService();
  const gradeService = new SeafoodGradeService();
  const fishermanService = new FishermanService();

  const testSuffix = Date.now().toString().slice(-6);
  const TEST_DATE = '2026-10-04';
  const CLOSED_DATE = '2026-09-15';

  let adminUser: any;
  let workerUser: any;
  let adminToken: string;
  let workerToken: string;
  let server: http.Server;
  let baseUrl: string;

  let categoryId: string;
  let gradeId: string;
  let seafoodId: string;
  let fishermanId: string;

  const createdExpenseIds: string[] = [];
  const createdBillIds: string[] = [];

  before(async () => {
    // 1. Fetch or create Admin and Worker roles
    const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    const workerRole = await prisma.role.findFirst({ where: { name: 'WORKER' } });

    // 2. Create Admin and Worker users for RBAC and audit testing
    adminUser = await prisma.user.create({
      data: {
        name: `Admin_Exp_${testSuffix}`,
        email: `admin_exp_${testSuffix}@marineseafoods.com`,
        passwordHash: 'dummyhash',
        roleId: adminRole!.id
      }
    });

    workerUser = await prisma.user.create({
      data: {
        name: `Worker_Exp_${testSuffix}`,
        email: `worker_exp_${testSuffix}@marineseafoods.com`,
        passwordHash: 'dummyhash',
        roleId: workerRole!.id
      }
    });

    adminToken = signToken({ id: adminUser.id, role: 'ADMIN', name: adminUser.name });
    workerToken = signToken({ id: workerUser.id, role: 'WORKER', name: workerUser.name });

    // 3. Create test HTTP server
    const app = createApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // 4. Setup Master Data for cross-module separation testing
    const cat = await categoryService.createCategory({
      name: `Exp_Cat_${testSuffix}`,
      description: 'Expense Test Category'
    });
    categoryId = cat.id;

    const grade = await gradeService.createGrade({
      name: `Exp_Grd_${testSuffix}`,
      description: 'Expense Test Grade'
    });
    gradeId = grade.id;

    const seafood = await seafoodService.createSeafood({
      name: `Exp_Fish_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodId = seafood.id;

    const fisherman = await fishermanService.createFisherman({
      name: `Exp_Fisherman_${testSuffix}`,
      mobileNumber: `919${testSuffix.padEnd(7, '0')}`,
      boatName: `Exp_Boat_${testSuffix}`
    });
    fishermanId = fisherman.id;

    // 5. Setup Published Rate for collection test
    const rate = await dailyRateService.createDailyRate({
      rateDate: TEST_DATE,
      seafoodId,
      gradeId,
      purchaseRate: '300.00',
      sellingRate: '400.00'
    });
    await dailyRateService.publishRate(rate.id);

    // 6. Setup closed DayEndClosing for day-end protection testing
    await prisma.dayEndClosing.upsert({
      where: { businessDate: DailyRateService.parseDate(CLOSED_DATE) },
      update: { closingStatus: DayEndStatus.CLOSED },
      create: {
        businessDate: DailyRateService.parseDate(CLOSED_DATE),
        closingStatus: DayEndStatus.CLOSED,
        openingStockKg: '100.000',
        totalReceivedKg: '50.000',
        totalSoldKg: '40.000',
        totalWastageKg: '0.000',
        totalAdjustedKg: '0.000',
        expectedClosingStockKg: '110.000',
        actualPhysicalStockKg: '110.000',
        stockVarianceKg: '0.000',
        openingCash: '10000.00',
        cashReceivedSales: '5000.00',
        cashPaidPurchases: '3000.00',
        cashPaidAdvances: '1000.00',
        cashPaidExpenses: '500.00',
        expectedClosingCash: '10500.00',
        actualPhysicalCash: '10500.00',
        cashVariance: '0.00',
        closedById: adminUser.id
      }
    });
  });

  after(async () => {
    // Teardown test server
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    // Cleanup created records safely
    if (createdBillIds.length > 0) {
      await prisma.stockMovement.deleteMany({
        where: { referenceType: 'PURCHASE_BILL', referenceId: { in: createdBillIds } }
      });
      await prisma.payment.deleteMany({
        where: { purchaseBillId: { in: createdBillIds } }
      });
      await prisma.purchaseBillItem.deleteMany({
        where: { purchaseBillId: { in: createdBillIds } }
      });
      await prisma.purchaseBill.deleteMany({
        where: { id: { in: createdBillIds } }
      });
    }

    if (createdExpenseIds.length > 0) {
      await prisma.expense.deleteMany({
        where: { id: { in: createdExpenseIds } }
      });
    }

    await prisma.dayEndClosing.deleteMany({
      where: { businessDate: DailyRateService.parseDate(CLOSED_DATE) }
    });

    await prisma.stockMovement.deleteMany({ where: { seafoodId } });
    await prisma.stock.deleteMany({ where: { seafoodId } });
    await prisma.dailyRate.deleteMany({ where: { seafoodId } });
    await prisma.fishermanAdvanceLedger.deleteMany({ where: { fishermanId } });
    await prisma.fishermanAdvance.deleteMany({ where: { fishermanId } });
    await prisma.fisherman.deleteMany({ where: { id: fishermanId } });
    await prisma.seafood.deleteMany({ where: { id: seafoodId } });
    await prisma.seafoodGrade.deleteMany({ where: { id: gradeId } });
    await prisma.seafoodCategory.deleteMany({ where: { id: categoryId } });
    await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, workerUser.id] } } });
  });

  // ==================================================
  // 1. TEST 1: CREATE CASH EXPENSE
  // ==================================================
  test('1. Create Cash Expense: Transport ₹2,000 CASH creates expense and records cash outflow', async () => {
    const expense = await expenseService.createExpense(
      {
        expenseDate: TEST_DATE,
        category: ExpenseCategory.TRANSPORT,
        amount: '2000.00',
        paymentMethod: ExpensePaymentMethod.CASH,
        recipient: 'Murugan Transport',
        notes: 'Fish crate transit from harbour'
      },
      adminUser.id
    );

    createdExpenseIds.push(expense.id);

    assert.ok(expense.id);
    assert.ok(expense.expenseNumber.startsWith('EXP-20261004-'));
    assert.strictEqual(expense.category, 'TRANSPORT');
    assert.strictEqual(expense.amount, '2000.00');
    assert.strictEqual(expense.paymentMethod, 'CASH');
    assert.strictEqual(expense.recipient, 'Murugan Transport');
    assert.strictEqual(expense.status, 'RECORDED');
    assert.strictEqual(expense.createdById, adminUser.id);
  });

  // ==================================================
  // 2. TEST 2: CREATE UPI EXPENSE
  // ==================================================
  test('2. Create UPI Expense: Ice ₹1,500 UPI creates expense; physical cash is unaffected', async () => {
    const expense = await expenseService.createExpense(
      {
        expenseDate: TEST_DATE,
        category: ExpenseCategory.ICE,
        amount: '1500.00',
        paymentMethod: ExpensePaymentMethod.UPI,
        recipient: 'Marina Ice Plant',
        reference: 'UPI/20261004/897123',
        notes: '20 ice blocks'
      },
      adminUser.id
    );

    createdExpenseIds.push(expense.id);

    assert.strictEqual(expense.category, 'ICE');
    assert.strictEqual(expense.amount, '1500.00');
    assert.strictEqual(expense.paymentMethod, 'UPI');
    assert.strictEqual(expense.reference, 'UPI/20261004/897123');
    assert.strictEqual(expense.status, 'RECORDED');

    // Verify summary separates Cash vs UPI
    const summary = await expenseService.getExpenseSummary({ date: TEST_DATE });
    assert.strictEqual(summary.totalOpex, '3500.00'); // 2000 + 1500
    assert.strictEqual(summary.cashOpex, '2000.00');   // Only Transport ₹2,000
    assert.strictEqual(summary.upiOpex, '1500.00');    // Ice ₹1,500
    assert.strictEqual(summary.bankOpex, '0.00');
  });

  // ==================================================
  // 3. TEST 3: WORKER WAGE
  // ==================================================
  test('3. Worker Wage: Ravi Wage ₹1,500 CASH records operational expense and cash outflow', async () => {
    const wage = await expenseService.recordWorkerWage(
      {
        expenseDate: TEST_DATE,
        workerName: 'Ravi',
        amount: '1500.00',
        paymentMethod: ExpensePaymentMethod.CASH,
        notes: 'Night catch sorting & weighing wage'
      },
      adminUser.id
    );

    createdExpenseIds.push(wage.id);

    assert.strictEqual(wage.category, 'WORKER_WAGE');
    assert.strictEqual(wage.recipient, 'Ravi');
    assert.strictEqual(wage.amount, '1500.00');
    assert.strictEqual(wage.paymentMethod, 'CASH');
    assert.strictEqual(wage.status, 'RECORDED');

    // Verify summary captures worker wages
    const summary = await expenseService.getExpenseSummary({ date: TEST_DATE });
    assert.strictEqual(summary.totalOpex, '5000.00'); // 2000 + 1500 + 1500
    assert.strictEqual(summary.cashOpex, '3500.00');  // 2000 + 1500
    assert.strictEqual(summary.workerWages, '1500.00');
    assert.strictEqual(summary.otherOpex, '3500.00');
  });

  // ==================================================
  // 4. TEST 4: NEGATIVE EXPENSE VALIDATION
  // ==================================================
  test('4. Negative Expense: Fails validation when amount is negative', async () => {
    await assert.rejects(
      async () => {
        await expenseService.createExpense(
          {
            expenseDate: TEST_DATE,
            category: ExpenseCategory.DIESEL_FUEL,
            amount: '-500.00',
            paymentMethod: ExpensePaymentMethod.CASH,
            recipient: 'Indian Oil'
          },
          adminUser.id
        );
      },
      (err: any) => {
        assert.ok(err instanceof AppError || err.code === 'EXPENSE_INVALID_AMOUNT' || err.statusCode === 400);
        return true;
      }
    );
  });

  // ==================================================
  // 5. TEST 5: ZERO EXPENSE VALIDATION
  // ==================================================
  test('5. Zero Expense: Fails validation when amount is zero', async () => {
    await assert.rejects(
      async () => {
        await expenseService.createExpense(
          {
            expenseDate: TEST_DATE,
            category: ExpenseCategory.MAINTENANCE,
            amount: '0.00',
            paymentMethod: ExpensePaymentMethod.CASH,
            recipient: 'Weighing Scale Tech'
          },
          adminUser.id
        );
      },
      (err: any) => {
        assert.ok(err instanceof AppError || err.code === 'EXPENSE_INVALID_AMOUNT' || err.statusCode === 400);
        return true;
      }
    );
  });

  // ==================================================
  // 6. TEST 6: DUPLICATE SUBMISSION & IDEMPOTENCY
  // ==================================================
  test('6. Duplicate Submission: Same idempotencyKey returns existing expense with zero duplication', async () => {
    const key = `EXP_IDEMP_${Date.now()}`;

    const first = await expenseService.createExpense(
      {
        expenseDate: TEST_DATE,
        category: ExpenseCategory.PACKAGING,
        amount: '750.00',
        paymentMethod: ExpensePaymentMethod.CASH,
        recipient: 'Kannan Box Traders',
        idempotencyKey: key
      },
      adminUser.id
    );

    createdExpenseIds.push(first.id);

    const countBefore = await prisma.expense.count();

    // Duplicate call with exact same idempotencyKey
    const second = await expenseService.createExpense(
      {
        expenseDate: TEST_DATE,
        category: ExpenseCategory.PACKAGING,
        amount: '750.00',
        paymentMethod: ExpensePaymentMethod.CASH,
        recipient: 'Kannan Box Traders',
        idempotencyKey: key
      },
      adminUser.id
    );

    const countAfter = await prisma.expense.count();

    assert.strictEqual(first.id, second.id);
    assert.strictEqual(first.expenseNumber, second.expenseNumber);
    assert.strictEqual(countAfter, countBefore, 'Database count must remain identical');
  });

  // ==================================================
  // 7. TEST 7: EXPENSE CANCELLATION (AUDIT INTEGRITY)
  // ==================================================
  test('7. Expense Cancellation: Reverses status, retains audit trail, and excludes from active net OPEX', async () => {
    const expense = await expenseService.createExpense(
      {
        expenseDate: TEST_DATE,
        category: ExpenseCategory.MAINTENANCE,
        amount: '800.00',
        paymentMethod: ExpensePaymentMethod.CASH,
        recipient: 'Cold Storage Electrician'
      },
      adminUser.id
    );

    createdExpenseIds.push(expense.id);

    const summaryBefore = await expenseService.getExpenseSummary({ date: TEST_DATE });

    // Cancel expense
    const cancelled = await expenseService.cancelExpense(
      expense.id,
      'Bill was entered with incorrect vendor details',
      adminUser.id
    );

    assert.strictEqual(cancelled.status, 'CANCELLED');
    assert.strictEqual(cancelled.cancelReason, 'Bill was entered with incorrect vendor details');
    assert.strictEqual(cancelled.cancelledById, adminUser.id);
    assert.ok(cancelled.cancelledAt);

    // Verify row still exists in database (NEVER hard-deleted)
    const inDb = await prisma.expense.findUnique({ where: { id: expense.id } });
    assert.ok(inDb, 'Cancelled expense must remain in database for auditable accounting');
    assert.strictEqual(inDb.status, 'CANCELLED');

    // Verify cannot cancel twice
    await assert.rejects(
      async () => {
        await expenseService.cancelExpense(expense.id, 'Duplicate cancel attempt', adminUser.id);
      },
      (err: any) => {
        assert.strictEqual(err.code, 'EXPENSE_ALREADY_CANCELLED');
        return true;
      }
    );

    // Verify net active summary excludes cancelled amount
    const summaryAfter = await expenseService.getExpenseSummary({ date: TEST_DATE });
    assert.strictEqual(
      summaryAfter.totalOpex,
      new Prisma.Decimal(summaryBefore.totalOpex).sub('800.00').toFixed(2),
      'Total active OPEX should exclude cancelled items'
    );
    assert.strictEqual(summaryAfter.cancelledCount, 1);
    assert.strictEqual(summaryAfter.cancelledTotal, '800.00');
  });

  // ==================================================
  // 8. TEST 8: CLOSED DAY PROTECTION
  // ==================================================
  test('8. Closed Day Protection: Rejects expense mutations on a closed business date', async () => {
    await assert.rejects(
      async () => {
        await expenseService.createExpense(
          {
            expenseDate: CLOSED_DATE,
            category: ExpenseCategory.DIESEL_FUEL,
            amount: '1200.00',
            paymentMethod: ExpensePaymentMethod.CASH,
            recipient: 'Harbour Fuel'
          },
          adminUser.id
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'DAY_ALREADY_CLOSED');
        return true;
      }
    );
  });

  // ==================================================
  // 9. TEST 9: RBAC AUTHORIZATION
  // ==================================================
  test('9. RBAC: 401 unauthenticated, 403 worker forbidden, 201 admin allowed', async () => {
    const payload = {
      expenseDate: TEST_DATE,
      category: 'CLEANING',
      amount: '400.00',
      paymentMethod: 'CASH',
      recipient: 'Harbour Cleaning Team'
    };

    // A. Unauthenticated request -> 401
    const resNoAuth = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.strictEqual(resNoAuth.status, 401);

    // B. Worker role request -> 403 Forbidden
    const resWorker = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`
      },
      body: JSON.stringify(payload)
    });
    assert.strictEqual(resWorker.status, 403);

    // C. Admin role request -> 201 Created
    const resAdmin = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });
    assert.strictEqual(resAdmin.status, 201);
    const body = await resAdmin.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.category, 'CLEANING');
    createdExpenseIds.push(body.data.id);
  });

  // ==================================================
  // 10. TEST 10: SEPARATION FROM FISHERMAN ADVANCES
  // ==================================================
  test('10. Advance Separation: Advance disbursement creates FishermanAdvance but NO Expense record', async () => {
    const expenseCountBefore = await prisma.expense.count();

    const advanceResult = await advanceService.disburseAdvance(
      {
        fishermanId,
        sanctionDate: TEST_DATE,
        amount: '10000.00',
        paymentMethod: AdvancePaymentMethod.CASH,
        notes: 'Seasonal advance'
      },
      adminUser.id
    );

    const expenseCountAfter = await prisma.expense.count();

    assert.ok(advanceResult.advance.id);
    assert.strictEqual(
      expenseCountAfter,
      expenseCountBefore,
      'Fisherman advance disbursement must NEVER create an Expense record'
    );
  });

  // ==================================================
  // 11. TEST 11: SEPARATION FROM SEAFOOD PURCHASES
  // ==================================================
  test('11. Purchase Separation: Catch collection payment creates PurchaseBill but NO Expense record', async () => {
    const expenseCountBefore = await prisma.expense.count();

    const bill = await purchaseBillService.createPurchaseBill(
      {
        fishermanId,
        billDate: TEST_DATE,
        items: [{ seafoodId, gradeId, quantityKg: '10.00' }],
        payment: {
          method: PaymentMethod.CASH,
          amount: '3000.00'
        }
      },
      adminUser.id
    );

    createdBillIds.push(bill.id);

    const expenseCountAfter = await prisma.expense.count();

    assert.ok(bill.id);
    assert.strictEqual(
      expenseCountAfter,
      expenseCountBefore,
      'Seafood collection purchase payment must NEVER create an Expense record'
    );
  });

  // ==================================================
  // 12. TEST 12: SEPARATION FROM INVENTORY WASTAGE
  // ==================================================
  test('12. Wastage Separation: Seafood stock wastage creates StockMovement WASTE but NO Expense record', async () => {
    const expenseCountBefore = await prisma.expense.count();

    const waste = await stockService.recordWastage(
      {
        seafoodId,
        gradeId,
        quantityKg: '2.00',
        reason: 'Spoilage during transport'
      },
      adminUser.id
    );

    const expenseCountAfter = await prisma.expense.count();

    assert.ok(waste.movement.id);
    assert.strictEqual(waste.movement.movementType, 'WASTE');
    assert.strictEqual(
      expenseCountAfter,
      expenseCountBefore,
      'Stock wastage must be managed by WAC stock movement and NEVER create an Expense record'
    );
  });

  // ==================================================
  // 13. TEST 13: EXPENSE SUMMARY & CATEGORY AGGREGATIONS
  // ==================================================
  test('13. Expense Summary: Accurately computes totals by category, payment method, and worker wages', async () => {
    const summary = await expenseService.getExpenseSummary({ date: TEST_DATE });

    assert.ok(parseFloat(summary.totalOpex) > 0);
    assert.ok(parseFloat(summary.cashOpex) > 0);
    assert.ok(parseFloat(summary.workerWages) > 0);
    assert.ok(summary.byCategory.length > 0);
    assert.ok(summary.byPaymentMethod.length > 0);

    const workerCategory = summary.byCategory.find((c) => c.category === 'WORKER_WAGE');
    assert.ok(workerCategory, 'Summary must include WORKER_WAGE category breakdown');
    assert.strictEqual(workerCategory.amount, '1500.00');

    const cashMethod = summary.byPaymentMethod.find((m) => m.paymentMethod === 'CASH');
    assert.ok(cashMethod, 'Summary must include CASH payment method breakdown');
    assert.ok(parseFloat(cashMethod.amount) > 0);
  });

  // ==================================================
  // 14. TEST 14: FILTERING, SEARCH, AND PAGINATION
  // ==================================================
  test('14. Query & Filtering: Filters expenses by category, paymentMethod, and recipient', async () => {
    // A. Filter by category
    const transportResult = await expenseService.getExpenses({
      page: 1,
      limit: 10,
      category: ExpenseCategory.TRANSPORT
    });
    assert.ok(transportResult.items.length >= 1);
    assert.ok(transportResult.items.every((e) => e.category === 'TRANSPORT'));

    // B. Filter by recipient
    const raviResult = await expenseService.getExpenses({
      page: 1,
      limit: 10,
      recipient: 'Ravi'
    });
    assert.ok(raviResult.items.length >= 1);
    assert.strictEqual(raviResult.items[0].recipient, 'Ravi');

    // C. Filter by paymentMethod
    const upiResult = await expenseService.getExpenses({
      page: 1,
      limit: 10,
      paymentMethod: ExpensePaymentMethod.UPI
    });
    assert.ok(upiResult.items.length >= 1);
    assert.ok(upiResult.items.every((e) => e.paymentMethod === 'UPI'));
  });
});
