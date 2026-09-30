import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { SaleService } from '../src/services/sale.service';
import { StockService } from '../src/services/stock.service';
import { DailyRateService } from '../src/services/dailyRate.service';
import { SeafoodService } from '../src/services/seafood.service';
import { SeafoodCategoryService } from '../src/services/seafoodCategory.service';
import { SeafoodGradeService } from '../src/services/seafoodGrade.service';
import { CustomerService } from '../src/services/customer.service';
import { AppError } from '../src/utils/appError';
import { Prisma, PaymentMethod, PaymentStatus, SaleStatus } from '@prisma/client';

describe('Phase 6 Sales POS, Customer Billing & Stock Deduction Tests', () => {
  const saleService = new SaleService();
  const stockService = new StockService();
  const dailyRateService = new DailyRateService();
  const seafoodService = new SeafoodService();
  const categoryService = new SeafoodCategoryService();
  const gradeService = new SeafoodGradeService();
  const customerService = new CustomerService();

  const testSuffix = Date.now().toString().slice(-6);

  let categoryId: string;
  let gradeAId: string;
  let gradeBId: string;
  let seafoodSquidId: string;
  let seafoodCrabId: string;
  let seafoodPrawnId: string;
  let seafoodInactiveId: string;

  let customerRayanId: string;
  let customerInactiveId: string;

  const SALE_DATE = '2026-09-30';
  const TOMORROW_DATE = '2026-10-01';

  before(async () => {
    // 1. Create Category
    const cat = await categoryService.createCategory({
      name: `Cephalopods_POS_${testSuffix}`,
      description: 'Squid, crab, and prawns for POS sales tests'
    });
    categoryId = cat.id;

    // 2. Fetch or create Grades
    const grades = await gradeService.getGrades();
    const gradeA = grades.find((g) => g.name === 'Grade A') || (await gradeService.createGrade({ name: `Grade_A_POS_${testSuffix}` }));
    const gradeB = grades.find((g) => g.name === 'Grade B') || (await gradeService.createGrade({ name: `Grade_B_POS_${testSuffix}` }));
    gradeAId = gradeA.id;
    gradeBId = gradeB.id;

    // 3. Create Seafood
    const squid = await seafoodService.createSeafood({
      name: `Squid_POS_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodSquidId = squid.id;

    const crab = await seafoodService.createSeafood({
      name: `Crab_POS_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodCrabId = crab.id;

    const prawn = await seafoodService.createSeafood({
      name: `Prawn_POS_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodPrawnId = prawn.id;

    const inactiveSeafood = await seafoodService.createSeafood({
      name: `InactiveSeafood_POS_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    await prisma.seafood.update({
      where: { id: inactiveSeafood.id },
      data: { status: 'INACTIVE' }
    });
    seafoodInactiveId = inactiveSeafood.id;

    // 4. Create Customers
    const rayan = await customerService.createCustomer({
      name: `Rayan K ${testSuffix}`,
      countryCode: '+91',
      mobileNumber: `9840${testSuffix.slice(0, 6)}`,
      email: `rayan_${testSuffix}@example.com`,
      address: 'Harbor Wharf Retail'
    });
    customerRayanId = rayan.id;

    const inactiveCustomer = await customerService.createCustomer({
      name: `Inactive Customer ${testSuffix}`,
      countryCode: '+91',
      mobileNumber: `9849${testSuffix.slice(0, 6)}`
    });
    await prisma.customer.update({
      where: { id: inactiveCustomer.id },
      data: { status: 'INACTIVE' }
    });
    customerInactiveId = inactiveCustomer.id;

    // 5. Seed Published Daily Rates for SALE_DATE
    const rSquid = await dailyRateService.createDailyRate({
      rateDate: SALE_DATE,
      seafoodId: seafoodSquidId,
      gradeId: gradeAId,
      purchaseRate: '400.00',
      sellingRate: '470.00'
    });
    await dailyRateService.publishRate(rSquid.id);

    const rCrab = await dailyRateService.createDailyRate({
      rateDate: SALE_DATE,
      seafoodId: seafoodCrabId,
      gradeId: gradeAId,
      purchaseRate: '600.00',
      sellingRate: '700.00'
    });
    await dailyRateService.publishRate(rCrab.id);

    const rPrawn = await dailyRateService.createDailyRate({
      rateDate: SALE_DATE,
      seafoodId: seafoodPrawnId,
      gradeId: gradeBId,
      purchaseRate: '380.00',
      sellingRate: '450.00'
    });
    await dailyRateService.publishRate(rPrawn.id);

    // 6. Seed Initial Stock
    // Squid A: 100.000 KG
    await prisma.stock.upsert({
      where: { seafoodId_gradeId: { seafoodId: seafoodSquidId, gradeId: gradeAId } },
      create: { seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: new Prisma.Decimal('100.000') },
      update: { quantityKg: new Prisma.Decimal('100.000') }
    });

    // Crab A: 50.000 KG
    await prisma.stock.upsert({
      where: { seafoodId_gradeId: { seafoodId: seafoodCrabId, gradeId: gradeAId } },
      create: { seafoodId: seafoodCrabId, gradeId: gradeAId, quantityKg: new Prisma.Decimal('50.000') },
      update: { quantityKg: new Prisma.Decimal('50.000') }
    });

    // Prawn B: 30.000 KG
    await prisma.stock.upsert({
      where: { seafoodId_gradeId: { seafoodId: seafoodPrawnId, gradeId: gradeBId } },
      create: { seafoodId: seafoodPrawnId, gradeId: gradeBId, quantityKg: new Prisma.Decimal('30.000') },
      update: { quantityKg: new Prisma.Decimal('30.000') }
    });
  });

  after(async () => {
    // Teardown test data
    await prisma.stockMovement.deleteMany({
      where: { seafoodId: { in: [seafoodSquidId, seafoodCrabId, seafoodPrawnId, seafoodInactiveId] } }
    });
    await prisma.stock.deleteMany({
      where: { seafoodId: { in: [seafoodSquidId, seafoodCrabId, seafoodPrawnId, seafoodInactiveId] } }
    });
    await prisma.payment.deleteMany({
      where: {
        OR: [
          { sale: { customerId: { in: [customerRayanId, customerInactiveId] } } },
          { purchaseBill: { fishermanId: { in: [] } } }
        ]
      }
    });
    await prisma.saleItem.deleteMany({
      where: { seafoodId: { in: [seafoodSquidId, seafoodCrabId, seafoodPrawnId, seafoodInactiveId] } }
    });
    await prisma.sale.deleteMany({
      where: { customerId: { in: [customerRayanId, customerInactiveId] } }
    });
    await prisma.dailyRate.deleteMany({
      where: { seafoodId: { in: [seafoodSquidId, seafoodCrabId, seafoodPrawnId, seafoodInactiveId] } }
    });
    await prisma.customer.deleteMany({
      where: { id: { in: [customerRayanId, customerInactiveId] } }
    });
    await prisma.seafood.deleteMany({
      where: { id: { in: [seafoodSquidId, seafoodCrabId, seafoodPrawnId, seafoodInactiveId] } }
    });
    await prisma.seafoodCategory.deleteMany({
      where: { id: categoryId }
    });
  });

  // ==========================================
  // Critical End-to-End Test (Exact Scenario)
  // ==========================================
  test('CRITICAL END-TO-END TEST: Squid 2.750 KG @ ₹470 + Crab 1.500 KG @ ₹700, ₹100 discount, ₹2500 cash received', async () => {
    const sale = await saleService.createSale({
      customerId: customerRayanId,
      saleDate: SALE_DATE,
      items: [
        { seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '2.750' },
        { seafoodId: seafoodCrabId, gradeId: gradeAId, quantityKg: '1.500' }
      ],
      discount: '100.00',
      payment: {
        method: PaymentMethod.CASH,
        amount: '2500.00'
      }
    });

    // Verification
    assert.strictEqual(sale.items.length, 2);
    assert.strictEqual(sale.items[0].quantityKg, '2.750');
    assert.strictEqual(sale.items[0].sellingRate, '470.00');
    assert.strictEqual(sale.items[0].amount, '1292.50');

    assert.strictEqual(sale.items[1].quantityKg, '1.500');
    assert.strictEqual(sale.items[1].sellingRate, '700.00');
    assert.strictEqual(sale.items[1].amount, '1050.00');

    assert.strictEqual(sale.totalKg, '4.250');
    assert.strictEqual(sale.subtotal, '2342.50');
    assert.strictEqual(sale.discount, '100.00');
    assert.strictEqual(sale.grandTotal, '2242.50');
    assert.strictEqual(sale.paidAmount, '2242.50');
    assert.strictEqual(sale.changeAmount, '257.50');
    assert.strictEqual(sale.paymentStatus, PaymentStatus.PAID);
    assert.strictEqual(sale.status, SaleStatus.COMPLETED);

    // Verify stock deductions:
    // Squid stock: 100 - 2.750 = 97.250 KG
    const squidStock = await stockService.getStockBySeafoodAndGrade(seafoodSquidId, gradeAId);
    assert.strictEqual(squidStock.quantityKg, '97.25');

    // Crab stock: 50 - 1.500 = 48.500 KG
    const crabStock = await stockService.getStockBySeafoodAndGrade(seafoodCrabId, gradeAId);
    assert.strictEqual(crabStock.quantityKg, '48.50');

    // Verify 2 Stock Movements created with type SALE and negative quantities
    const movements = await prisma.stockMovement.findMany({
      where: { referenceType: 'SALE', referenceId: sale.id },
      orderBy: { createdAt: 'asc' }
    });
    assert.strictEqual(movements.length, 2);
    assert.strictEqual(movements[0].movementType, 'SALE');
    assert.strictEqual(new Prisma.Decimal(movements[0].quantityKg).toFixed(3), '-2.750');
    assert.strictEqual(new Prisma.Decimal(movements[0].balanceBefore).toFixed(3), '100.000');
    assert.strictEqual(new Prisma.Decimal(movements[0].balanceAfter).toFixed(3), '97.250');

    assert.strictEqual(movements[1].movementType, 'SALE');
    assert.strictEqual(new Prisma.Decimal(movements[1].quantityKg).toFixed(3), '-1.500');
    assert.strictEqual(new Prisma.Decimal(movements[1].balanceBefore).toFixed(3), '50.000');
    assert.strictEqual(new Prisma.Decimal(movements[1].balanceAfter).toFixed(3), '48.500');
  });

  // ==========================================
  // Rate Snapshot Test
  // ==========================================
  test('RATE SNAPSHOT TEST: Changing DailyRate tomorrow does not alter historical sale snapshot', async () => {
    // 1. Create a sale today for 2.000 KG Squid A at 470.00
    const initialSale = await saleService.createSale({
      customerId: customerRayanId,
      saleDate: SALE_DATE,
      items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '2.000' }],
      payment: { method: PaymentMethod.CASH }
    });
    assert.strictEqual(initialSale.items[0].sellingRate, '470.00');
    assert.strictEqual(initialSale.items[0].amount, '940.00');

    // 2. Publish new DailyRate for TOMORROW with rate 490.00
    const rTomorrow = await dailyRateService.createDailyRate({
      rateDate: TOMORROW_DATE,
      seafoodId: seafoodSquidId,
      gradeId: gradeAId,
      purchaseRate: '420.00',
      sellingRate: '490.00'
    });
    await dailyRateService.publishRate(rTomorrow.id);

    // 3. Re-fetch the historical sale - must still be 470.00
    const reFetchedSale = await saleService.getSaleById(initialSale.id);
    assert.strictEqual(reFetchedSale.items[0].sellingRate, '470.00');
    assert.strictEqual(reFetchedSale.items[0].amount, '940.00');
  });

  // ==========================================
  // Stock Rollback & Insufficient Stock Test
  // ==========================================
  test('STOCK ROLLBACK TEST: Attempting sale exceeding available stock rejects and rolls back completely', async () => {
    // Current stock of Prawn B is 30.000 KG
    const initialPrawnStock = await stockService.getStockBySeafoodAndGrade(seafoodPrawnId, gradeBId);
    const initialSalesCount = await prisma.sale.count();
    const initialMovementsCount = await prisma.stockMovement.count();

    // Customer requests 35.000 KG (> 30.000 KG)
    await assert.rejects(
      async () => {
        await saleService.createSale({
          customerId: customerRayanId,
          saleDate: SALE_DATE,
          items: [{ seafoodId: seafoodPrawnId, gradeId: gradeBId, quantityKg: '35.000' }],
          payment: { method: PaymentMethod.CASH }
        });
      },
      (err: any) => {
        assert(err instanceof AppError);
        assert.strictEqual(err.code, 'INSUFFICIENT_STOCK');
        assert(err.details);
        assert.strictEqual((err.details as any).requestedKg, '35.000');
        return true;
      }
    );

    // Verify complete rollback: No new sale, no movements, stock unchanged
    const afterStock = await stockService.getStockBySeafoodAndGrade(seafoodPrawnId, gradeBId);
    assert.strictEqual(afterStock.quantityKg, initialPrawnStock.quantityKg);

    const afterSalesCount = await prisma.sale.count();
    assert.strictEqual(afterSalesCount, initialSalesCount);

    const afterMovementsCount = await prisma.stockMovement.count();
    assert.strictEqual(afterMovementsCount, initialMovementsCount);
  });

  // ==========================================
  // Concurrency & Overselling Test
  // ==========================================
  test('CONCURRENT STOCK TEST: Two simultaneous POS sales cannot oversell available stock', async () => {
    // Seed exactly 10.000 KG for a new grade/lot test
    const concSquidStock = await prisma.stock.findUnique({
      where: { seafoodId_gradeId: { seafoodId: seafoodSquidId, gradeId: gradeAId } }
    });
    // Set stock to 10.000 KG
    await prisma.stock.update({
      where: { id: concSquidStock!.id },
      data: { quantityKg: new Prisma.Decimal('10.000') }
    });

    // Launch two concurrent sales each requesting 7.000 KG (Total 14 KG > 10 KG)
    const salePromise1 = saleService.createSale({
      customerId: customerRayanId,
      saleDate: SALE_DATE,
      items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '7.000' }],
      payment: { method: PaymentMethod.CASH }
    });

    const salePromise2 = saleService.createSale({
      customerId: customerRayanId,
      saleDate: SALE_DATE,
      items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '7.000' }],
      payment: { method: PaymentMethod.CASH }
    });

    const results = await Promise.allSettled([salePromise1, salePromise2]);

    // Exactly one must succeed and one must fail with INSUFFICIENT_STOCK
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    assert.strictEqual(fulfilled.length, 1, 'Only one sale should succeed');
    assert.strictEqual(rejected.length, 1, 'The competing sale must be rejected');

    const rejectionReason: any = (rejected[0] as PromiseRejectedResult).reason;
    assert.strictEqual(rejectionReason.code, 'INSUFFICIENT_STOCK');

    // Final stock must be 3.000 KG, NEVER negative
    const finalStock = await prisma.stock.findUnique({
      where: { id: concSquidStock!.id }
    });
    assert.strictEqual(new Prisma.Decimal(finalStock!.quantityKg).toFixed(3), '3.000');
  });

  // ==========================================
  // Duplicate Submission & Idempotency
  // ==========================================
  test('IDEMPOTENCY TEST: Same idempotency key returns existing sale and does not duplicate', async () => {
    const key = `idem_${testSuffix}_1`;

    const sale1 = await saleService.createSale({
      customerId: customerRayanId,
      saleDate: SALE_DATE,
      items: [{ seafoodId: seafoodPrawnId, gradeId: gradeBId, quantityKg: '1.000' }],
      payment: { method: PaymentMethod.CASH },
      idempotencyKey: key
    });

    const sale2 = await saleService.createSale({
      customerId: customerRayanId,
      saleDate: SALE_DATE,
      items: [{ seafoodId: seafoodPrawnId, gradeId: gradeBId, quantityKg: '1.000' }],
      payment: { method: PaymentMethod.CASH },
      idempotencyKey: key
    });

    assert.strictEqual(sale1.id, sale2.id);
    assert.strictEqual(sale1.invoiceNumber, sale2.invoiceNumber);
  });

  // ==========================================
  // Walk-in Customer Cash vs Credit
  // ==========================================
  test('WALK-IN TEST: Walk-in customer allows Cash payment', async () => {
    const sale = await saleService.createSale({
      customerId: 'walk-in',
      saleDate: SALE_DATE,
      items: [{ seafoodId: seafoodPrawnId, gradeId: gradeBId, quantityKg: '1.000' }],
      payment: { method: PaymentMethod.CASH }
    });
    assert.strictEqual(sale.customer.name, 'Walk-in Counter Customer');
    assert.strictEqual(sale.paymentStatus, PaymentStatus.PAID);
  });

  test('WALK-IN TEST: Walk-in customer rejects CREDIT payment', async () => {
    await assert.rejects(
      async () => {
        await saleService.createSale({
          customerId: 'walk-in',
          saleDate: SALE_DATE,
          items: [{ seafoodId: seafoodPrawnId, gradeId: gradeBId, quantityKg: '1.000' }],
          payment: { method: PaymentMethod.CREDIT }
        });
      },
      (err: any) => {
        assert(err instanceof AppError);
        assert.strictEqual(err.code, 'WALK_IN_CREDIT_NOT_ALLOWED');
        return true;
      }
    );
  });

  // ==========================================
  // Validation Rules
  // ==========================================
  test('VALIDATION: Rejects sale when seafood is inactive', async () => {
    await assert.rejects(
      async () => {
        await saleService.createSale({
          customerId: customerRayanId,
          saleDate: SALE_DATE,
          items: [{ seafoodId: seafoodInactiveId, gradeId: gradeAId, quantityKg: '1.000' }]
        });
      },
      (err: any) => {
        assert.strictEqual(err.code, 'SEAFOOD_INACTIVE');
        return true;
      }
    );
  });

  test('VALIDATION: Rejects sale when customer is inactive', async () => {
    await assert.rejects(
      async () => {
        await saleService.createSale({
          customerId: customerInactiveId,
          saleDate: SALE_DATE,
          items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '1.000' }]
        });
      },
      (err: any) => {
        assert.strictEqual(err.code, 'CUSTOMER_INACTIVE');
        return true;
      }
    );
  });

  test('VALIDATION: Rejects sale when rate is not published for that date', async () => {
    await assert.rejects(
      async () => {
        await saleService.createSale({
          customerId: customerRayanId,
          saleDate: '2025-01-01', // Past date with no rates
          items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '1.000' }]
        });
      },
      (err: any) => {
        assert.strictEqual(err.code, 'RATE_NOT_PUBLISHED');
        return true;
      }
    );
  });

  test('VALIDATION: Rejects discount greater than subtotal', async () => {
    await assert.rejects(
      async () => {
        await saleService.createSale({
          customerId: customerRayanId,
          saleDate: SALE_DATE,
          items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '1.000' }], // subtotal = 470.00
          discount: '500.00'
        });
      },
      (err: any) => {
        assert.strictEqual(err.code, 'INVALID_DISCOUNT');
        return true;
      }
    );
  });

  test('PAYMENT: UPI and Bank Transfer support partial and full settlement', async () => {
    // Full UPI
    const upiSale = await saleService.createSale({
      customerId: customerRayanId,
      saleDate: SALE_DATE,
      items: [{ seafoodId: seafoodPrawnId, gradeId: gradeBId, quantityKg: '1.000' }], // 450.00
      payment: {
        method: PaymentMethod.UPI,
        amount: '450.00',
        referenceNumber: 'UPI-REF-9988'
      }
    });
    assert.strictEqual(upiSale.paymentStatus, PaymentStatus.PAID);
    assert.strictEqual(upiSale.payments[0].referenceNumber, 'UPI-REF-9988');

    // Partial Bank Transfer
    const bankSale = await saleService.createSale({
      customerId: customerRayanId,
      saleDate: SALE_DATE,
      items: [{ seafoodId: seafoodPrawnId, gradeId: gradeBId, quantityKg: '1.000' }], // 450.00
      payment: {
        method: PaymentMethod.BANK_TRANSFER,
        amount: '200.00',
        referenceNumber: 'NEFT-8877'
      }
    });
    assert.strictEqual(bankSale.paymentStatus, PaymentStatus.PARTIALLY_PAID);
    assert.strictEqual(bankSale.paidAmount, '200.00');
  });

  test('SALE CANCELLATION: Cancelling sale reverses stock with compensating movement', async () => {
    // 1. Check stock before
    const prawnStock = await prisma.stock.findUnique({
      where: { seafoodId_gradeId: { seafoodId: seafoodPrawnId, gradeId: gradeBId } }
    });
    const stockBefore = new Prisma.Decimal(prawnStock!.quantityKg);

    // 2. Make a 2.000 KG sale
    const sale = await saleService.createSale({
      customerId: customerRayanId,
      saleDate: SALE_DATE,
      items: [{ seafoodId: seafoodPrawnId, gradeId: gradeBId, quantityKg: '2.000' }],
      payment: { method: PaymentMethod.CASH }
    });

    const stockAfterSale = await prisma.stock.findUnique({
      where: { seafoodId_gradeId: { seafoodId: seafoodPrawnId, gradeId: gradeBId } }
    });
    assert.strictEqual(new Prisma.Decimal(stockAfterSale!.quantityKg).toFixed(3), stockBefore.sub(2).toFixed(3));

    // 3. Cancel the sale
    const cancelled = await saleService.cancelSale(sale.id);
    assert.strictEqual(cancelled.status, SaleStatus.CANCELLED);
    assert.strictEqual(cancelled.paymentStatus, PaymentStatus.CANCELLED);

    // 4. Verify stock is restored
    const stockAfterCancel = await prisma.stock.findUnique({
      where: { seafoodId_gradeId: { seafoodId: seafoodPrawnId, gradeId: gradeBId } }
    });
    assert.strictEqual(new Prisma.Decimal(stockAfterCancel!.quantityKg).toFixed(3), stockBefore.toFixed(3));
  });

  test('LIST & SEARCH: Filter by invoice number, customer search, and date range', async () => {
    const list = await saleService.getSalesList({
      page: 1,
      limit: 10,
      customerId: customerRayanId
    });
    assert(list.items.length > 0);
    assert(list.total > 0);

    const firstInvoice = list.items[0].invoiceNumber;
    const searchResult = await saleService.getSalesList({
      page: 1,
      limit: 10,
      search: firstInvoice
    });
    assert.strictEqual(searchResult.items.length, 1);
    assert.strictEqual(searchResult.items[0].invoiceNumber, firstInvoice);
  });
});