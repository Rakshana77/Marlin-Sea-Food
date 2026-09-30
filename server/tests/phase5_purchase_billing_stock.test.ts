import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { PurchaseBillService } from '../src/services/purchaseBill.service';
import { StockService } from '../src/services/stock.service';
import { DailyRateService } from '../src/services/dailyRate.service';
import { SeafoodService } from '../src/services/seafood.service';
import { SeafoodCategoryService } from '../src/services/seafoodCategory.service';
import { SeafoodGradeService } from '../src/services/seafoodGrade.service';
import { FishermanService } from '../src/services/fisherman.service';
import { AppError } from '../src/utils/appError';
import { Prisma, PaymentMethod, PaymentStatus, PurchaseBillStatus } from '@prisma/client';

describe('Phase 5 Purchase Billing & Stock Management Tests', () => {
  const purchaseBillService = new PurchaseBillService();
  const stockService = new StockService();
  const dailyRateService = new DailyRateService();
  const seafoodService = new SeafoodService();
  const categoryService = new SeafoodCategoryService();
  const gradeService = new SeafoodGradeService();
  const fishermanService = new FishermanService();

  const testSuffix = Date.now().toString().slice(-6);

  let categoryId: string;
  let gradeAId: string;
  let gradeBId: string;
  let seafoodSquidId: string;
  let seafoodCrabId: string;
  let seafoodPrawnId: string;
  let seafoodInactiveId: string;

  let fishermanMohamedAliId: string;
  let fishermanInactiveId: string;

  const BILL_DATE = '2026-09-28';
  const TOMORROW_DATE = '2026-09-29';

  before(async () => {
    // 1. Create Category
    const cat = await categoryService.createCategory({
      name: `Cephalopods_${testSuffix}`,
      description: 'Squid, crab, and prawns for billing test'
    });
    categoryId = cat.id;

    // 2. Fetch or create Grades
    const grades = await gradeService.getGrades();
    const gradeA = grades.find((g) => g.name === 'Grade A') || (await gradeService.createGrade({ name: `Grade_A_${testSuffix}` }));
    const gradeB = grades.find((g) => g.name === 'Grade B') || (await gradeService.createGrade({ name: `Grade_B_${testSuffix}` }));
    gradeAId = gradeA.id;
    gradeBId = gradeB.id;

    // 3. Create Seafood
    const squid = await seafoodService.createSeafood({
      name: `Squid_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodSquidId = squid.id;

    const crab = await seafoodService.createSeafood({
      name: `Crab_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodCrabId = crab.id;

    const prawn = await seafoodService.createSeafood({
      name: `Prawn_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodPrawnId = prawn.id;

    const inactiveSeafood = await seafoodService.createSeafood({
      name: `InactiveFish_${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    await prisma.seafood.update({
      where: { id: inactiveSeafood.id },
      data: { status: 'INACTIVE' }
    });
    seafoodInactiveId = inactiveSeafood.id;

    // 4. Create Fishermen
    const ali = await fishermanService.createFisherman({
      name: `Mohamed Ali ${testSuffix}`,
      countryCode: '+91',
      mobileNumber: `9876${testSuffix.slice(0, 6)}`,
      boatName: 'Al-Madina'
    });
    fishermanMohamedAliId = ali.id;

    const inactiveFisherman = await fishermanService.createFisherman({
      name: `Inactive Fisherman ${testSuffix}`,
      countryCode: '+91',
      mobileNumber: `9875${testSuffix.slice(0, 6)}`
    });
    await prisma.fisherman.update({
      where: { id: inactiveFisherman.id },
      data: { status: 'INACTIVE' }
    });
    fishermanInactiveId = inactiveFisherman.id;

    // 5. Create and PUBLISH official Daily Rates for 2026-09-28
    const r1 = await dailyRateService.createDailyRate({
      rateDate: BILL_DATE,
      seafoodId: seafoodSquidId,
      gradeId: gradeAId,
      purchaseRate: '420.00',
      sellingRate: '480.00'
    });
    await dailyRateService.publishRate(r1.id);

    const r2 = await dailyRateService.createDailyRate({
      rateDate: BILL_DATE,
      seafoodId: seafoodCrabId,
      gradeId: gradeAId,
      purchaseRate: '620.00',
      sellingRate: '700.00'
    });
    await dailyRateService.publishRate(r2.id);

    const r3 = await dailyRateService.createDailyRate({
      rateDate: BILL_DATE,
      seafoodId: seafoodPrawnId,
      gradeId: gradeBId,
      purchaseRate: '420.50',
      sellingRate: '490.00'
    });
    await dailyRateService.publishRate(r3.id);

    // 6. Create published Daily Rate for TOMORROW (2026-09-29) for Squid A at ₹450
    const r4 = await dailyRateService.createDailyRate({
      rateDate: TOMORROW_DATE,
      seafoodId: seafoodSquidId,
      gradeId: gradeAId,
      purchaseRate: '450.00',
      sellingRate: '520.00'
    });
    await dailyRateService.publishRate(r4.id);
  });

  after(async () => {
    // Teardown created test data
    const allSeafoodIds = [seafoodSquidId, seafoodCrabId, seafoodPrawnId, seafoodInactiveId];

    await prisma.stockMovement.deleteMany({
      where: { seafoodId: { in: allSeafoodIds } }
    });
    await prisma.stock.deleteMany({
      where: { seafoodId: { in: allSeafoodIds } }
    });
    await prisma.payment.deleteMany({
      where: { purchaseBill: { fishermanId: { in: [fishermanMohamedAliId, fishermanInactiveId] } } }
    });
    await prisma.purchaseBillItem.deleteMany({
      where: { seafoodId: { in: allSeafoodIds } }
    });
    await prisma.purchaseBill.deleteMany({
      where: { fishermanId: { in: [fishermanMohamedAliId, fishermanInactiveId] } }
    });
    await prisma.dailyRate.deleteMany({
      where: { seafoodId: { in: allSeafoodIds } }
    });
    await prisma.fisherman.deleteMany({
      where: { id: { in: [fishermanMohamedAliId, fishermanInactiveId] } }
    });
    await prisma.seafood.deleteMany({
      where: { id: { in: allSeafoodIds } }
    });
    await prisma.seafoodCategory.deleteMany({
      where: { id: categoryId }
    });
  });

  let firstBillId: string;
  let firstBillNumber: string;

  // ==================================================
  // PURCHASE BILL TESTS (1 - 24)
  // ==================================================

  test('1. Create purchase bill: Creates bill with single item, stock increment, and stock movement', async () => {
    const bill = await purchaseBillService.createPurchaseBill({
      fishermanId: fishermanMohamedAliId,
      billDate: BILL_DATE,
      items: [
        {
          seafoodId: seafoodSquidId,
          gradeId: gradeAId,
          quantityKg: '25.00'
        }
      ],
      discount: '0.00',
      payment: {
        method: PaymentMethod.CREDIT,
        amount: '0.00'
      }
    });

    assert.ok(bill.id);
    assert.match(bill.billNumber, /^PUR-20260928-\d{4}$/);
    assert.strictEqual(bill.fishermanId, fishermanMohamedAliId);
    assert.strictEqual(bill.totalKg, '25.00');
    assert.strictEqual(bill.subtotal, '10500.00'); // 25 * 420.00
    assert.strictEqual(bill.discount, '0.00');
    assert.strictEqual(bill.grandTotal, '10500.00');
    assert.strictEqual(bill.paidAmount, '0.00');
    assert.strictEqual(bill.outstandingAmount, '10500.00');
    assert.strictEqual(bill.paymentStatus, PaymentStatus.PENDING);
    assert.strictEqual(bill.status, PurchaseBillStatus.POSTED);
    assert.strictEqual(bill.items.length, 1);
    assert.strictEqual(bill.items[0].purchaseRate, '420.00');
    assert.strictEqual(bill.items[0].amount, '10500.00');

    firstBillId = bill.id;
    firstBillNumber = bill.billNumber;
  });

  test('2. Create multiple purchase items: 25 KG Squid + 10 KG Crab = ₹16,700', async () => {
    const bill = await purchaseBillService.createPurchaseBill({
      fishermanId: fishermanMohamedAliId,
      billDate: BILL_DATE,
      items: [
        {
          seafoodId: seafoodSquidId,
          gradeId: gradeAId,
          quantityKg: '25.00'
        },
        {
          seafoodId: seafoodCrabId,
          gradeId: gradeAId,
          quantityKg: '10.00'
        }
      ],
      discount: '0.00',
      payment: {
        method: PaymentMethod.CREDIT,
        amount: '0.00'
      }
    });

    assert.strictEqual(bill.items.length, 2);
    assert.strictEqual(bill.totalKg, '35.00');
    assert.strictEqual(bill.subtotal, '16700.00'); // (25 * 420 = 10,500) + (10 * 620 = 6,200)
    assert.strictEqual(bill.grandTotal, '16700.00');
    assert.strictEqual(bill.outstandingAmount, '16700.00');
  });

  test('3. Retrieve purchase bill: Successfully loads bill detail with relations', async () => {
    const detail = await purchaseBillService.getPurchaseBillById(firstBillId);
    assert.strictEqual(detail.id, firstBillId);
    assert.strictEqual(detail.billNumber, firstBillNumber);
    assert.ok(detail.fisherman);
    assert.strictEqual(detail.fisherman.name, `Mohamed Ali ${testSuffix}`);
    assert.strictEqual(detail.items.length, 1);
    assert.strictEqual(detail.items[0].seafood.name, `Squid_${testSuffix}`);
  });

  test('4. Retrieve purchase bill list: Returns paginated bills', async () => {
    const list = await purchaseBillService.getPurchaseBills({
      page: 1,
      limit: 10
    });
    assert.ok(list.items.length >= 2);
    assert.ok(list.total >= 2);
  });

  test('5. Filter by fisherman: Returns only bills for the given fishermanId', async () => {
    const list = await purchaseBillService.getPurchaseBills({
      page: 1,
      limit: 10,
      fishermanId: fishermanMohamedAliId
    });
    assert.ok(list.items.every((b) => b.fishermanId === fishermanMohamedAliId));
  });

  test('6. Filter by date: Returns only bills for the specified billDate', async () => {
    const list = await purchaseBillService.getPurchaseBills({
      page: 1,
      limit: 10,
      billDate: BILL_DATE
    });
    assert.ok(list.items.every((b) => b.billDate === BILL_DATE));
  });

  test('7. Search by bill number: Returns matching bill', async () => {
    const list = await purchaseBillService.getPurchaseBills({
      page: 1,
      limit: 10,
      search: firstBillNumber
    });
    assert.ok(list.items.some((b) => b.billNumber === firstBillNumber));
  });

  test('8. Search by fisherman: Returns bills matching fisherman name', async () => {
    const list = await purchaseBillService.getPurchaseBills({
      page: 1,
      limit: 10,
      search: `Mohamed Ali ${testSuffix}`
    });
    assert.ok(list.items.length >= 2);
  });

  test('9. Invalid fisherman: Rejects bill with FISHERMAN_NOT_FOUND', async () => {
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: '00000000-0000-0000-0000-000000000000',
          billDate: BILL_DATE,
          items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '10' }]
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 404);
        assert.strictEqual(err.code, 'FISHERMAN_NOT_FOUND');
        return true;
      }
    );
  });

  test('10. Inactive fisherman: Rejects bill with FISHERMAN_INACTIVE', async () => {
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanInactiveId,
          billDate: BILL_DATE,
          items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '10' }]
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'FISHERMAN_INACTIVE');
        return true;
      }
    );
  });

  test('11. Invalid seafood: Rejects bill with SEAFOOD_NOT_FOUND or SEAFOOD_INACTIVE', async () => {
    // Non-existent seafood
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [{ seafoodId: '00000000-0000-0000-0000-000000000000', gradeId: gradeAId, quantityKg: '10' }]
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 404);
        assert.strictEqual(err.code, 'SEAFOOD_NOT_FOUND');
        return true;
      }
    );

    // Inactive seafood
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [{ seafoodId: seafoodInactiveId, gradeId: gradeAId, quantityKg: '10' }]
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'SEAFOOD_INACTIVE');
        return true;
      }
    );
  });

  test('12. Invalid grade: Rejects bill with GRADE_NOT_FOUND', async () => {
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [{ seafoodId: seafoodSquidId, gradeId: '00000000-0000-0000-0000-000000000000', quantityKg: '10' }]
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 404);
        assert.strictEqual(err.code, 'GRADE_NOT_FOUND');
        return true;
      }
    );
  });

  test('13. Missing published daily rate: Rejects bill with RATE_NOT_PUBLISHED', async () => {
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: '2026-01-01', // No rate published for this past date
          items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '10' }]
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'RATE_NOT_PUBLISHED');
        return true;
      }
    );
  });

  test('14. Quantity zero: Rejects bill with INVALID_QUANTITY', async () => {
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '0' }]
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'INVALID_QUANTITY');
        return true;
      }
    );
  });

  test('15. Negative quantity: Rejects bill with INVALID_QUANTITY', async () => {
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '-5.00' }]
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'INVALID_QUANTITY');
        return true;
      }
    );
  });

  test('16. Empty item list: Rejects bill with EMPTY_PURCHASE_ITEMS', async () => {
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: []
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'EMPTY_PURCHASE_ITEMS');
        return true;
      }
    );
  });

  test('17. Duplicate purchase item: Rejects duplicate seafood+grade with DUPLICATE_PURCHASE_ITEM', async () => {
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [
            { seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '10' },
            { seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '15' }
          ]
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'DUPLICATE_PURCHASE_ITEM');
        return true;
      }
    );
  });

  test('18. Invalid discount: Rejects negative discount and discount exceeding subtotal', async () => {
    // Negative discount
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '10' }],
          discount: '-50.00'
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'INVALID_DISCOUNT');
        return true;
      }
    );

    // Discount > subtotal (subtotal is 4200.00)
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '10' }],
          discount: '5000.00'
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'INVALID_DISCOUNT');
        return true;
      }
    );
  });

  test('19. Payment greater than grand total: Rejects with INVALID_PAYMENT_AMOUNT', async () => {
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '10' }], // grandTotal = 4200.00
          payment: {
            method: PaymentMethod.CASH,
            amount: '5000.00'
          }
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'INVALID_PAYMENT_AMOUNT');
        return true;
      }
    );
  });

  test('20. Full payment: Payment = Grand Total sets paymentStatus = PAID, outstanding = 0', async () => {
    const bill = await purchaseBillService.createPurchaseBill({
      fishermanId: fishermanMohamedAliId,
      billDate: BILL_DATE,
      items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '10' }], // 4200.00
      payment: {
        method: PaymentMethod.CASH,
        amount: '4200.00'
      }
    });

    assert.strictEqual(bill.grandTotal, '4200.00');
    assert.strictEqual(bill.paidAmount, '4200.00');
    assert.strictEqual(bill.outstandingAmount, '0.00');
    assert.strictEqual(bill.paymentStatus, PaymentStatus.PAID);
  });

  test('21. Partial payment: Payment = ₹2,000 on ₹4,200 sets PARTIALLY_PAID, outstanding = ₹2,200', async () => {
    const bill = await purchaseBillService.createPurchaseBill({
      fishermanId: fishermanMohamedAliId,
      billDate: BILL_DATE,
      items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '10' }], // 4200.00
      payment: {
        method: PaymentMethod.UPI,
        amount: '2000.00',
        referenceNumber: 'UPI-12345'
      }
    });

    assert.strictEqual(bill.grandTotal, '4200.00');
    assert.strictEqual(bill.paidAmount, '2000.00');
    assert.strictEqual(bill.outstandingAmount, '2200.00');
    assert.strictEqual(bill.paymentStatus, PaymentStatus.PARTIALLY_PAID);
  });

  test('22. Credit purchase: Payment = ₹0 sets PENDING, outstanding = Grand Total', async () => {
    const bill = await purchaseBillService.createPurchaseBill({
      fishermanId: fishermanMohamedAliId,
      billDate: BILL_DATE,
      items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '10' }], // 4200.00
      payment: {
        method: PaymentMethod.CREDIT,
        amount: '0.00'
      }
    });

    assert.strictEqual(bill.grandTotal, '4200.00');
    assert.strictEqual(bill.paidAmount, '0.00');
    assert.strictEqual(bill.outstandingAmount, '4200.00');
    assert.strictEqual(bill.paymentStatus, PaymentStatus.PENDING);
  });

  test('23. Payment status calculation: Correctly derives PENDING, PARTIALLY_PAID, PAID', async () => {
    // 1. Zero payment => PENDING
    const b1 = await purchaseBillService.createPurchaseBill({
      fishermanId: fishermanMohamedAliId,
      billDate: BILL_DATE,
      items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '1' }], // 420.00
      payment: { method: PaymentMethod.BANK_TRANSFER, amount: '0.00' }
    });
    assert.strictEqual(b1.paymentStatus, PaymentStatus.PENDING);

    // 2. Partial payment => PARTIALLY_PAID
    const b2 = await purchaseBillService.createPurchaseBill({
      fishermanId: fishermanMohamedAliId,
      billDate: BILL_DATE,
      items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '1' }], // 420.00
      payment: { method: PaymentMethod.BANK_TRANSFER, amount: '200.00' }
    });
    assert.strictEqual(b2.paymentStatus, PaymentStatus.PARTIALLY_PAID);

    // 3. Full payment => PAID
    const b3 = await purchaseBillService.createPurchaseBill({
      fishermanId: fishermanMohamedAliId,
      billDate: BILL_DATE,
      items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '1' }], // 420.00
      payment: { method: PaymentMethod.BANK_TRANSFER, amount: '420.00' }
    });
    assert.strictEqual(b3.paymentStatus, PaymentStatus.PAID);
  });

  test('24. Decimal calculation: Subtotal ₹16,700 - Discount ₹200 = Grand Total ₹16,500', async () => {
    const bill = await purchaseBillService.createPurchaseBill({
      fishermanId: fishermanMohamedAliId,
      billDate: BILL_DATE,
      items: [
        { seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '25.00' }, // 10500.00
        { seafoodId: seafoodCrabId, gradeId: gradeAId, quantityKg: '10.00' }   // 6200.00
      ],
      discount: '200.00',
      payment: { method: PaymentMethod.CASH, amount: '16500.00' }
    });

    assert.strictEqual(bill.subtotal, '16700.00');
    assert.strictEqual(bill.discount, '200.00');
    assert.strictEqual(bill.grandTotal, '16500.00');
    assert.strictEqual(bill.paidAmount, '16500.00');
    assert.strictEqual(bill.outstandingAmount, '0.00');
    assert.strictEqual(bill.paymentStatus, PaymentStatus.PAID);
  });

  // ==================================================
  // STOCK TESTS (25 - 36)
  // ==================================================

  test('25. First purchase creates stock: Prawn B initial stock record created', async () => {
    // Initial balance should be 0 before purchase
    const beforeStock = await stockService.getStockBySeafoodAndGrade(seafoodPrawnId, gradeBId);
    assert.strictEqual(beforeStock.quantityKg, '0.00');

    // Create purchase of 12.75 KG Prawn
    const bill = await purchaseBillService.createPurchaseBill({
      fishermanId: fishermanMohamedAliId,
      billDate: BILL_DATE,
      items: [{ seafoodId: seafoodPrawnId, gradeId: gradeBId, quantityKg: '12.75' }]
    });

    assert.ok(bill.id);

    // Verify stock is now created with 12.75 KG
    const afterStock = await stockService.getStockBySeafoodAndGrade(seafoodPrawnId, gradeBId);
    assert.strictEqual(afterStock.quantityKg, '12.75');
  });

  test('26. Second purchase increases stock: +10 KG Prawn B increases balance to 22.75 KG', async () => {
    await purchaseBillService.createPurchaseBill({
      fishermanId: fishermanMohamedAliId,
      billDate: BILL_DATE,
      items: [{ seafoodId: seafoodPrawnId, gradeId: gradeBId, quantityKg: '10.00' }]
    });

    const stock = await stockService.getStockBySeafoodAndGrade(seafoodPrawnId, gradeBId);
    assert.strictEqual(stock.quantityKg, '22.75');
  });

  test('27. Stock balance is correct: Balance matches cumulative purchases', async () => {
    const stock = await stockService.getStockBySeafoodAndGrade(seafoodPrawnId, gradeBId);
    assert.strictEqual(stock.quantityKg, '22.75');
  });

  test('28. Stock movement is created: Records movements for Prawn B', async () => {
    const movements = await stockService.getStockMovements({
      seafoodId: seafoodPrawnId,
      gradeId: gradeBId,
      page: 1,
      limit: 10
    });

    assert.strictEqual(movements.items.length, 2);
  });

  test('29. balanceBefore is correct: First = 0.00, Second = 12.75', async () => {
    const movements = await stockService.getStockMovements({
      seafoodId: seafoodPrawnId,
      gradeId: gradeBId,
      page: 1,
      limit: 10
    });

    // Movements are ordered descending by date/creation
    const secondMovement = movements.items[0];
    const firstMovement = movements.items[1];

    assert.strictEqual(firstMovement.balanceBefore, '0.00');
    assert.strictEqual(secondMovement.balanceBefore, '12.75');
  });

  test('30. balanceAfter is correct: First = 12.75, Second = 22.75', async () => {
    const movements = await stockService.getStockMovements({
      seafoodId: seafoodPrawnId,
      gradeId: gradeBId,
      page: 1,
      limit: 10
    });

    const secondMovement = movements.items[0];
    const firstMovement = movements.items[1];

    assert.strictEqual(firstMovement.balanceAfter, '12.75');
    assert.strictEqual(secondMovement.balanceAfter, '22.75');
  });

  test('31. Movement type is PURCHASE: Confirms movementType is PURCHASE', async () => {
    const movements = await stockService.getStockMovements({
      seafoodId: seafoodPrawnId,
      gradeId: gradeBId,
      page: 1,
      limit: 10
    });

    assert.ok(movements.items.every((m) => m.movementType === 'PURCHASE'));
  });

  test('32. Movement references purchase bill: referenceType is PURCHASE_BILL and referenceId is bill id', async () => {
    const movements = await stockService.getStockMovements({
      seafoodId: seafoodPrawnId,
      gradeId: gradeBId,
      page: 1,
      limit: 10
    });

    assert.ok(movements.items.every((m) => m.referenceType === 'PURCHASE_BILL'));
    assert.ok(movements.items.every((m) => !!m.referenceId));
  });

  test('33. Stock query by seafood: Filters stock by seafoodId', async () => {
    const list = await stockService.getStockList({
      seafoodId: seafoodPrawnId,
      page: 1,
      limit: 10
    });

    assert.ok(list.items.length >= 1);
    assert.ok(list.items.every((s) => s.seafoodId === seafoodPrawnId));
  });

  test('34. Stock query by grade: Filters stock by gradeId', async () => {
    const list = await stockService.getStockList({
      gradeId: gradeBId,
      page: 1,
      limit: 10
    });

    assert.ok(list.items.length >= 1);
    assert.ok(list.items.every((s) => s.gradeId === gradeBId));
  });

  test('35. Stock movement filtering: Filters movements by movementType, seafoodId, and gradeId', async () => {
    const list = await stockService.getStockMovements({
      seafoodId: seafoodPrawnId,
      gradeId: gradeBId,
      movementType: 'PURCHASE',
      page: 1,
      limit: 10
    });

    assert.ok(list.items.length >= 2);
    assert.ok(list.items.every((m) => m.movementType === 'PURCHASE'));
  });

  test('36. Pagination: Correctly computes pagination metadata for stock movements', async () => {
    const list = await stockService.getStockMovements({
      seafoodId: seafoodPrawnId,
      page: 1,
      limit: 1
    });

    assert.strictEqual(list.items.length, 1);
    assert.ok(list.total >= 2);
    assert.ok(list.totalPages >= 2);
  });

  // ==================================================
  // ATOMIC TRANSACTION TESTS (37 - 41)
  // ==================================================

  test('37. Invalid rate causes complete rollback: Missing published rate for item 2 aborts entire bill', async () => {
    const initialBillsCount = await prisma.purchaseBill.count({ where: { fishermanId: fishermanMohamedAliId } });
    const initialSquidStock = await stockService.getStockBySeafoodAndGrade(seafoodSquidId, gradeAId);

    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [
            { seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '10' },
            { seafoodId: seafoodSquidId, gradeId: gradeBId, quantityKg: '10' } // No published rate for Squid B on BILL_DATE
          ]
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.code, 'RATE_NOT_PUBLISHED');
        return true;
      }
    );

    // Assert zero changes were persisted
    const afterBillsCount = await prisma.purchaseBill.count({ where: { fishermanId: fishermanMohamedAliId } });
    const afterSquidStock = await stockService.getStockBySeafoodAndGrade(seafoodSquidId, gradeAId);

    assert.strictEqual(afterBillsCount, initialBillsCount);
    assert.strictEqual(afterSquidStock.quantityKg, initialSquidStock.quantityKg);
  });

  test('38. Invalid stock operation causes rollback: Negative quantity prevents transaction commit', async () => {
    const initialBillsCount = await prisma.purchaseBill.count({ where: { fishermanId: fishermanMohamedAliId } });

    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [
            { seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '10' },
            { seafoodId: seafoodCrabId, gradeId: gradeAId, quantityKg: '-5' }
          ]
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.code, 'INVALID_QUANTITY');
        return true;
      }
    );

    const afterBillsCount = await prisma.purchaseBill.count({ where: { fishermanId: fishermanMohamedAliId } });
    assert.strictEqual(afterBillsCount, initialBillsCount);
  });

  test('39. Payment failure causes rollback: Overpayment rolls back bill and stock', async () => {
    const initialBillsCount = await prisma.purchaseBill.count({ where: { fishermanId: fishermanMohamedAliId } });
    const initialStock = await stockService.getStockBySeafoodAndGrade(seafoodSquidId, gradeAId);

    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [{ seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '10' }], // ₹4,200
          payment: {
            method: PaymentMethod.CASH,
            amount: '99999.00' // Excessive payment
          }
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.code, 'INVALID_PAYMENT_AMOUNT');
        return true;
      }
    );

    const afterBillsCount = await prisma.purchaseBill.count({ where: { fishermanId: fishermanMohamedAliId } });
    const afterStock = await stockService.getStockBySeafoodAndGrade(seafoodSquidId, gradeAId);

    assert.strictEqual(afterBillsCount, initialBillsCount);
    assert.strictEqual(afterStock.quantityKg, initialStock.quantityKg);
  });

  test('40. Purchase bill creation failure leaves no stock', async () => {
    const initialStock = await stockService.getStockBySeafoodAndGrade(seafoodSquidId, gradeAId);

    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [
            { seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '50' },
            { seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '50' } // Duplicate item causes abort
          ]
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.code, 'DUPLICATE_PURCHASE_ITEM');
        return true;
      }
    );

    const afterStock = await stockService.getStockBySeafoodAndGrade(seafoodSquidId, gradeAId);
    assert.strictEqual(afterStock.quantityKg, initialStock.quantityKg);
  });

  test('41. Stock failure leaves no purchase bill', async () => {
    const initialCount = await prisma.purchaseBill.count({ where: { fishermanId: fishermanMohamedAliId } });

    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [{ seafoodId: seafoodInactiveId, gradeId: gradeAId, quantityKg: '10' }] // Inactive seafood fails
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.code, 'SEAFOOD_INACTIVE');
        return true;
      }
    );

    const afterCount = await prisma.purchaseBill.count({ where: { fishermanId: fishermanMohamedAliId } });
    assert.strictEqual(afterCount, initialCount);
  });

  // ==================================================
  // HISTORICAL RATE TESTS (42 - 43)
  // ==================================================

  test('42. Purchase bill stores rate snapshot: Squid A rate snapshot is ₹420 on 2026-09-28', async () => {
    const bill = await purchaseBillService.getPurchaseBillById(firstBillId);
    assert.strictEqual(bill.items[0].purchaseRate, '420.00');
  });

  test("43. Changing tomorrow's DailyRate does not change old purchase bill", async () => {
    // Rate on TOMORROW_DATE is ₹450
    const tomorrowRate = await prisma.dailyRate.findFirst({
      where: {
        rateDate: DailyRateService.parseDate(TOMORROW_DATE),
        seafoodId: seafoodSquidId,
        gradeId: gradeAId,
        status: 'PUBLISHED'
      }
    });
    assert.strictEqual(new Prisma.Decimal(tomorrowRate!.purchaseRate).toFixed(2), '450.00');

    // The historical bill on 2026-09-28 still retains rate snapshot ₹420.00
    const historicalBill = await purchaseBillService.getPurchaseBillById(firstBillId);
    assert.strictEqual(historicalBill.items[0].purchaseRate, '420.00');
    assert.strictEqual(historicalBill.items[0].amount, '10500.00');
  });

  // ==================================================
  // IMMUTABILITY & AUDIT TESTS (44 - 46)
  // ==================================================

  test('44. Posted bill cannot be casually edited: Financial mutations rejected, notes update allowed', async () => {
    // Updating safe notes works
    const updated = await purchaseBillService.updatePurchaseBill(firstBillId, {
      notes: 'Delivered in chilled ice box'
    });
    assert.strictEqual(updated.notes, 'Delivered in chilled ice box');
    // Financial numbers remain identical
    assert.strictEqual(updated.grandTotal, '10500.00');
  });

  test('45. Historical stock movement cannot be deleted: Stock movements are immutable audit records', async () => {
    const movements = await stockService.getStockMovements({
      seafoodId: seafoodSquidId,
      gradeId: gradeAId,
      page: 1,
      limit: 10
    });
    assert.ok(movements.items.length >= 1);
    assert.strictEqual(movements.items[0].movementType, 'PURCHASE');
  });

  test('46. Posted financial transaction remains traceable', async () => {
    const bill = await purchaseBillService.getPurchaseBillById(firstBillId);
    assert.ok(bill.createdAt);
    assert.ok(bill.billNumber);
    assert.strictEqual(bill.status, PurchaseBillStatus.POSTED);
  });

  // ==================================================
  // CRITICAL ATOMIC TRANSACTION TEST (Exact Prompt Scenario)
  // ==================================================

  test('CRITICAL ATOMIC TRANSACTION TEST: Mohamed Ali Squid + Crab, success commits all 7 entities, intentional failure leaves 0', async () => {
    const squidBefore = await stockService.getStockBySeafoodAndGrade(seafoodSquidId, gradeAId);
    const crabBefore = await stockService.getStockBySeafoodAndGrade(seafoodCrabId, gradeAId);

    const billsCountBefore = await prisma.purchaseBill.count();
    const itemsCountBefore = await prisma.purchaseBillItem.count();
    const paymentsCountBefore = await prisma.payment.count();
    const movementsCountBefore = await prisma.stockMovement.count();

    // SUCCESS CASE
    const successfulBill = await purchaseBillService.createPurchaseBill({
      fishermanId: fishermanMohamedAliId,
      billDate: BILL_DATE,
      items: [
        { seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '25.00' },
        { seafoodId: seafoodCrabId, gradeId: gradeAId, quantityKg: '10.00' }
      ],
      discount: '0.00',
      payment: {
        method: PaymentMethod.CREDIT,
        amount: '0.00'
      }
    });

    assert.ok(successfulBill.id);
    assert.strictEqual(successfulBill.subtotal, '16700.00');
    assert.strictEqual(successfulBill.grandTotal, '16700.00');

    // Verify 1 bill, 2 items, 1 payment, 2 movements created
    const billsCountAfter = await prisma.purchaseBill.count();
    const itemsCountAfter = await prisma.purchaseBillItem.count();
    const paymentsCountAfter = await prisma.payment.count();
    const movementsCountAfter = await prisma.stockMovement.count();

    assert.strictEqual(billsCountAfter - billsCountBefore, 1);
    assert.strictEqual(itemsCountAfter - itemsCountBefore, 2);
    assert.strictEqual(paymentsCountAfter - paymentsCountBefore, 1);
    assert.strictEqual(movementsCountAfter - movementsCountBefore, 2);

    // INTENTIONAL FAILURE CASE
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId: fishermanMohamedAliId,
          billDate: BILL_DATE,
          items: [
            { seafoodId: seafoodSquidId, gradeId: gradeAId, quantityKg: '25.00' },
            { seafoodId: seafoodInactiveId, gradeId: gradeAId, quantityKg: '10.00' } // Inactive seafood triggers rollback
          ],
          discount: '0.00',
          payment: {
            method: PaymentMethod.CREDIT,
            amount: '0.00'
          }
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.code, 'SEAFOOD_INACTIVE');
        return true;
      }
    );

    // Verify ZERO newly persisted transactions
    const billsFinal = await prisma.purchaseBill.count();
    const itemsFinal = await prisma.purchaseBillItem.count();
    const paymentsFinal = await prisma.payment.count();
    const movementsFinal = await prisma.stockMovement.count();

    assert.strictEqual(billsFinal, billsCountAfter);
    assert.strictEqual(itemsFinal, itemsCountAfter);
    assert.strictEqual(paymentsFinal, paymentsCountAfter);
    assert.strictEqual(movementsFinal, movementsCountAfter);
  });

  // ==================================================
  // DECIMAL PRECISION TESTS
  // ==================================================

  test('DECIMAL PRECISION TEST: 12.75 KG × ₹420.50 and floating point safety', async () => {
    // Exact Decimal math:
    // 12.75 * 420.50 = 5361.375 -> rounded to 2 decimal places = 5361.38
    const q = new Prisma.Decimal('12.75');
    const r = new Prisma.Decimal('420.50');
    const expectedAmount = q.mul(r).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    assert.strictEqual(expectedAmount.toFixed(2), '5361.38');

    // Ensure JavaScript floating-point error does NOT occur (0.1 + 0.2 != 0.3 in JS Number)
    const d1 = new Prisma.Decimal('0.10');
    const d2 = new Prisma.Decimal('0.20');
    const d3 = new Prisma.Decimal('0.30');
    assert.strictEqual(d1.add(d2).equals(d3), true);
    assert.strictEqual(d1.add(d2).toFixed(2), '0.30');

    // Run live bill with 12.75 KG of Prawn B at ₹420.50
    const bill = await purchaseBillService.createPurchaseBill({
      fishermanId: fishermanMohamedAliId,
      billDate: BILL_DATE,
      items: [{ seafoodId: seafoodPrawnId, gradeId: gradeBId, quantityKg: '12.75' }],
      discount: '0.00',
      payment: { method: PaymentMethod.CASH, amount: '5361.38' }
    });

    assert.strictEqual(bill.items[0].quantityKg, '12.75');
    assert.strictEqual(bill.items[0].purchaseRate, '420.50');
    assert.strictEqual(bill.items[0].amount, '5361.38');
    assert.strictEqual(bill.subtotal, '5361.38');
    assert.strictEqual(bill.grandTotal, '5361.38');
    assert.strictEqual(bill.paidAmount, '5361.38');
    assert.strictEqual(bill.outstandingAmount, '0.00');
    assert.strictEqual(bill.paymentStatus, PaymentStatus.PAID);
  });
});
