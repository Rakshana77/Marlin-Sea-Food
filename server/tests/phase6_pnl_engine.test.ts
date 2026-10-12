import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { PnlService } from '../src/services/pnl.service';
import { SaleService } from '../src/services/sale.service';
import { StockService } from '../src/services/stock.service';
import { ExpenseService } from '../src/services/expense.service';
import { DayEndService } from '../src/services/dayEnd.service';
import { DailyRateService } from '../src/services/dailyRate.service';
import { PurchaseBillService } from '../src/services/purchaseBill.service';
import { FishermanAdvanceService } from '../src/services/fishermanAdvance.service';
import { SeafoodService } from '../src/services/seafood.service';
import { SeafoodCategoryService } from '../src/services/seafoodCategory.service';
import { SeafoodGradeService } from '../src/services/seafoodGrade.service';
import { CustomerService } from '../src/services/customer.service';
import { ExportCompanyService } from '../src/services/exportCompany.service';
import { FishermanService } from '../src/services/fisherman.service';
import { signToken } from '../src/utils/jwt';
import {
  Prisma,
  PaymentMethod,
  PaymentStatus,
  SaleStatus,
  StockMovementType,
  ExpenseCategory,
  ExpensePaymentMethod,
  AdvancePaymentMethod,
  SaleType
} from '@prisma/client';

describe('Phase 6 P&L / Profit & Loss Backend Engine Tests', { concurrency: 1 }, () => {
  let server: http.Server;
  const PORT = 5109;
  const BASE_URL = `http://localhost:${PORT}`;

  const pnlService = new PnlService();
  const saleService = new SaleService();
  const stockService = new StockService();
  const expenseService = new ExpenseService();
  const dayEndService = new DayEndService();
  const dailyRateService = new DailyRateService();
  const purchaseBillService = new PurchaseBillService();
  const advanceService = new FishermanAdvanceService();
  const seafoodService = new SeafoodService();
  const categoryService = new SeafoodCategoryService();
  const gradeService = new SeafoodGradeService();
  const customerService = new CustomerService();
  const exportCompanyService = new ExportCompanyService();
  const fishermanService = new FishermanService();

  const testSuffix = Date.now().toString().slice(-6);

  let adminUser: any;
  let workerUser: any;
  let adminToken: string;
  let workerToken: string;

  let categoryId: string;
  let gradeAId: string;
  let gradeBId: string;
  let seafoodId1: string;
  let seafoodId2: string;
  let customerId: string;
  let exportCompanyId: string;
  let fishermanId: string;

  const randomYear = 2070 + Math.floor(Math.random() * 20);
  const randomMonth = String(1 + Math.floor(Math.random() * 11)).padStart(2, '0');
  const DATE_1 = `${randomYear}-${randomMonth}-01`;
  const DATE_2 = `${randomYear}-${randomMonth}-02`;
  const DATE_OUTSIDE = `${randomYear}-${randomMonth}-05`;

  before(async () => {
    // 1. Start HTTP Server for API tests
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(PORT, () => resolve());
    });

    // 2. Fetch or create Admin and Worker roles and real users
    const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    const workerRole = await prisma.role.findFirst({ where: { name: 'WORKER' } });

    adminUser = await prisma.user.create({
      data: {
        name: `Admin_PnL_${testSuffix}`,
        email: `admin_pnl_${testSuffix}@marineseafoods.com`,
        passwordHash: 'dummyhash',
        roleId: adminRole!.id
      }
    });

    workerUser = await prisma.user.create({
      data: {
        name: `Worker_PnL_${testSuffix}`,
        email: `worker_pnl_${testSuffix}@marineseafoods.com`,
        passwordHash: 'dummyhash',
        roleId: workerRole!.id
      }
    });

    adminToken = signToken({ id: adminUser.id, email: adminUser.email, role: 'ADMIN', name: adminUser.name });
    workerToken = signToken({ id: workerUser.id, email: workerUser.email, role: 'WORKER', name: workerUser.name });

    // 3. Create Category
    const cat = await categoryService.createCategory({
      name: `Cat_PnL_${testSuffix}`,
      description: 'Category for PnL Engine Tests'
    });
    categoryId = cat.id;

    // 4. Create Grades
    const gradeA = await gradeService.createGrade({ name: `Grade_A_PnL_${testSuffix}` });
    const gradeB = await gradeService.createGrade({ name: `Grade_B_PnL_${testSuffix}` });
    gradeAId = gradeA.id;
    gradeBId = gradeB.id;

    // 5. Create Seafood Items
    const sf1 = await seafoodService.createSeafood({
      name: `Tuna_PnL_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodId1 = sf1.id;

    const sf2 = await seafoodService.createSeafood({
      name: `Pomfret_PnL_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodId2 = sf2.id;

    // 6. Create Customer
    const cust = await customerService.createCustomer({
      name: `Buyer_PnL_${testSuffix}`,
      countryCode: '+91',
      mobileNumber: `98${testSuffix}`
    });
    customerId = cust.id;

    // 7. Create Export Company
    const expCo = await exportCompanyService.createExportCompany({
      companyName: `GlobalSeafood_PnL_${testSuffix}`,
      contactPerson: 'Director PnL',
      countryCode: '+91',
      mobileNumber: `97${testSuffix}`
    });
    exportCompanyId = expCo.id;

    // 8. Create Fisherman
    const fish = await fishermanService.createFisherman({
      name: `Captain_PnL_${testSuffix}`,
      countryCode: '+91',
      mobileNumber: `96${testSuffix}`
    });
    fishermanId = fish.id;

    // 9. Publish Daily Rates for testing
    for (const d of [DATE_1, DATE_2, DATE_OUTSIDE]) {
      const r1 = await dailyRateService.createDailyRate({
        rateDate: d,
        seafoodId: seafoodId1,
        gradeId: gradeAId,
        purchaseRate: '200.00',
        sellingRate: '300.00'
      });
      await dailyRateService.publishRate(r1.id);

      const r2 = await dailyRateService.createDailyRate({
        rateDate: d,
        seafoodId: seafoodId2,
        gradeId: gradeBId,
        purchaseRate: '400.00',
        sellingRate: '600.00'
      });
      await dailyRateService.publishRate(r2.id);
    }
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    // Cleanup created data
    try {
      await prisma.dayEndClosing.deleteMany({
        where: { businessDate: { in: [DailyRateService.parseDate(DATE_1), DailyRateService.parseDate(DATE_2)] } }
      });
      await prisma.stockMovement.deleteMany({
        where: { seafoodId: { in: [seafoodId1, seafoodId2] } }
      });
      await prisma.stock.deleteMany({
        where: { seafoodId: { in: [seafoodId1, seafoodId2] } }
      });
      await prisma.payment.deleteMany({
        where: {
          OR: [
            { sale: { customerId } },
            { purchaseBill: { fishermanId } }
          ]
        }
      });
      await prisma.saleItem.deleteMany({
        where: { seafoodId: { in: [seafoodId1, seafoodId2] } }
      });
      await prisma.sale.deleteMany({
        where: { OR: [{ customerId }, { exportCompanyId }] }
      });
      await prisma.purchaseBillItem.deleteMany({
        where: { seafoodId: { in: [seafoodId1, seafoodId2] } }
      });
      await prisma.purchaseBill.deleteMany({
        where: { fishermanId }
      });
      await prisma.fishermanAdvanceLedger.deleteMany({
        where: { fishermanId }
      });
      await prisma.fishermanAdvance.deleteMany({
        where: { fishermanId }
      });
      await prisma.expense.deleteMany({
        where: { recipient: { contains: testSuffix } }
      });
      await prisma.dailyRate.deleteMany({
        where: { seafoodId: { in: [seafoodId1, seafoodId2] } }
      });
      await prisma.seafood.deleteMany({
        where: { id: { in: [seafoodId1, seafoodId2] } }
      });
      await prisma.seafoodGrade.deleteMany({
        where: { id: { in: [gradeAId, gradeBId] } }
      });
      await prisma.seafoodCategory.deleteMany({
        where: { id: categoryId }
      });
      await prisma.customer.deleteMany({
        where: { id: customerId }
      });
      await prisma.exportCompany.deleteMany({
        where: { id: exportCompanyId }
      });
      await prisma.fisherman.deleteMany({
        where: { id: fishermanId }
      });
      await prisma.user.deleteMany({
        where: { id: { in: [adminUser?.id, workerUser?.id].filter(Boolean) } }
      });
    } catch {
      // Ignored during cleanup
    }
  });

  test('1. SECTION 29 DETERMINISTIC SCENARIO: Complete P&L calculation matching exact blueprint', async () => {
    // Blueprint from Section 29:
    // Purchase: 100 kg at ₹200/kg -> Stock value ₹20,000, WAC ₹200.00
    // Sale: 60 kg at ₹300/kg -> Revenue: ₹18,000, COGS: ₹12,000, Gross Profit: ₹6,000
    // Wastage: 5 kg at WAC ₹200/kg -> Wastage Cost: ₹1,000
    // Operating Expenses: Worker wage ₹1,500 + Transport ₹500 = ₹2,000
    // Operating Profit: ₹6,000 - ₹1,000 - ₹2,000 = ₹3,000
    // Operating Margin: 3,000 / 18,000 * 100 = 16.67%

    // Step A: Inflow procurement catch
    await purchaseBillService.createPurchaseBill({
      fishermanId,
      billDate: DATE_1,
      items: [
        {
          seafoodId: seafoodId1,
          gradeId: gradeAId,
          cratesCount: 2,
          grossKg: '105.00',
          tareKg: '5.00',
          quantityKg: '100.00',
          purchaseRate: '200.00'
        }
      ]
    });

    // Step B: Sale
    await saleService.createSale({
      customerId,
      saleDate: DATE_1,
      items: [
        {
          seafoodId: seafoodId1,
          gradeId: gradeAId,
          quantityKg: '60.000'
        }
      ]
    });

    // Step C: Wastage
    await stockService.recordWastage({
      seafoodId: seafoodId1,
      gradeId: gradeAId,
      quantityKg: '5.000',
      reason: 'Spoilage during ice transit',
      date: DATE_1
    });

    // Step D: Operating expenses
    await expenseService.createExpense({
      expenseDate: DATE_1,
      category: 'WORKER_WAGE',
      amount: '1500.00',
      paymentMethod: 'CASH',
      recipient: `Worker Wages ${testSuffix}`
    });

    await expenseService.createExpense({
      expenseDate: DATE_1,
      category: 'TRANSPORT',
      amount: '500.00',
      paymentMethod: 'CASH',
      recipient: `Transport Guy ${testSuffix}`
    });

    // Execute P&L query for DATE_1
    const pnl = await pnlService.getDailyPnl(DATE_1);

    // Verify Blueprint Assertions
    assert.strictEqual(pnl.revenue.netRevenue, '18000.00', 'Revenue must be 18,000.00');
    assert.strictEqual(pnl.cogs.totalCogs, '12000.00', 'COGS must be 12,000.00');
    assert.strictEqual(pnl.grossProfit.grossProfit, '6000.00', 'Gross Profit must be 6,000.00');
    assert.strictEqual(pnl.grossProfit.grossMarginPercent, '33.33', 'Gross Margin must be 33.33%');
    assert.strictEqual(pnl.wastage.wastageCost, '1000.00', 'Wastage Cost must be 1,000.00');
    assert.strictEqual(pnl.operatingExpenses.totalExpenses, '2000.00', 'Total Expenses must be 2,000.00');
    assert.strictEqual(pnl.operatingExpenses.workerWages, '1500.00', 'Worker Wages must be 1,500.00');
    assert.strictEqual(pnl.operatingProfit.operatingProfit, '3000.00', 'Operating Profit must be 3,000.00');
    assert.strictEqual(pnl.operatingProfit.operatingMarginPercent, '16.67', 'Operating Margin must be 16.67%');
  });

  test('2. REVENUE INTEGRITY: Completed sale included, Canceled/Draft sale strictly excluded', async () => {
    // Create completed sale on DATE_2
    const sale1 = await saleService.createSale({
      customerId,
      saleDate: DATE_2,
      items: [
        {
          seafoodId: seafoodId1,
          gradeId: gradeAId,
          quantityKg: '10.000'
        }
      ]
    });
    // 10 kg * 300 = 3,000.00

    // Create another sale on DATE_2 and mark it CANCELLED
    const sale2 = await saleService.createSale({
      customerId,
      saleDate: DATE_2,
      items: [
        {
          seafoodId: seafoodId1,
          gradeId: gradeAId,
          quantityKg: '10.000'
        }
      ]
    });
    await prisma.sale.update({
      where: { id: sale2.id },
      data: { status: SaleStatus.CANCELLED, paymentStatus: PaymentStatus.CANCELLED }
    });

    // Also create a DRAFT sale to verify draft exclusion
    await prisma.sale.create({
      data: {
        invoiceNumber: `INV-DRAFT-${testSuffix}`,
        saleDate: DailyRateService.parseDate(DATE_2),
        customerId,
        totalKg: new Prisma.Decimal('10.000'),
        subtotal: new Prisma.Decimal('3000.00'),
        discount: new Prisma.Decimal('0.00'),
        taxAmount: new Prisma.Decimal('0.00'),
        grandTotal: new Prisma.Decimal('3000.00'),
        totalCogs: new Prisma.Decimal('2000.00'),
        totalGrossProfit: new Prisma.Decimal('1000.00'),
        paidAmount: new Prisma.Decimal('0.00'),
        changeAmount: new Prisma.Decimal('0.00'),
        paymentStatus: PaymentStatus.PENDING,
        status: SaleStatus.DRAFT,
        saleType: SaleType.WHOLESALE_LOCAL
      }
    });

    const pnl = await pnlService.getDailyPnl(DATE_2);

    assert.strictEqual(pnl.revenue.netRevenue, '3000.00', 'Only completed sale contributes to revenue');
    assert.strictEqual(pnl.revenue.completedSalesCount, 1, 'Only 1 completed sale counted');
  });

  test('3. ANTI-DOUBLE-COUNTING: Customer payment collections do NOT create extra revenue', async () => {
    // Current revenue on DATE_2 is 3,000.00.
    // Record another payment against sale1:
    const sales = await prisma.sale.findMany({ where: { saleDate: DailyRateService.parseDate(DATE_2), status: SaleStatus.COMPLETED } });
    assert.ok(sales.length > 0);

    // Record an additional payment in Payment table
    await prisma.payment.create({
      data: {
        saleId: sales[0].id,
        amount: '1500.00',
        paymentMethod: PaymentMethod.UPI,
        paymentStatus: PaymentStatus.PAID,
        paymentDate: DailyRateService.parseDate(DATE_2),
        notes: 'Partial payment collection'
      }
    });

    const pnl = await pnlService.getDailyPnl(DATE_2);
    assert.strictEqual(
      pnl.revenue.netRevenue,
      '3000.00',
      'Payment collection must NOT be added to sales revenue (strictly prevents double counting)'
    );
  });

  test('4. COGS IMMUTABILITY: Historical sale COGS does NOT change when WAC changes', async () => {
    // In DATE_1, COGS was 12,000.00 (at WAC 200.00).
    // Now receive expensive stock (e.g. 50 kg at ₹400/kg) which increases WAC
    await purchaseBillService.createPurchaseBill({
      fishermanId,
      billDate: DATE_1,
      items: [
        {
          seafoodId: seafoodId1,
          gradeId: gradeAId,
          cratesCount: 1,
          grossKg: '50.00',
          tareKg: '0.00',
          quantityKg: '50.00',
          purchaseRate: '400.00'
        }
      ]
    });

    // Re-check historical DATE_1 P&L
    const pnl = await pnlService.getDailyPnl(DATE_1);
    // Historical sale was 60 kg at 200 = 12,000.00
    assert.strictEqual(
      pnl.cogs.totalCogs,
      '12000.00',
      'Historical COGS must remain permanently anchored to the cost snapshot captured at the time of sale'
    );
  });

  test('5. PURCHASES & SUPPLIER PAYMENTS EXCLUDED: Seafood procurement is NOT treated as OPEX', async () => {
    // A purchase of 50 kg at ₹400 was created above (grandTotal = ₹20,000).
    // Supplier payments against purchase bills are also recorded.
    const pnl = await pnlService.getDailyPnl(DATE_1);

    // Total expenses should still only be the 2,000.00 recorded earlier (Wages + Transport)
    assert.strictEqual(
      pnl.operatingExpenses.totalExpenses,
      '2000.00',
      'Purchases are inventory assets and must never be counted as operating expenses in P&L'
    );
  });

  test('6. ADVANCE & RECOVERY EXCLUDED: Fisherman advances and deductions do NOT hit P&L', async () => {
    // Disburse Advance
    const adv = await advanceService.disburseAdvance({
      fishermanId,
      sanctionDate: DATE_1,
      amount: '10000.00',
      paymentMethod: AdvancePaymentMethod.CASH,
      notes: `Advance for fuel ${testSuffix}`
    }, adminUser.id);

    // Record recovery repayment
    await advanceService.recordCashRepayment({
      fishermanId,
      amount: '2000.00',
      paymentMethod: AdvancePaymentMethod.CASH,
      paymentDate: DATE_1,
      notes: 'Partial recovery'
    }, adminUser.id);

    // Query P&L for DATE_1
    const pnl = await pnlService.getDailyPnl(DATE_1);

    // Revenue, COGS, Wastage, OPEX must remain completely unaffected by Advance disbursement and recovery
    assert.strictEqual(pnl.revenue.netRevenue, '18000.00');
    assert.strictEqual(pnl.cogs.totalCogs, '12000.00');
    assert.strictEqual(pnl.wastage.wastageCost, '1000.00');
    assert.strictEqual(pnl.operatingExpenses.totalExpenses, '2000.00');
    assert.strictEqual(pnl.operatingProfit.operatingProfit, '3000.00');
  });

  test('7. WASTAGE REVERSAL: Compensating return reduces recognized wastage cost', async () => {
    // On DATE_2, record 10 kg wastage of Seafood 2 (at purchase rate ₹400 = ₹4,000)
    // First put some stock of Seafood 2
    await purchaseBillService.createPurchaseBill({
      fishermanId,
      billDate: DATE_2,
      items: [
        {
          seafoodId: seafoodId2,
          gradeId: gradeBId,
          cratesCount: 1,
          grossKg: '50.00',
          tareKg: '0.00',
          quantityKg: '50.00',
          purchaseRate: '400.00'
        }
      ]
    });

    await stockService.recordWastage({
      seafoodId: seafoodId2,
      gradeId: gradeBId,
      quantityKg: '10.000',
      reason: 'Temperature variance',
      date: DATE_2
    });

    // Verify wastage cost before reversal: 10 kg * 400 = 4,000.00
    let pnl = await pnlService.getDailyPnl(DATE_2);
    assert.strictEqual(pnl.wastage.totalWastageKg, '10.000');
    assert.strictEqual(pnl.wastage.wastageCost, '4000.00');

    // Create compensating reversal of 4 kg wastage (₹1,600)
    const stockRow = await prisma.stock.findUnique({
      where: { seafoodId_gradeId: { seafoodId: seafoodId2, gradeId: gradeBId } }
    });
    assert.ok(stockRow);

    await prisma.stockMovement.create({
      data: {
        stockId: stockRow.id,
        seafoodId: seafoodId2,
        gradeId: gradeBId,
        movementType: StockMovementType.RETURN,
        quantityKg: new Prisma.Decimal('4.000'),
        balanceBefore: new Prisma.Decimal(stockRow.quantityKg),
        balanceAfter: new Prisma.Decimal(stockRow.quantityKg).add(4),
        unitCost: new Prisma.Decimal('400.00'),
        totalCost: new Prisma.Decimal('1600.00'),
        referenceType: 'WASTAGE',
        referenceId: null,
        movementDate: DailyRateService.parseDate(DATE_2),
        notes: 'Compensating reversal for wrongly classified wastage'
      }
    });

    pnl = await pnlService.getDailyPnl(DATE_2);
    // 10 - 4 = 6 kg, 4,000 - 1,600 = 2,400.00
    assert.strictEqual(pnl.wastage.totalWastageKg, '6.000', 'Net wastage kg should reflect reversal');
    assert.strictEqual(pnl.wastage.wastageCost, '2400.00', 'Net wastage cost should reflect reversal deduction');
  });

  test('8. OPEX BREAKDOWN & CANCELLATION: Recorded included, Cancelled excluded', async () => {
    // Record valid expense on DATE_2
    const exp1 = await expenseService.createExpense({
      expenseDate: DATE_2,
      category: 'ICE',
      amount: '800.00',
      paymentMethod: 'CASH',
      recipient: `Ice Factory ${testSuffix}`
    });

    // Record another expense and cancel it
    const exp2 = await expenseService.createExpense({
      expenseDate: DATE_2,
      category: 'ELECTRICITY',
      amount: '1200.00',
      paymentMethod: 'BANK_TRANSFER',
      recipient: `Power Grid ${testSuffix}`
    });

    await expenseService.cancelExpense(exp2.id, 'Incorrect duplicate invoice', adminUser.id);

    const pnl = await pnlService.getDailyPnl(DATE_2);

    assert.strictEqual(pnl.operatingExpenses.totalExpenses, '800.00', 'Cancelled expense must be excluded');
    assert.strictEqual(pnl.operatingExpenses.expensesCount, 1, 'Only 1 recorded expense counted');

    // Check expense breakdown
    const iceBreakdown = pnl.breakdowns?.byExpenseCategory?.find((e) => e.category === 'ICE');
    assert.ok(iceBreakdown);
    assert.strictEqual(iceBreakdown.amount, '800.00');
    assert.strictEqual(iceBreakdown.percentageOfOpex, '100.00');
  });

  test('9. DATE BOUNDARY & DATE RANGE AGGREGATION: Multi-day period aggregation with inclusive bounds', async () => {
    // In DATE_1: Net Revenue = 18,000, COGS = 12,000, Wastage = 1,000, OPEX = 2,000
    // In DATE_2: Net Revenue = 3,000, COGS = 2,000 (10 kg * 200), Wastage = 2,400, OPEX = 800
    // Period Total (DATE_1 to DATE_2):
    // Revenue = 18,000 + 3,000 = 21,000.00
    // COGS = 12,000 + 2,000 = 14,000.00
    // Gross Profit = 21,000 - 14,000 = 7,000.00
    // Wastage = 1,000 + 2,400 = 3,400.00
    // OPEX = 2,000 + 800 = 2,800.00
    // Operating Profit = 7,000 - 3,400 - 2,800 = 800.00

    const rangePnl = await pnlService.getDateRangePnl(DATE_1, DATE_2);

    assert.strictEqual(rangePnl.revenue.netRevenue, '21000.00', 'Combined Net Revenue');
    assert.strictEqual(rangePnl.cogs.totalCogs, '14000.00', 'Combined COGS');
    assert.strictEqual(rangePnl.grossProfit.grossProfit, '7000.00', 'Combined Gross Profit');
    assert.strictEqual(rangePnl.grossProfit.grossMarginPercent, '33.33', 'Combined Gross Margin');
    assert.strictEqual(rangePnl.wastage.wastageCost, '3400.00', 'Combined Wastage Cost');
    assert.strictEqual(rangePnl.operatingExpenses.totalExpenses, '2800.00', 'Combined OPEX');
    assert.strictEqual(rangePnl.operatingProfit.operatingProfit, '800.00', 'Combined Operating Profit');

    // Verify daily breakdown has both dates
    assert.ok(rangePnl.breakdowns?.daily);
    assert.strictEqual(rangePnl.breakdowns.daily.length, 2);
    assert.strictEqual(rangePnl.breakdowns.daily[0].date, DATE_1);
    assert.strictEqual(rangePnl.breakdowns.daily[1].date, DATE_2);
  });

  test('10. EXPORT SALES UNIFICATION: Wholesale and Export sales unified under same P&L engine', async () => {
    // Create an Export Sale on DATE_2
    const expSale = await saleService.createSale({
      customerId: undefined,
      saleDate: DATE_2,
      items: [
        {
          seafoodId: seafoodId2,
          gradeId: gradeBId,
          quantityKg: '10.000'
        }
      ]
    });

    // Update sale to export company
    await prisma.sale.update({
      where: { id: expSale.id },
      data: {
        exportCompanyId,
        saleType: SaleType.EXPORT
      }
    });

    const pnl = await pnlService.getDailyPnl(DATE_2);
    // Export company breakdown exists
    const expBreakdown = pnl.breakdowns?.byExportCompany?.find((e) => e.exportCompanyId === exportCompanyId);
    assert.ok(expBreakdown, 'Export company breakdown should be present');
    assert.strictEqual(expBreakdown.companyName, `GlobalSeafood_PnL_${testSuffix}`);
    assert.strictEqual(expBreakdown.totalKg, '10.000');
  });

  test('11. ZERO DIVISION SAFETY: Day with zero revenue returns 0.00% margin safely', async () => {
    // DATE_OUTSIDE has rates but no sales, recorded only an expense
    await expenseService.createExpense({
      expenseDate: DATE_OUTSIDE,
      category: 'MAINTENANCE',
      amount: '500.00',
      paymentMethod: 'CASH',
      recipient: `Mechanic ${testSuffix}`
    });

    const pnl = await pnlService.getDailyPnl(DATE_OUTSIDE);

    assert.strictEqual(pnl.revenue.netRevenue, '0.00');
    assert.strictEqual(pnl.grossProfit.grossProfit, '0.00');
    assert.strictEqual(pnl.grossProfit.grossMarginPercent, '0.00', 'Gross margin should safely be 0.00% without divide-by-zero error');
    assert.strictEqual(pnl.operatingProfit.operatingProfit, '-500.00');
    assert.strictEqual(pnl.operatingProfit.operatingMarginPercent, '0.00', 'Operating margin should safely be 0.00% without divide-by-zero error');
  });

  test('12. DAY-END INTEGRATION: Open preview vs Closed day consistency', async () => {
    // DATE_1 is currently open
    let pnl = await pnlService.getDailyPnl(DATE_1);
    assert.strictEqual(pnl.dayEndStatus?.isClosed, false);
    assert.strictEqual(pnl.dayEndStatus?.closingStatus, 'OPEN');

    // Close DATE_1
    await dayEndService.closeDay(DATE_1, {
      openingCash: '1000.00',
      actualPhysicalCash: '19000.00',
      actualPhysicalStockKg: '35.000',
      varianceReason: 'Variance due to test initial balances'
    }, adminUser.id);

    // Re-check P&L for DATE_1
    pnl = await pnlService.getDailyPnl(DATE_1);
    assert.strictEqual(pnl.dayEndStatus?.isClosed, true);
    assert.strictEqual(pnl.dayEndStatus?.closingStatus, 'CLOSED');
    // Financial figures remain fully consistent with immutable day-end state
    assert.strictEqual(pnl.revenue.netRevenue, '18000.00');
    assert.strictEqual(pnl.operatingProfit.operatingProfit, '3000.00');
  });

  test('13. HTTP API & RBAC ENFORCEMENT: Unauthenticated 401, Worker 403, Admin 200', async () => {
    // A. Unauthenticated Request -> 401
    const unauthRes = await fetch(`${BASE_URL}/api/pnl/daily?date=${DATE_1}`);
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated access must return 401');

    // B. Worker Role Request -> 403 Forbidden
    const workerRes = await fetch(`${BASE_URL}/api/pnl/daily?date=${DATE_1}`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    assert.strictEqual(workerRes.status, 403, 'Worker role must be denied with 403 Forbidden');

    // C. Admin Role Request -> 200 OK
    const adminRes = await fetch(`${BASE_URL}/api/pnl/daily?date=${DATE_1}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminRes.status, 200, 'Admin role must receive 200 OK');
    const adminJson = (await adminRes.json()) as any;
    assert.strictEqual(adminJson.success, true);
    assert.strictEqual(adminJson.data.revenue.netRevenue, '18000.00');

    // D. Range API
    const rangeRes = await fetch(`${BASE_URL}/api/pnl/range?startDate=${DATE_1}&endDate=${DATE_2}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(rangeRes.status, 200);
    const rangeJson = (await rangeRes.json()) as any;
    assert.strictEqual(rangeJson.data.period.isSingleDay, false);

    // E. Summary API
    const summaryRes = await fetch(`${BASE_URL}/api/pnl/summary?startDate=${DATE_1}&endDate=${DATE_2}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(summaryRes.status, 200);
    const summaryJson = (await summaryRes.json()) as any;
    assert.ok(summaryJson.data.revenue);
    assert.strictEqual(summaryJson.data.breakdowns, undefined, 'Summary endpoint should not return verbose breakdowns');

    // F. Breakdown API
    const breakdownRes = await fetch(`${BASE_URL}/api/pnl/breakdown?startDate=${DATE_1}&endDate=${DATE_2}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(breakdownRes.status, 200);
    const breakdownJson = (await breakdownRes.json()) as any;
    assert.ok(breakdownJson.data.bySeafood);
    assert.ok(breakdownJson.data.byCategory);
    assert.ok(breakdownJson.data.byGrade);
    assert.ok(breakdownJson.data.byExpenseCategory);

    // G. Invalid Date Range validation -> 422 / 400
    const invalidRangeRes = await fetch(`${BASE_URL}/api/pnl/range?startDate=${DATE_2}&endDate=${DATE_1}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(invalidRangeRes.status, 422, 'Reversed date range must return validation error 422');
  });
});
