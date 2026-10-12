import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { PurchaseBillService } from '../src/services/purchaseBill.service';
import { SaleService } from '../src/services/sale.service';
import { StockService } from '../src/services/stock.service';
import { DailyRateService } from '../src/services/dailyRate.service';
import { SeafoodService } from '../src/services/seafood.service';
import { SeafoodCategoryService } from '../src/services/seafoodCategory.service';
import { SeafoodGradeService } from '../src/services/seafoodGrade.service';
import { FishermanService } from '../src/services/fisherman.service';
import { CustomerService } from '../src/services/customer.service';
import { AppError } from '../src/utils/appError';
import { PaymentMethod, PaymentStatus, SaleStatus, SaleType } from '@prisma/client';

describe('Phase 2 WAC & COGS Valuation Engine Tests', () => {
  const purchaseBillService = new PurchaseBillService();
  const saleService = new SaleService();
  const stockService = new StockService();
  const dailyRateService = new DailyRateService();
  const seafoodService = new SeafoodService();
  const categoryService = new SeafoodCategoryService();
  const gradeService = new SeafoodGradeService();
  const fishermanService = new FishermanService();
  const customerService = new CustomerService();

  const testSuffix = Date.now().toString().slice(-6);
  const TEST_DATE = '2026-10-01';

  let categoryId: string;
  let gradeId: string;
  let fishermanId: string;
  let customerId: string;

  // Track created entities for clean teardown
  const createdSeafoodIds: string[] = [];
  const createdBillIds: string[] = [];
  const createdSaleIds: string[] = [];

  before(async () => {
    // 1. Setup Category
    const cat = await categoryService.createCategory({
      name: `WAC_Cat_${testSuffix}`,
      description: 'WAC Valuation Test Category'
    });
    categoryId = cat.id;

    // 2. Setup Grade
    const grade = await gradeService.createGrade({
      name: `Grade_WAC_${testSuffix}`,
      description: 'WAC Grade'
    });
    gradeId = grade.id;

    // 3. Setup Fisherman
    const fisherman = await fishermanService.createFisherman({
      name: `WAC Fisherman ${testSuffix}`,
      mobileNumber: `9876${testSuffix}`
    });
    fishermanId = fisherman.id;

    // 4. Setup Customer
    const customer = await customerService.createCustomer({
      name: `WAC Customer ${testSuffix}`,
      mobileNumber: `9123${testSuffix}`
    });
    customerId = customer.id;
  });

  after(async () => {
    // Teardown created records safely
    try {
      if (createdSaleIds.length > 0) {
        await prisma.payment.deleteMany({ where: { saleId: { in: createdSaleIds } } });
        await prisma.saleItem.deleteMany({ where: { saleId: { in: createdSaleIds } } });
        await prisma.sale.deleteMany({ where: { id: { in: createdSaleIds } } });
      }
      if (fishermanId) {
        await prisma.payment.deleteMany({ where: { purchaseBill: { fishermanId } } });
        await prisma.purchaseBillItem.deleteMany({ where: { purchaseBill: { fishermanId } } });
        await prisma.purchaseBill.deleteMany({ where: { fishermanId } });
      }
      if (createdBillIds.length > 0) {
        await prisma.payment.deleteMany({ where: { purchaseBillId: { in: createdBillIds } } });
        await prisma.purchaseBillItem.deleteMany({ where: { purchaseBillId: { in: createdBillIds } } });
        await prisma.purchaseBill.deleteMany({ where: { id: { in: createdBillIds } } });
      }
      if (createdSeafoodIds.length > 0) {
        await prisma.payment.deleteMany({
          where: {
            OR: [
              { sale: { items: { some: { seafoodId: { in: createdSeafoodIds } } } } },
              { purchaseBill: { items: { some: { seafoodId: { in: createdSeafoodIds } } } } }
            ]
          }
        });
        await prisma.saleItem.deleteMany({ where: { seafoodId: { in: createdSeafoodIds } } });
        await prisma.purchaseBillItem.deleteMany({ where: { seafoodId: { in: createdSeafoodIds } } });
        await prisma.stockMovement.deleteMany({ where: { seafoodId: { in: createdSeafoodIds } } });
        await prisma.stock.deleteMany({ where: { seafoodId: { in: createdSeafoodIds } } });
        await prisma.dailyRate.deleteMany({ where: { seafoodId: { in: createdSeafoodIds } } });
        await prisma.seafood.deleteMany({ where: { id: { in: createdSeafoodIds } } });
      }
      if (customerId) await prisma.customer.delete({ where: { id: customerId } }).catch(() => {});
      if (fishermanId) await prisma.fisherman.delete({ where: { id: fishermanId } }).catch(() => {});
      if (gradeId) await prisma.seafoodGrade.delete({ where: { id: gradeId } }).catch(() => {});
      if (categoryId) await prisma.seafoodCategory.delete({ where: { id: categoryId } }).catch(() => {});
    } catch (err) {
      console.error('Error during WAC test teardown:', err);
    }
  });

  // Helper to query stock and return numerical metrics
  async function getStock(sId: string, gId: string) {
    const res = await stockService.getStockBySeafoodAndGrade(sId, gId);
    return {
      quantityKg: res.quantityKg,
      averageCost: res.stock ? res.stock.averageCost : '0.00',
      totalValue: res.stock ? res.stock.totalValue : '0.00'
    };
  }

  // Helper to create seafood with published rate
  async function setupSpecies(namePrefix: string, purchaseRate: number, sellingRate: number) {
    const seafood = await seafoodService.createSeafood({
      name: `${namePrefix}_${testSuffix}_${Date.now().toString().slice(-4)}`,
      categoryId,
      unit: 'KG'
    });
    createdSeafoodIds.push(seafood.id);

    // Create & publish daily rate
    const draft = await dailyRateService.createDailyRate({
      rateDate: TEST_DATE,
      seafoodId: seafood.id,
      gradeId,
      purchaseRate: purchaseRate.toString(),
      sellingRate: sellingRate.toString()
    });
    await dailyRateService.publishRate(draft.id);

    return seafood;
  }

  // =========================================================================
  // TEST 1: Exact Numerical Verification Required by Contract
  // 0 KG -> Intake 100 KG @ ₹380 -> Intake 100 KG @ ₹420 -> WAC = ₹400 -> Sale 25 KG @ ₹460
  // =========================================================================
  test('1. Exact Numerical Contract: Inflows blend WAC, Outflow snapshots COGS accurately', async () => {
    const seafood = await setupSpecies('Pomfret_Num', 380, 460);

    // Initial check: Stock is 0 KG
    const initialStock = await getStock(seafood.id, gradeId);
    assert.strictEqual(Number(initialStock.quantityKg), 0);
    assert.strictEqual(Number(initialStock.averageCost), 0);
    assert.strictEqual(Number(initialStock.totalValue), 0);

    // Purchase 1: 100 KG @ ₹380
    const bill1 = await purchaseBillService.createPurchaseBill({
      billDate: TEST_DATE,
      fishermanId,
      items: [
        {
          seafoodId: seafood.id,
          gradeId,
          cratesCount: 2,
          grossKg: 105,
          tareKg: 5,
          quantityKg: 100,
          purchaseRate: 380
        }
      ],
      payments: [{ amount: 38000, paymentMethod: PaymentMethod.CASH }]
    });
    createdBillIds.push(bill1.id);

    const stockAfterP1 = await getStock(seafood.id, gradeId);
    assert.strictEqual(Number(stockAfterP1.quantityKg), 100);
    assert.strictEqual(Number(stockAfterP1.averageCost), 380);
    assert.strictEqual(Number(stockAfterP1.totalValue), 38000);

    // Purchase 2: 100 KG @ ₹420
    const bill2 = await purchaseBillService.createPurchaseBill({
      billDate: TEST_DATE,
      fishermanId,
      items: [
        {
          seafoodId: seafood.id,
          gradeId,
          cratesCount: 2,
          grossKg: 105,
          tareKg: 5,
          quantityKg: 100,
          purchaseRate: 420
        }
      ],
      payments: [{ amount: 42000, paymentMethod: PaymentMethod.CASH }]
    });
    createdBillIds.push(bill2.id);

    // Verification: Quantity = 200 KG, WAC = ₹400, Total Value = ₹80,000
    const stockAfterP2 = await getStock(seafood.id, gradeId);
    assert.strictEqual(Number(stockAfterP2.quantityKg), 200);
    assert.strictEqual(Number(stockAfterP2.averageCost), 400);
    assert.strictEqual(Number(stockAfterP2.totalValue), 80000);

    // Sale: 25 KG @ ₹460
    const sale = await saleService.createSale({
      saleDate: TEST_DATE,
      customerId,
      saleType: SaleType.WHOLESALE,
      items: [
        {
          seafoodId: seafood.id,
          gradeId,
          quantityKg: 25,
          sellingRate: 460
        }
      ],
      payments: [{ amount: 11500, paymentMethod: PaymentMethod.CASH }]
    });
    createdSaleIds.push(sale.id);

    // Verify Sale Item COGS Snapshot
    const saleItem = sale.items[0];
    assert.strictEqual(Number(saleItem.quantityKg), 25);
    assert.strictEqual(Number(saleItem.sellingRate), 460);
    assert.strictEqual(Number(saleItem.amount), 11500);
    assert.strictEqual(Number(saleItem.costRate), 400, 'costRate must be snapshotted from WAC');
    assert.strictEqual(Number(saleItem.cogsAmount), 10000, 'COGS = 25 * 400 = 10,000');
    assert.strictEqual(Number(saleItem.grossProfit), 1500, 'Gross Profit = 11,500 - 10,000 = 1,500');

    // Verify Sale Header COGS & Gross Profit
    assert.strictEqual(Number(sale.totalCogs), 10000);
    assert.strictEqual(Number(sale.totalGrossProfit), 1500);

    // Verify Stock after Sale
    const stockAfterSale = await getStock(seafood.id, gradeId);
    assert.strictEqual(Number(stockAfterSale.quantityKg), 175);
    assert.strictEqual(Number(stockAfterSale.averageCost), 400, 'WAC must remain unchanged after sale');
    assert.strictEqual(Number(stockAfterSale.totalValue), 70000, 'Total Value = 175 * 400 = 70,000');
  });

  // =========================================================================
  // TEST 2: Wastage Valuation at Current WAC
  // =========================================================================
  test('2. Wastage Valuation: Deducts stock at current WAC without altering averageCost', async () => {
    const seafood = await setupSpecies('Tuna_Wastage', 200, 260);

    // Purchase 50 KG @ ₹200
    const bill = await purchaseBillService.createPurchaseBill({
      billDate: TEST_DATE,
      fishermanId,
      items: [
        {
          seafoodId: seafood.id,
          gradeId,
          cratesCount: 1,
          grossKg: 52,
          tareKg: 2,
          quantityKg: 50,
          purchaseRate: 200
        }
      ],
      payments: [{ amount: 10000, paymentMethod: PaymentMethod.CASH }]
    });
    createdBillIds.push(bill.id);

    // Record Wastage of 5 KG
    const wasteRes = await stockService.recordWastage({
      seafoodId: seafood.id,
      gradeId,
      quantityKg: 5,
      reason: 'Spoilage during transport'
    });

    // Verify StockMovement costing
    assert.strictEqual(wasteRes.movement.movementType, 'WASTE');
    assert.strictEqual(Number(wasteRes.movement.quantityKg), -5);
    assert.strictEqual(Number(wasteRes.movement.unitCost), 200);
    assert.strictEqual(Number(wasteRes.movement.totalCost), 1000);
    assert.strictEqual(Number(wasteRes.movement.balanceBefore), 50);
    assert.strictEqual(Number(wasteRes.movement.balanceAfter), 45);

    // Verify Stock
    const stockAfterWaste = await getStock(seafood.id, gradeId);
    assert.strictEqual(Number(stockAfterWaste.quantityKg), 45);
    assert.strictEqual(Number(stockAfterWaste.averageCost), 200);
    assert.strictEqual(Number(stockAfterWaste.totalValue), 9000);
  });

  // =========================================================================
  // TEST 3: Purchase Intake Cancellation Guard (CANCELLATION_VIOLATION)
  // Purchase 50 KG -> Sell 40 KG -> Remaining 10 KG -> Attempt cancel 50 KG intake -> REJECT
  // =========================================================================
  test('3. Purchase Cancellation Guard: Rejects cancellation if remaining stock is insufficient', async () => {
    const seafood = await setupSpecies('Seer_Cancel', 380, 480);

    // 1. Purchase 50 KG @ ₹380
    const bill = await purchaseBillService.createPurchaseBill({
      billDate: TEST_DATE,
      fishermanId,
      items: [
        {
          seafoodId: seafood.id,
          gradeId,
          cratesCount: 1,
          grossKg: 52,
          tareKg: 2,
          quantityKg: 50,
          purchaseRate: 380
        }
      ],
      payments: [{ amount: 19000, paymentMethod: PaymentMethod.CASH }]
    });
    createdBillIds.push(bill.id);

    // 2. Sell 40 KG
    const sale = await saleService.createSale({
      saleDate: TEST_DATE,
      customerId,
      saleType: SaleType.WHOLESALE,
      items: [
        {
          seafoodId: seafood.id,
          gradeId,
          quantityKg: 40,
          sellingRate: 480
        }
      ],
      payments: [{ amount: 19200, paymentMethod: PaymentMethod.CASH }]
    });
    createdSaleIds.push(sale.id);

    // Remaining stock is 10 KG
    const stockBeforeCancel = await getStock(seafood.id, gradeId);
    assert.strictEqual(Number(stockBeforeCancel.quantityKg), 10);

    // 3. Attempt to cancel original 50 KG purchase bill -> Must throw CANCELLATION_VIOLATION
    await assert.rejects(
      async () => {
        await purchaseBillService.cancelPurchaseBill(bill.id);
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.code, 'CANCELLATION_VIOLATION');
        return true;
      }
    );

    // Verify stock was NOT altered and did not go negative
    const stockAfterRejectedCancel = await getStock(seafood.id, gradeId);
    assert.strictEqual(Number(stockAfterRejectedCancel.quantityKg), 10);
    assert.strictEqual(Number(stockAfterRejectedCancel.averageCost), 380);
    assert.strictEqual(Number(stockAfterRejectedCancel.totalValue), 3800);
  });

  // =========================================================================
  // TEST 4: Sale Cancellation Restores Stock and Valuation
  // =========================================================================
  test('4. Sale Cancellation: Restores stock quantity and valuation with compensating RETURN movement', async () => {
    const seafood = await setupSpecies('Salmon_Return', 300, 400);

    // Purchase 100 KG @ ₹300
    const bill = await purchaseBillService.createPurchaseBill({
      billDate: TEST_DATE,
      fishermanId,
      items: [
        {
          seafoodId: seafood.id,
          gradeId,
          cratesCount: 2,
          grossKg: 104,
          tareKg: 4,
          quantityKg: 100,
          purchaseRate: 300
        }
      ],
      payments: [{ amount: 30000, paymentMethod: PaymentMethod.CASH }]
    });
    createdBillIds.push(bill.id);

    // Sell 30 KG @ ₹400 (COGS = 30 * 300 = 9,000)
    const sale = await saleService.createSale({
      saleDate: TEST_DATE,
      customerId,
      saleType: SaleType.WHOLESALE,
      items: [
        {
          seafoodId: seafood.id,
          gradeId,
          quantityKg: 30,
          sellingRate: 400
        }
      ],
      payments: [{ amount: 12000, paymentMethod: PaymentMethod.CASH }]
    });
    createdSaleIds.push(sale.id);

    const stockAfterSale = await getStock(seafood.id, gradeId);
    assert.strictEqual(Number(stockAfterSale.quantityKg), 70);
    assert.strictEqual(Number(stockAfterSale.totalValue), 21000);

    // Cancel the sale
    const cancelledSale = await saleService.cancelSale(sale.id);
    assert.strictEqual(cancelledSale.status, SaleStatus.CANCELLED);
    assert.strictEqual(cancelledSale.paymentStatus, PaymentStatus.CANCELLED);

    // Historical COGS and gross profit on SaleItem must remain intact
    assert.strictEqual(Number(cancelledSale.items[0].costRate), 300);
    assert.strictEqual(Number(cancelledSale.items[0].cogsAmount), 9000);

    // Stock should be restored to 100 KG with value ₹30,000
    const stockAfterReturn = await getStock(seafood.id, gradeId);
    assert.strictEqual(Number(stockAfterReturn.quantityKg), 100);
    assert.strictEqual(Number(stockAfterReturn.averageCost), 300);
    assert.strictEqual(Number(stockAfterReturn.totalValue), 30000);

    // Verify compensating RETURN StockMovement
    const movements = await stockService.getStockMovements({
      seafoodId: seafood.id,
      gradeId
    });
    const returnMovement = movements.items.find((m) => m.movementType === 'RETURN');
    assert.ok(returnMovement, 'RETURN stock movement must exist');
    assert.strictEqual(Number(returnMovement.quantityKg), 30);
    assert.strictEqual(Number(returnMovement.unitCost), 300);
    assert.strictEqual(Number(returnMovement.totalCost), 9000);
  });

  // =========================================================================
  // CONCURRENCY TEST 1: Parallel Purchases (Moving WAC Blending)
  // =========================================================================
  test('5. Concurrency 1: Parallel purchases atomically blend into correct moving WAC', async () => {
    const seafood = await setupSpecies('Crab_Parallel', 380, 480);

    // Launch two purchases concurrently
    const [billA, billB] = await Promise.all([
      purchaseBillService.createPurchaseBill({
        billDate: TEST_DATE,
        fishermanId,
        items: [
          {
            seafoodId: seafood.id,
            gradeId,
            cratesCount: 2,
            grossKg: 104,
            tareKg: 4,
            quantityKg: 100,
            purchaseRate: 380
          }
        ],
        payments: [{ amount: 38000, paymentMethod: PaymentMethod.CASH }]
      }),
      purchaseBillService.createPurchaseBill({
        billDate: TEST_DATE,
        fishermanId,
        items: [
          {
            seafoodId: seafood.id,
            gradeId,
            cratesCount: 2,
            grossKg: 104,
            tareKg: 4,
            quantityKg: 100,
            purchaseRate: 420
          }
        ],
        payments: [{ amount: 42000, paymentMethod: PaymentMethod.CASH }]
      })
    ]);
    createdBillIds.push(billA.id, billB.id);

    // Both completed: Stock must be 200 KG @ ₹400 WAC (₹80,000 value)
    const finalStock = await getStock(seafood.id, gradeId);
    assert.strictEqual(Number(finalStock.quantityKg), 200);
    assert.strictEqual(Number(finalStock.averageCost), 400);
    assert.strictEqual(Number(finalStock.totalValue), 80000);
  });

  // =========================================================================
  // CONCURRENCY TEST 2: Concurrent Sales Competing for Stock (Non-negative Invariant)
  // 30 KG available -> Two sales of 20 KG concurrently -> Exactly 1 succeeds, 1 rejected
  // =========================================================================
  test('6. Concurrency 2: Competing concurrent sales enforce non-negative stock and row locking', async () => {
    const seafood = await setupSpecies('Lobster_Race', 400, 500);

    // Initial stock: 30 KG @ ₹400
    const bill = await purchaseBillService.createPurchaseBill({
      billDate: TEST_DATE,
      fishermanId,
      items: [
        {
          seafoodId: seafood.id,
          gradeId,
          cratesCount: 1,
          grossKg: 32,
          tareKg: 2,
          quantityKg: 30,
          purchaseRate: 400
        }
      ],
      payments: [{ amount: 12000, paymentMethod: PaymentMethod.CASH }]
    });
    createdBillIds.push(bill.id);

    // Concurrent sales of 20 KG each (total 40 KG > 30 KG available)
    const results = await Promise.allSettled([
      saleService.createSale({
        saleDate: TEST_DATE,
        customerId,
        saleType: SaleType.WHOLESALE,
        items: [{ seafoodId: seafood.id, gradeId, quantityKg: 20, sellingRate: 500 }],
        payments: [{ amount: 10000, paymentMethod: PaymentMethod.CASH }]
      }),
      saleService.createSale({
        saleDate: TEST_DATE,
        customerId,
        saleType: SaleType.WHOLESALE,
        items: [{ seafoodId: seafood.id, gradeId, quantityKg: 20, sellingRate: 500 }],
        payments: [{ amount: 10000, paymentMethod: PaymentMethod.CASH }]
      })
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent sale must succeed');
    assert.strictEqual(rejected.length, 1, 'Exactly one concurrent sale must fail');

    // Track created sale ID
    const successfulSale = (fulfilled[0] as PromiseFulfilledResult<any>).value;
    createdSaleIds.push(successfulSale.id);

    // Rejection reason must be INSUFFICIENT_STOCK
    const reason = (rejected[0] as PromiseRejectedResult).reason;
    assert.ok(reason instanceof AppError);
    assert.strictEqual(reason.code, 'INSUFFICIENT_STOCK');

    // Stock must be exactly 10 KG @ ₹400 (never negative)
    const finalStock = await getStock(seafood.id, gradeId);
    assert.strictEqual(Number(finalStock.quantityKg), 10);
    assert.strictEqual(Number(finalStock.averageCost), 400);
    assert.strictEqual(Number(finalStock.totalValue), 4000);
  });

  // =========================================================================
  // CONCURRENCY TEST 3: Concurrent Sale & Purchase
  // Initial 100 KG @ ₹380 -> Concurrent Sale (60 KG @ ₹460) & Purchase (100 KG @ ₹420)
  // Both succeed, final stock = 140 KG, WAC is consistent
  // =========================================================================
  test('7. Concurrency 3: Concurrent sale and purchase maintain consistent inventory invariants', async () => {
    const seafood = await setupSpecies('Mackerel_Mixed', 380, 460);

    // Initial stock: 100 KG @ ₹380
    const billInitial = await purchaseBillService.createPurchaseBill({
      billDate: TEST_DATE,
      fishermanId,
      items: [
        {
          seafoodId: seafood.id,
          gradeId,
          cratesCount: 2,
          grossKg: 104,
          tareKg: 4,
          quantityKg: 100,
          purchaseRate: 380
        }
      ],
      payments: [{ amount: 38000, paymentMethod: PaymentMethod.CASH }]
    });
    createdBillIds.push(billInitial.id);

    // Concurrent Sale 60 KG and Purchase 100 KG @ ₹420
    const [saleRes, purchaseRes] = await Promise.all([
      saleService.createSale({
        saleDate: TEST_DATE,
        customerId,
        saleType: SaleType.WHOLESALE,
        items: [{ seafoodId: seafood.id, gradeId, quantityKg: 60, sellingRate: 460 }],
        payments: [{ amount: 27600, paymentMethod: PaymentMethod.CASH }]
      }),
      purchaseBillService.createPurchaseBill({
        billDate: TEST_DATE,
        fishermanId,
        items: [
          {
            seafoodId: seafood.id,
            gradeId,
            cratesCount: 2,
            grossKg: 104,
            tareKg: 4,
            quantityKg: 100,
            purchaseRate: 420
          }
        ],
        payments: [{ amount: 42000, paymentMethod: PaymentMethod.CASH }]
      })
    ]);

    createdSaleIds.push(saleRes.id);
    createdBillIds.push(purchaseRes.id);

    // Final stock must be: 100 - 60 + 100 = 140 KG
    const finalStock = await getStock(seafood.id, gradeId);
    assert.strictEqual(Number(finalStock.quantityKg), 140);
    assert.ok(Number(finalStock.averageCost) > 0);
    assert.ok(Number(finalStock.totalValue) > 0);
    // Invariant check: totalValue ≈ quantityKg * averageCost (within 1 rupee rounding)
    const expectedValue = Number(finalStock.quantityKg) * Number(finalStock.averageCost);
    assert.ok(
      Math.abs(Number(finalStock.totalValue) - expectedValue) <= 1,
      `Inventory invariant totalValue (${finalStock.totalValue}) ≈ quantity * WAC (${expectedValue}) must hold`
    );
  });
});
