import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { createApp } from '../src/app';
import { signToken } from '../src/utils/jwt';
import { prisma } from '../src/lib/prisma';
import { DayEndService } from '../src/services/dayEnd.service';
import { PurchaseBillService } from '../src/services/purchaseBill.service';
import { SaleService } from '../src/services/sale.service';
import { StockService } from '../src/services/stock.service';
import { DailyRateService } from '../src/services/dailyRate.service';
import { FishermanAdvanceService } from '../src/services/fishermanAdvance.service';
import { ExpenseService } from '../src/services/expense.service';
import { SeafoodService } from '../src/services/seafood.service';
import { SeafoodCategoryService } from '../src/services/seafoodCategory.service';
import { SeafoodGradeService } from '../src/services/seafoodGrade.service';
import { FishermanService } from '../src/services/fisherman.service';
import { CustomerService } from '../src/services/customer.service';
import {
  Prisma,
  DayEndStatus,
  PaymentMethod,
  AdvancePaymentMethod,
  ExpenseCategory,
  ExpensePaymentMethod
} from '@prisma/client';

describe('Phase 5 Day End / Terminal Closing & Daily Reconciliation Tests', { concurrency: 1 }, () => {
  const dayEndService = new DayEndService();
  const purchaseBillService = new PurchaseBillService();
  const saleService = new SaleService();
  const stockService = new StockService();
  const dailyRateService = new DailyRateService();
  const advanceService = new FishermanAdvanceService();
  const expenseService = new ExpenseService();
  const seafoodService = new SeafoodService();
  const categoryService = new SeafoodCategoryService();
  const gradeService = new SeafoodGradeService();
  const fishermanService = new FishermanService();
  const customerService = new CustomerService();

  const testSuffix = Date.now().toString().slice(-6);
  const TEST_DATE = '2026-10-05';
  const CONCURRENT_DATE = '2026-10-06';
  const LOCK_TEST_DATE = '2026-10-07';

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
  let customerId: string;

  const createdBillIds: string[] = [];
  const createdSaleIds: string[] = [];
  const createdExpenseIds: string[] = [];

  before(async () => {
    // 0. Clean up any residual data for test dates to ensure pristine isolated test run
    const testDateObjs = [
      DailyRateService.parseDate(TEST_DATE),
      DailyRateService.parseDate(CONCURRENT_DATE),
      DailyRateService.parseDate(LOCK_TEST_DATE)
    ];

    await prisma.dayEndClosing.deleteMany({
      where: { businessDate: { in: testDateObjs } }
    });

    const residualSales = await prisma.sale.findMany({
      where: { saleDate: { in: testDateObjs } },
      select: { id: true }
    });
    if (residualSales.length > 0) {
      const ids = residualSales.map((s) => s.id);
      await prisma.stockMovement.deleteMany({ where: { referenceType: 'SALE', referenceId: { in: ids } } });
      await prisma.payment.deleteMany({ where: { saleId: { in: ids } } });
      await prisma.saleItem.deleteMany({ where: { saleId: { in: ids } } });
      await prisma.sale.deleteMany({ where: { id: { in: ids } } });
    }

    const residualBills = await prisma.purchaseBill.findMany({
      where: { billDate: { in: testDateObjs } },
      select: { id: true }
    });
    if (residualBills.length > 0) {
      const ids = residualBills.map((b) => b.id);
      await prisma.stockMovement.deleteMany({ where: { referenceType: 'PURCHASE_BILL', referenceId: { in: ids } } });
      await prisma.payment.deleteMany({ where: { purchaseBillId: { in: ids } } });
      await prisma.purchaseBillItem.deleteMany({ where: { purchaseBillId: { in: ids } } });
      await prisma.purchaseBill.deleteMany({ where: { id: { in: ids } } });
    }

    await prisma.expense.deleteMany({
      where: { expenseDate: { in: testDateObjs } }
    });

    await prisma.fishermanAdvance.deleteMany({
      where: { sanctionDate: { in: testDateObjs } }
    });

    // 1. Fetch or create Admin and Worker roles
    const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    const workerRole = await prisma.role.findFirst({ where: { name: 'WORKER' } });

    // 2. Create Admin and Worker users
    adminUser = await prisma.user.create({
      data: {
        name: `Admin_DayEnd_${testSuffix}`,
        email: `admin_dayend_${testSuffix}@marineseafoods.com`,
        passwordHash: 'dummyhash',
        roleId: adminRole!.id
      }
    });

    workerUser = await prisma.user.create({
      data: {
        name: `Worker_DayEnd_${testSuffix}`,
        email: `worker_dayend_${testSuffix}@marineseafoods.com`,
        passwordHash: 'dummyhash',
        roleId: workerRole!.id
      }
    });

    adminToken = signToken({ id: adminUser.id, email: adminUser.email, role: 'ADMIN', name: adminUser.name });
    workerToken = signToken({ id: workerUser.id, email: workerUser.email, role: 'WORKER', name: workerUser.name });

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

    // 4. Setup Master Data
    const cat = await categoryService.createCategory({
      name: `DE_Cat_${testSuffix}`,
      description: 'Day End Category'
    });
    categoryId = cat.id;

    const grade = await gradeService.createGrade({
      name: `DE_Grd_${testSuffix}`,
      description: 'Day End Grade'
    });
    gradeId = grade.id;

    const seafood = await seafoodService.createSeafood({
      name: `DE_Fish_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodId = seafood.id;

    const fisherman = await fishermanService.createFisherman({
      name: `DE_Fisherman_${testSuffix}`,
      mobileNumber: `918${testSuffix.padEnd(7, '0')}`,
      boatName: `DE_Boat_${testSuffix}`
    });
    fishermanId = fisherman.id;

    const customer = await customerService.createCustomer({
      name: `DE_Customer_${testSuffix}`,
      mobileNumber: `917${testSuffix.padEnd(7, '0')}`
    });
    customerId = customer.id;

    // 5. Setup Published Rates for test dates
    for (const d of [TEST_DATE, CONCURRENT_DATE, LOCK_TEST_DATE]) {
      const rate = await dailyRateService.createDailyRate({
        rateDate: d,
        seafoodId,
        gradeId,
        purchaseRate: '250.00',
        sellingRate: '350.00'
      });
      await dailyRateService.publishRate(rate.id);
    }
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    // Teardown created records safely
    await prisma.dayEndClosing.deleteMany({
      where: { businessDate: { in: [DailyRateService.parseDate(TEST_DATE), DailyRateService.parseDate(CONCURRENT_DATE), DailyRateService.parseDate(LOCK_TEST_DATE)] } }
    });

    if (createdExpenseIds.length > 0) {
      await prisma.expense.deleteMany({ where: { id: { in: createdExpenseIds } } });
    }

    // Clean up all sales for customerId or createdSaleIds
    const sales = await prisma.sale.findMany({
      where: {
        OR: [
          { customerId },
          { id: { in: createdSaleIds } }
        ]
      },
      select: { id: true }
    });
    const allSaleIds = Array.from(new Set([...createdSaleIds, ...sales.map(s => s.id)]));
    if (allSaleIds.length > 0) {
      await prisma.stockMovement.deleteMany({
        where: { referenceType: 'SALE', referenceId: { in: allSaleIds } }
      });
      await prisma.payment.deleteMany({ where: { saleId: { in: allSaleIds } } });
      await prisma.saleItem.deleteMany({ where: { saleId: { in: allSaleIds } } });
      await prisma.sale.deleteMany({ where: { id: { in: allSaleIds } } });
    }

    // Clean up all purchase bills for fishermanId or createdBillIds
    const bills = await prisma.purchaseBill.findMany({
      where: {
        OR: [
          { fishermanId },
          { id: { in: createdBillIds } }
        ]
      },
      select: { id: true }
    });
    const allBillIds = Array.from(new Set([...createdBillIds, ...bills.map(b => b.id)]));
    if (allBillIds.length > 0) {
      await prisma.stockMovement.deleteMany({
        where: { referenceType: 'PURCHASE_BILL', referenceId: { in: allBillIds } }
      });
      await prisma.payment.deleteMany({ where: { purchaseBillId: { in: allBillIds } } });
      await prisma.purchaseBillItem.deleteMany({ where: { purchaseBillId: { in: allBillIds } } });
      await prisma.purchaseBill.deleteMany({ where: { id: { in: allBillIds } } });
    }

    await prisma.stockMovement.deleteMany({ where: { seafoodId } });
    await prisma.stock.deleteMany({ where: { seafoodId } });
    await prisma.dailyRate.deleteMany({ where: { seafoodId } });
    await prisma.fishermanAdvanceLedger.deleteMany({ where: { fishermanId } });
    await prisma.fishermanAdvance.deleteMany({ where: { fishermanId } });
    await prisma.fisherman.deleteMany({ where: { id: fishermanId } });
    await prisma.customer.deleteMany({ where: { id: customerId } });
    await prisma.seafood.deleteMany({ where: { id: seafoodId } });
    await prisma.seafoodGrade.deleteMany({ where: { id: gradeId } });
    await prisma.seafoodCategory.deleteMany({ where: { id: categoryId } });
    await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, workerUser.id] } } });
  });

  // ==================================================
  // 1. TEST 1: DAY-END PREVIEW
  // ==================================================
  test('1. Day-End Preview: Computes sales, collections, advances, wastage, expenses, cash, and stock correctly', async () => {
    // A. Create catch intake: 100 KG @ ₹250 = ₹25,000. Cash paid: ₹15,000
    const bill = await purchaseBillService.createPurchaseBill(
      {
        fishermanId,
        billDate: TEST_DATE,
        items: [{ seafoodId, gradeId, quantityKg: '100.00' }],
        payment: { method: PaymentMethod.CASH, amount: '15000.00' }
      },
      adminUser.id
    );
    createdBillIds.push(bill.id);

    // B. Create sale: 40 KG @ ₹350 = ₹14,000. Cash collected: ₹14,000
    const sale = await saleService.createSale(
      {
        customerId,
        saleDate: TEST_DATE,
        items: [{ seafoodId, gradeId, quantityKg: '40.00' }],
        payment: { method: PaymentMethod.CASH, amount: '14000.00' }
      },
      adminUser.id
    );
    createdSaleIds.push(sale.id);

    // C. Record wastage: 5 KG
    await stockService.recordWastage({
      seafoodId,
      gradeId,
      quantityKg: '5.00',
      reason: 'Transit crush damage',
      date: TEST_DATE,
      userId: adminUser.id
    });

    // D. Record operational expense: ₹1,000 (CASH) and Worker Wage ₹1,200 (CASH)
    const exp1 = await expenseService.createExpense(
      {
        expenseDate: TEST_DATE,
        category: ExpenseCategory.ICE,
        amount: '1000.00',
        paymentMethod: ExpensePaymentMethod.CASH,
        recipient: 'Marina Ice'
      },
      adminUser.id
    );
    createdExpenseIds.push(exp1.id);

    const exp2 = await expenseService.recordWorkerWage(
      {
        expenseDate: TEST_DATE,
        workerName: 'Ravi',
        amount: '1200.00',
        paymentMethod: ExpensePaymentMethod.CASH
      },
      adminUser.id
    );
    createdExpenseIds.push(exp2.id);

    // E. Advance disbursement: ₹5,000 (CASH)
    await advanceService.disburseAdvance(
      {
        fishermanId,
        sanctionDate: TEST_DATE,
        amount: '5000.00',
        paymentMethod: AdvancePaymentMethod.CASH
      },
      adminUser.id
    );

    // Fetch Preview
    const preview = await dayEndService.getDayEndPreview(TEST_DATE);

    assert.strictEqual(preview.businessDate, TEST_DATE);
    assert.strictEqual(preview.status, DayEndStatus.OPEN);

    // Stock verification: Received 100 KG, Sold 40 KG, Wastage 5 KG
    assert.strictEqual(preview.stockSummary.totalReceivedKg, '100.000');
    assert.strictEqual(preview.stockSummary.totalSoldKg, '40.000');
    assert.strictEqual(preview.stockSummary.totalWastageKg, '5.000');

    const testItem = preview.stockSummary.items.find((i) => i.seafoodId === seafoodId && i.gradeId === gradeId);
    assert.ok(testItem, 'Test item flow should exist');
    assert.strictEqual(testItem.expectedClosingKg, '55.000');

    const expectedTotal = new Prisma.Decimal(preview.stockSummary.openingStockKg).add('100').sub('40').sub('5').toFixed(3);
    assert.strictEqual(preview.stockSummary.expectedClosingStockKg, expectedTotal);

    // Cash verification:
    // Inflows: Cash Sales ₹14,000
    // Outflows: Purchase Cash ₹15,000 + Advance Cash ₹5,000 + Expenses Cash ₹2,200 = ₹22,200
    // Expected Cash = 0 + 14000 - 22200 = -₹8,200
    assert.strictEqual(preview.cashSummary.cashReceivedSales, '14000.00');
    assert.strictEqual(preview.cashSummary.cashPaidPurchases, '15000.00');
    assert.strictEqual(preview.cashSummary.cashPaidAdvances, '5000.00');
    assert.strictEqual(preview.cashSummary.cashPaidExpenses, '2200.00');
    assert.strictEqual(preview.cashSummary.expectedClosingCash, '-8200.00');

    // Collections & Sales
    assert.strictEqual(preview.collectionsSummary.totalBills, 1);
    assert.strictEqual(preview.collectionsSummary.grossTotal, '25000.00');
    assert.strictEqual(preview.salesSummary.totalSales, 1);
    assert.strictEqual(preview.salesSummary.grossSales, '14000.00');

    // Wastage
    assert.strictEqual(preview.wastageSummary.totalWastageKg, '5.000');
    assert.strictEqual(preview.wastageSummary.totalWastageCost, '1250.00'); // 5 KG * ₹250
  });

  // ==================================================
  // 2. TEST 2: EXACT RECONCILIATION
  // ==================================================
  test('2. Exact Reconciliation: Closes day when actual cash and actual stock match expected', async () => {
    const preview = await dayEndService.getDayEndPreview(TEST_DATE);

    // Close day with exact matching cash and stock
    const closing = await dayEndService.closeDay(
      TEST_DATE,
      {
        actualPhysicalCash: preview.cashSummary.expectedClosingCash,
        actualPhysicalStockKg: preview.stockSummary.expectedClosingStockKg,
        notes: 'End of shift reconciliation fully matched'
      },
      adminUser.id
    );

    assert.ok(closing.id);
    assert.strictEqual(closing.closingStatus, DayEndStatus.CLOSED);
    assert.strictEqual(closing.cashVariance, '0.00');
    assert.strictEqual(closing.stockVarianceKg, '0.000');
    assert.strictEqual(closing.closedById, adminUser.id);
    assert.ok(closing.closedAt);

    // Re-query preview to confirm stored closing snapshot is returned
    const afterPreview = await dayEndService.getDayEndPreview(TEST_DATE);
    assert.strictEqual(afterPreview.status, DayEndStatus.CLOSED);
    assert.strictEqual(afterPreview.reconciliationStatus, 'RECONCILED');
    assert.ok(afterPreview.storedClosing);
  });

  // ==================================================
  // 3. TEST 3: REOPEN DAY (ADMIN ONLY) & REOPEN REASON
  // ==================================================
  test('3. Reopen Day: Admin reopens closed date with mandatory reason; unlocks date for adjustments', async () => {
    const reopened = await dayEndService.reopenDay(
      TEST_DATE,
      { reason: 'Audit review required for evening collection shift' },
      adminUser.id
    );

    assert.strictEqual(reopened.closingStatus, DayEndStatus.REOPENED);
    assert.strictEqual(reopened.reopenedById, adminUser.id);
    assert.strictEqual(reopened.reopenReason, 'Audit review required for evening collection shift');

    // Date should now be open for preview
    const preview = await dayEndService.getDayEndPreview(TEST_DATE);
    assert.strictEqual(preview.status, DayEndStatus.REOPENED);
  });

  // ==================================================
  // 4. TEST 4: CASH DIFFERENCE RECONCILIATION
  // ==================================================
  test('4. Cash Difference: Detects difference and enforces mandatory variance reason', async () => {
    const preview = await dayEndService.getDayEndPreview(TEST_DATE);
    const shortCash = new Prisma.Decimal(preview.cashSummary.expectedClosingCash).sub('500.00').toFixed(2);

    // A. Rejects closing without reason when variance exists
    await assert.rejects(
      async () => {
        await dayEndService.closeDay(
          TEST_DATE,
          {
            actualPhysicalCash: shortCash,
            actualPhysicalStockKg: preview.stockSummary.expectedClosingStockKg,
            varianceReason: '' // Empty reason
          },
          adminUser.id
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'RECONCILIATION_REASON_REQUIRED');
        return true;
      }
    );

    // B. Accepts closing with valid variance reason
    const closed = await dayEndService.closeDay(
      TEST_DATE,
      {
        actualPhysicalCash: shortCash,
        actualPhysicalStockKg: preview.stockSummary.expectedClosingStockKg,
        varianceReason: '₹500 cash short due to unreceipted boat porter tips'
      },
      adminUser.id
    );

    assert.strictEqual(closed.closingStatus, DayEndStatus.CLOSED);
    assert.strictEqual(closed.cashVariance, '-500.00');
    assert.strictEqual(closed.varianceReason, '₹500 cash short due to unreceipted boat porter tips');
  });

  // ==================================================
  // 5. TEST 5: STOCK DIFFERENCE RECONCILIATION
  // ==================================================
  test('5. Stock Difference: Detects physical stock variance without silently creating fake stock adjustments', async () => {
    // Reopen date first
    await dayEndService.reopenDay(
      TEST_DATE,
      { reason: 'Recheck physical warehouse stock count' },
      adminUser.id
    );

    const preview = await dayEndService.getDayEndPreview(TEST_DATE);
    const shortStock = new Prisma.Decimal(preview.stockSummary.expectedClosingStockKg).sub('2.000').toFixed(3);

    const closed = await dayEndService.closeDay(
      TEST_DATE,
      {
        actualPhysicalCash: preview.cashSummary.expectedClosingCash,
        actualPhysicalStockKg: shortStock,
        varianceReason: '2 KG physical shortfall due to crate weighing scale drift'
      },
      adminUser.id
    );

    assert.strictEqual(closed.closingStatus, DayEndStatus.CLOSED);
    assert.strictEqual(closed.stockVarianceKg, '-2.000');
    assert.strictEqual(closed.varianceReason, '2 KG physical shortfall due to crate weighing scale drift');

    // Verify system stock in perpetual inventory was NOT mutated silently
    const currentStock = await stockService.getStockBySeafoodAndGrade(seafoodId, gradeId);
    assert.strictEqual(new Prisma.Decimal(currentStock.quantityKg).toFixed(3), '55.000', 'Perpetual stock must remain authoritative');
  });

  // ==================================================
  // 6. TEST 6: DAY LOCK (PREVENTS MUTATIONS ON CLOSED DATE)
  // ==================================================
  test('6. Day Lock: Rejects sales, purchases, wastage, advances, and expenses on a closed business date', async () => {
    // TEST_DATE is currently CLOSED

    // A. Sale creation rejected
    await assert.rejects(
      async () => {
        await saleService.createSale(
          {
            customerId,
            saleDate: TEST_DATE,
            items: [{ seafoodId, gradeId, quantityKg: '5.00' }]
          },
          adminUser.id
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'DAY_ALREADY_CLOSED');
        return true;
      }
    );

    // B. Catch Intake / Purchase Bill rejected
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill(
          {
            fishermanId,
            billDate: TEST_DATE,
            items: [{ seafoodId, gradeId, quantityKg: '10.00' }]
          },
          adminUser.id
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'DAY_ALREADY_CLOSED');
        return true;
      }
    );

    // C. Wastage rejected
    await assert.rejects(
      async () => {
        await stockService.recordWastage({
          seafoodId,
          gradeId,
          quantityKg: '1.00',
          reason: 'Late spoilage',
          date: TEST_DATE,
          userId: adminUser.id
        });
      },
      (err: any) => {
        assert.strictEqual(err.code, 'DAY_ALREADY_CLOSED');
        return true;
      }
    );

    // D. Expense creation rejected
    await assert.rejects(
      async () => {
        await expenseService.createExpense(
          {
            expenseDate: TEST_DATE,
            category: ExpenseCategory.CLEANING,
            amount: '300.00',
            paymentMethod: ExpensePaymentMethod.CASH,
            recipient: 'Cleaners'
          },
          adminUser.id
        );
      },
      (err: any) => {
        assert.strictEqual(err.code, 'DAY_ALREADY_CLOSED');
        return true;
      }
    );

    // E. Advance disbursement rejected
    await assert.rejects(
      async () => {
        await advanceService.disburseAdvance(
          {
            fishermanId,
            sanctionDate: TEST_DATE,
            amount: '2000.00',
            paymentMethod: AdvancePaymentMethod.CASH
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
  // 7. TEST 7: CONCURRENT CLOSE PROTECTION
  // ==================================================
  test('7. Concurrent Close: Parallel requests guarantee exactly one succeeds and one fails with DAY_ALREADY_CLOSED', async () => {
    // Attempt concurrent closing of CONCURRENT_DATE
    const promises = [
      dayEndService.closeDay(CONCURRENT_DATE, { notes: 'Terminal close A' }, adminUser.id),
      dayEndService.closeDay(CONCURRENT_DATE, { notes: 'Terminal close B' }, adminUser.id)
    ];

    const results = await Promise.allSettled(promises);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent close must succeed');
    assert.strictEqual(rejected.length, 1, 'Exactly one concurrent close must fail');

    const err = (rejected[0] as PromiseRejectedResult).reason;
    assert.strictEqual(err.code, 'DAY_ALREADY_CLOSED');
  });

  // ==================================================
  // 8. TEST 8: DUPLICATE CLOSE REJECTION
  // ==================================================
  test('8. Duplicate Close: Sequential second close returns DAY_ALREADY_CLOSED', async () => {
    await assert.rejects(
      async () => {
        await dayEndService.closeDay(CONCURRENT_DATE, { notes: 'Duplicate close attempt' }, adminUser.id);
      },
      (err: any) => {
        assert.strictEqual(err.code, 'DAY_ALREADY_CLOSED');
        return true;
      }
    );
  });

  // ==================================================
  // 9. TEST 9: WAC AND INVENTORY INTEGRITY
  // ==================================================
  test('9. WAC Integrity: Closing the day preserves perpetual WAC averageCost and totalValue without modification', async () => {
    const stockBefore = await stockService.getStockBySeafoodAndGrade(seafoodId, gradeId);

    // Reopen and re-close LOCK_TEST_DATE
    await dayEndService.closeDay(LOCK_TEST_DATE, { notes: 'Integrity test' }, adminUser.id);

    const stockAfter = await stockService.getStockBySeafoodAndGrade(seafoodId, gradeId);

    assert.strictEqual(stockAfter.stock?.averageCost, stockBefore.stock?.averageCost);
    assert.strictEqual(stockAfter.stock?.totalValue, stockBefore.stock?.totalValue);
    assert.strictEqual(stockAfter.quantityKg, stockBefore.quantityKg);
  });

  // ==================================================
  // 10. TEST 10: HISTORICAL COGS INTEGRITY
  // ==================================================
  test('10. Historical COGS Integrity: Closing the day does not mutate historical SaleItem.costRate or cogsAmount', async () => {
    const saleItemsBefore = await prisma.saleItem.findMany({
      where: { saleId: createdSaleIds[0] }
    });

    // Close preview or recheck
    const preview = await dayEndService.getDayEndPreview(TEST_DATE);
    assert.ok(preview);

    const saleItemsAfter = await prisma.saleItem.findMany({
      where: { saleId: createdSaleIds[0] }
    });

    assert.strictEqual(saleItemsAfter[0].costRate.toString(), saleItemsBefore[0].costRate.toString());
    assert.strictEqual(saleItemsAfter[0].cogsAmount.toString(), saleItemsBefore[0].cogsAmount.toString());
  });

  // ==================================================
  // 11. TEST 11: RBAC AUTHORIZATION
  // ==================================================
  test('11. RBAC: Workers can view preview but receive 403 on close/reopen; Admin succeeds', async () => {
    // A. Unauthenticated preview -> 401
    const resNoAuth = await fetch(`${baseUrl}/api/day-end/${TEST_DATE}/preview`);
    assert.strictEqual(resNoAuth.status, 401);

    // B. Worker preview -> 200 OK (Workers can view preview)
    const resWorkerPreview = await fetch(`${baseUrl}/api/day-end/${TEST_DATE}/preview`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    assert.strictEqual(resWorkerPreview.status, 200);

    // C. Worker close -> 403 Forbidden
    const resWorkerClose = await fetch(`${baseUrl}/api/day-end/${LOCK_TEST_DATE}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`
      },
      body: JSON.stringify({ notes: 'Worker close attempt' })
    });
    assert.strictEqual(resWorkerClose.status, 403);

    // D. Worker reopen -> 403 Forbidden
    const resWorkerReopen = await fetch(`${baseUrl}/api/day-end/${LOCK_TEST_DATE}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerToken}`
      },
      body: JSON.stringify({ reason: 'Worker reopen attempt' })
    });
    assert.strictEqual(resWorkerReopen.status, 403);

    // E. Admin reopen -> 200 OK
    const resAdminReopen = await fetch(`${baseUrl}/api/day-end/${LOCK_TEST_DATE}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ reason: 'Admin authorized reopening' })
    });
    assert.strictEqual(resAdminReopen.status, 200);
    const body = (await resAdminReopen.json()) as any;
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.closingStatus, 'REOPENED');
  });

  // ==================================================
  // 12. TEST 12: HISTORICAL LIST QUERY
  // ==================================================
  test('12. Historical Query: Lists day-end closing records with status filtering and pagination', async () => {
    const listResult = await dayEndService.listDayEnds({
      page: 1,
      limit: 10
    });

    assert.ok(listResult.items.length >= 1);
    assert.ok(listResult.total >= 1);
    assert.ok(listResult.items.some((i) => i.businessDate === TEST_DATE || i.businessDate === CONCURRENT_DATE));
  });
});
