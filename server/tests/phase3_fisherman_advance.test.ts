import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { createApp } from '../src/app';
import { signToken } from '../src/utils/jwt';
import { prisma } from '../src/lib/prisma';
import { FishermanAdvanceService } from '../src/services/fishermanAdvance.service';
import { PurchaseBillService } from '../src/services/purchaseBill.service';
import { DailyRateService } from '../src/services/dailyRate.service';
import { SeafoodService } from '../src/services/seafood.service';
import { SeafoodCategoryService } from '../src/services/seafoodCategory.service';
import { SeafoodGradeService } from '../src/services/seafoodGrade.service';
import { FishermanService } from '../src/services/fisherman.service';
import { AppError } from '../src/utils/appError';
import {
  AdvancePaymentMethod,
  AdvanceStatus,
  AdvanceEntryType,
  LedgerDirection,
  PaymentMethod,
  PaymentStatus,
  DayEndStatus
} from '@prisma/client';

describe('Phase 3 Fisherman Advance & Recovery Ledger Tests', () => {
  const advanceService = new FishermanAdvanceService();
  const purchaseBillService = new PurchaseBillService();
  const dailyRateService = new DailyRateService();
  const seafoodService = new SeafoodService();
  const categoryService = new SeafoodCategoryService();
  const gradeService = new SeafoodGradeService();
  const fishermanService = new FishermanService();

  const testSuffix = Date.now().toString().slice(-6);
  const TEST_DATE = '2026-10-01';

  let categoryId: string;
  let gradeId: string;
  let seafoodId: string;
  let fishermanId: string;

  const createdBillIds: string[] = [];

  before(async () => {
    // 1. Setup Category
    const cat = await categoryService.createCategory({
      name: `Adv_Cat_${testSuffix}`,
      description: 'Advance Test Category'
    });
    categoryId = cat.id;

    // 2. Setup Grade
    const grade = await gradeService.createGrade({
      name: `Grade_Adv_${testSuffix}`,
      description: 'Advance Grade'
    });
    gradeId = grade.id;

    // 3. Setup Seafood
    const seafood = await seafoodService.createSeafood({
      name: `King Mackerel ${testSuffix}`,
      categoryId,
      unit: 'KG'
    });
    seafoodId = seafood.id;

    // 4. Setup DailyRate for Catch Intake
    const rate = await dailyRateService.createDailyRate({
      rateDate: TEST_DATE,
      seafoodId,
      gradeId,
      purchaseRate: '400.00',
      sellingRate: '500.00'
    });
    await dailyRateService.publishRate(rate.id);

    // 5. Setup Fisherman
    const fisherman = await fishermanService.createFisherman({
      name: `Captain Mansoor ${testSuffix}`,
      mobileNumber: `9888${testSuffix}`
    });
    fishermanId = fisherman.id;
  });

  after(async () => {
    try {
      // Teardown created records safely
      if (createdBillIds.length > 0) {
        await prisma.stockMovement.deleteMany({ where: { referenceType: { in: ['PURCHASE_BILL', 'PURCHASE_CANCEL'] }, referenceId: { in: createdBillIds } } });
        await prisma.payment.deleteMany({ where: { purchaseBillId: { in: createdBillIds } } });
        await prisma.purchaseBillItem.deleteMany({ where: { purchaseBillId: { in: createdBillIds } } });
        await prisma.purchaseBill.deleteMany({ where: { id: { in: createdBillIds } } });
      }

      if (fishermanId) {
        await prisma.fishermanAdvanceLedger.deleteMany({ where: { fishermanId } });
        await prisma.fishermanAdvance.deleteMany({ where: { fishermanId } });
        await prisma.fisherman.delete({ where: { id: fishermanId } }).catch(() => {});
      }

      if (seafoodId) {
        await prisma.stockMovement.deleteMany({ where: { seafoodId } });
        await prisma.stock.deleteMany({ where: { seafoodId } });
        await prisma.dailyRate.deleteMany({ where: { seafoodId } });
        await prisma.seafood.delete({ where: { id: seafoodId } }).catch(() => {});
      }

      if (gradeId) {
        await prisma.seafoodGrade.delete({ where: { id: gradeId } }).catch(() => {});
      }

      if (categoryId) {
        await prisma.seafoodCategory.delete({ where: { id: categoryId } }).catch(() => {});
      }
    } catch (err) {
      console.error('Phase 3 teardown error:', err);
    }
  });

  let firstAdvanceId: string;

  test('1. Advance Disbursement creates active agreement, DEBIT ledger entry, and increases running debt', async () => {
    const result = await advanceService.disburseAdvance({
      fishermanId,
      sanctionDate: TEST_DATE,
      amount: '25000.00',
      paymentMethod: AdvancePaymentMethod.CASH,
      notes: 'Initial pre-season voyage advance'
    });

    firstAdvanceId = result.advance.id;

    // Verify Advance record
    assert.strictEqual(result.advance.fishermanId, fishermanId);
    assert.strictEqual(result.advance.status, AdvanceStatus.ACTIVE);
    assert.strictEqual(result.advance.disbursedAmount, '25000.00');
    assert.match(result.advance.advanceNumber, /^ADV-\d{8}-\d{4}$/);

    // Verify Ledger Entry
    assert.strictEqual(result.ledgerEntry.entryType, AdvanceEntryType.DISBURSEMENT);
    assert.strictEqual(result.ledgerEntry.direction, LedgerDirection.DEBIT);
    assert.strictEqual(result.ledgerEntry.amount, '25000.00');
    assert.strictEqual(result.ledgerEntry.balanceBefore, '0.00');
    assert.strictEqual(result.ledgerEntry.balanceAfter, '25000.00');
    assert.strictEqual(result.currentBalance, '25000.00');

    // Verify Balance summary
    const summary = await advanceService.getFishermanAdvanceBalance(fishermanId);
    assert.strictEqual(summary.currentBalance, '25000.00');
    assert.strictEqual(summary.totalDisbursed, '25000.00');
    assert.strictEqual(summary.totalRecovered, '0.00');
    assert.strictEqual(summary.activeAdvancesCount, 1);
  });

  test('2. Sequential second disbursement increments cumulative debt correctly', async () => {
    const result = await advanceService.disburseAdvance({
      fishermanId,
      sanctionDate: TEST_DATE,
      amount: '15000.00',
      paymentMethod: AdvancePaymentMethod.BANK_TRANSFER,
      paymentRef: 'NEFT998877',
      notes: 'Fuel and net repair supplementary advance'
    });

    assert.strictEqual(result.ledgerEntry.entryType, AdvanceEntryType.DISBURSEMENT);
    assert.strictEqual(result.ledgerEntry.direction, LedgerDirection.DEBIT);
    assert.strictEqual(result.ledgerEntry.amount, '15000.00');
    assert.strictEqual(result.ledgerEntry.balanceBefore, '25000.00');
    assert.strictEqual(result.ledgerEntry.balanceAfter, '40000.00');
    assert.strictEqual(result.currentBalance, '40000.00');

    const summary = await advanceService.getFishermanAdvanceBalance(fishermanId);
    assert.strictEqual(summary.currentBalance, '40000.00');
    assert.strictEqual(summary.totalDisbursed, '40000.00');
    assert.strictEqual(summary.activeAdvancesCount, 2);
  });

  let catchBillId: string;

  test('3. Catch Bill Deduction: deducts advance from gross catch and separates net cash payable', async () => {
    // 50 KG @ ₹400 = ₹20,000 gross total
    // Advance deducted: ₹8,000
    // Net payable cash = ₹12,000
    // Paid cash: ₹7,000 -> Outstanding cash = ₹5,000, status PARTIALLY_PAID
    const bill = await purchaseBillService.createPurchaseBill({
      fishermanId,
      billDate: TEST_DATE,
      items: [
        {
          seafoodId,
          gradeId,
          quantityKg: '50.00'
        }
      ],
      advanceDeducted: '8000.00',
      payment: {
        amount: '7000.00',
        method: PaymentMethod.CASH
      },
      notes: 'Catch bill with advance recovery deduction'
    });

    catchBillId = bill.id;
    createdBillIds.push(bill.id);

    // Verify Purchase Bill financial separation
    assert.strictEqual(bill.grandTotal, '20000.00');
    assert.strictEqual(bill.advanceDeducted, '8000.00');
    assert.strictEqual(bill.netPayableCash, '12000.00');
    assert.strictEqual(bill.paidAmount, '7000.00');
    assert.strictEqual(bill.outstandingAmount, '5000.00');
    assert.strictEqual(bill.paymentStatus, PaymentStatus.PARTIALLY_PAID);

    // Verify latest FishermanAdvanceLedger entry
    const ledger = await advanceService.getAdvanceLedger({
      fishermanId,
      entryType: AdvanceEntryType.RECOVERY_DEDUCTION
    });

    assert.ok(ledger.items.length >= 1);
    const deductionEntry = ledger.items[0];
    assert.strictEqual(deductionEntry.direction, LedgerDirection.CREDIT);
    assert.strictEqual(deductionEntry.amount, '8000.00');
    assert.strictEqual(deductionEntry.balanceBefore, '40000.00');
    assert.strictEqual(deductionEntry.balanceAfter, '32000.00');
    assert.strictEqual(deductionEntry.referenceType, 'PURCHASE_BILL_DEDUCTION');
    assert.strictEqual(deductionEntry.referenceId, bill.id);

    // Verify balance summary
    const summary = await advanceService.getFishermanAdvanceBalance(fishermanId);
    assert.strictEqual(summary.currentBalance, '32000.00');
    assert.strictEqual(summary.totalRecovered, '8000.00');
  });

  test('4. Direct Cash Repayment decrements advance debt via CREDIT', async () => {
    // Fisherman repays ₹12,000 cash directly
    const result = await advanceService.recordCashRepayment({
      fishermanId,
      amount: '12000.00',
      paymentMethod: AdvancePaymentMethod.CASH,
      notes: 'Counter cash payment'
    });

    assert.strictEqual(result.ledgerEntry.entryType, AdvanceEntryType.CASH_REPAYMENT);
    assert.strictEqual(result.ledgerEntry.direction, LedgerDirection.CREDIT);
    assert.strictEqual(result.ledgerEntry.amount, '12000.00');
    assert.strictEqual(result.ledgerEntry.balanceBefore, '32000.00');
    assert.strictEqual(result.ledgerEntry.balanceAfter, '20000.00');
    assert.strictEqual(result.currentBalance, '20000.00');

    const summary = await advanceService.getFishermanAdvanceBalance(fishermanId);
    assert.strictEqual(summary.currentBalance, '20000.00');
    // Total recovered = ₹8,000 (deduction) + ₹12,000 (cash repayment) = ₹20,000
    assert.strictEqual(summary.totalRecovered, '20000.00');
  });

  test('5. Catch Bill Cancellation reverses recovery via DEBIT (RECOVERY_REVERSAL)', async () => {
    // Current balance before cancellation: ₹20,000
    // Cancel bill with ₹8,000 deduction -> balance restored to ₹28,000
    const cancelledBill = await purchaseBillService.cancelPurchaseBill(catchBillId);
    assert.strictEqual(cancelledBill.status, 'CANCELLED');

    const ledger = await advanceService.getAdvanceLedger({
      fishermanId,
      entryType: AdvanceEntryType.RECOVERY_REVERSAL
    });

    assert.strictEqual(ledger.items.length, 1);
    const reversalEntry = ledger.items[0];
    assert.strictEqual(reversalEntry.direction, LedgerDirection.DEBIT);
    assert.strictEqual(reversalEntry.amount, '8000.00');
    assert.strictEqual(reversalEntry.balanceBefore, '20000.00');
    assert.strictEqual(reversalEntry.balanceAfter, '28000.00');
    assert.strictEqual(reversalEntry.referenceType, 'PURCHASE_CANCEL');
    assert.strictEqual(reversalEntry.referenceId, catchBillId);

    const summary = await advanceService.getFishermanAdvanceBalance(fishermanId);
    assert.strictEqual(summary.currentBalance, '28000.00');
  });

  test('6. Advance Write-Off: records CREDIT and updates advance status to WRITTEN_OFF', async () => {
    const result = await advanceService.writeOffAdvance({
      fishermanId,
      advanceId: firstAdvanceId,
      amount: '8000.00',
      reason: 'Partial bad-debt write-off approved due to cyclone damage'
    });

    assert.strictEqual(result.ledgerEntry.entryType, AdvanceEntryType.WRITE_OFF);
    assert.strictEqual(result.ledgerEntry.direction, LedgerDirection.CREDIT);
    assert.strictEqual(result.ledgerEntry.amount, '8000.00');
    assert.strictEqual(result.ledgerEntry.balanceBefore, '28000.00');
    assert.strictEqual(result.ledgerEntry.balanceAfter, '20000.00');
    assert.strictEqual(result.currentBalance, '20000.00');

    // Verify advance status updated
    const adv = await advanceService.getAdvanceById(firstAdvanceId);
    assert.strictEqual(adv.status, AdvanceStatus.WRITTEN_OFF);

    const summary = await advanceService.getFishermanAdvanceBalance(fishermanId);
    assert.strictEqual(summary.totalWrittenOff, '8000.00');
    assert.strictEqual(summary.currentBalance, '20000.00');
  });

  test('7. Complete Repayment clears balance to 0 and transitions active advances to FULLY_RECOVERED', async () => {
    // Repay remaining ₹20,000
    const result = await advanceService.recordCashRepayment({
      fishermanId,
      amount: '20000.00',
      paymentMethod: AdvancePaymentMethod.UPI,
      paymentRef: 'UPI_CLEAR_ALL'
    });

    assert.strictEqual(result.currentBalance, '0.00');
    assert.strictEqual(result.ledgerEntry.balanceAfter, '0.00');

    // Verify active advances marked as FULLY_RECOVERED
    const list = await advanceService.getAdvancesList({ fishermanId });
    for (const adv of list.items) {
      assert.ok(
        adv.status === AdvanceStatus.FULLY_RECOVERED || adv.status === AdvanceStatus.WRITTEN_OFF,
        `Advance ${adv.advanceNumber} should be FULLY_RECOVERED or WRITTEN_OFF, found ${adv.status}`
      );
    }

    const summary = await advanceService.getFishermanAdvanceBalance(fishermanId);
    assert.strictEqual(summary.currentBalance, '0.00');
    assert.strictEqual(summary.activeAdvancesCount, 0);
  });

  test('8. Strict Invariant & Non-Negativity Guards reject invalid mutations', async () => {
    // 1. Repaying when balance is 0
    await assert.rejects(
      async () => {
        await advanceService.recordCashRepayment({
          fishermanId,
          amount: '500.00',
          paymentMethod: AdvancePaymentMethod.CASH
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.code, 'NO_OUTSTANDING_BALANCE');
        return true;
      }
    );

    // 2. Disburse 5,000 to test boundary errors
    await advanceService.disburseAdvance({
      fishermanId,
      sanctionDate: TEST_DATE,
      amount: '5000.00',
      paymentMethod: AdvancePaymentMethod.CASH
    });

    // 3. Repaying more than balance (₹6,000 > ₹5,000)
    await assert.rejects(
      async () => {
        await advanceService.recordCashRepayment({
          fishermanId,
          amount: '6000.00',
          paymentMethod: AdvancePaymentMethod.CASH
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.code, 'EXCESSIVE_REPAYMENT');
        return true;
      }
    );

    // 4. Catch bill deduction exceeding advance balance
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId,
          billDate: TEST_DATE,
          items: [{ seafoodId, gradeId, quantityKg: '20.00' }], // 20 * 400 = 8000
          advanceDeducted: '6000.00' // Outstanding balance is only 5000
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.code, 'EXCESSIVE_ADVANCE_DEDUCTION');
        return true;
      }
    );

    // 5. Catch bill deduction exceeding grand total
    await assert.rejects(
      async () => {
        await purchaseBillService.createPurchaseBill({
          fishermanId,
          billDate: TEST_DATE,
          items: [{ seafoodId, gradeId, quantityKg: '5.00' }], // 5 * 400 = 2000
          advanceDeducted: '3000.00' // Exceeds 2000 gross total
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.code, 'EXCESSIVE_ADVANCE_DEDUCTION');
        return true;
      }
    );

    // 6. Write-off without mandatory reason
    await assert.rejects(
      async () => {
        await advanceService.writeOffAdvance({
          fishermanId,
          amount: '1000.00',
          reason: '   '
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.code, 'WRITEOFF_REASON_REQUIRED');
        return true;
      }
    );

    // Clean up temporary 5,000 debt
    await advanceService.recordCashRepayment({
      fishermanId,
      amount: '5000.00',
      paymentMethod: AdvancePaymentMethod.CASH
    });
  });

  test('9. Concurrency & Serialized Row Locking prevents race conditions', async () => {
    // Disburse ₹10,000 initial balance
    await advanceService.disburseAdvance({
      fishermanId,
      sanctionDate: TEST_DATE,
      amount: '10000.00',
      paymentMethod: AdvancePaymentMethod.CASH
    });

    // Execute 3 concurrent repayments in parallel: ₹2,000, ₹3,000, ₹4,000 (total = ₹9,000)
    const results = await Promise.all([
      advanceService.recordCashRepayment({
        fishermanId,
        amount: '2000.00',
        paymentMethod: AdvancePaymentMethod.CASH
      }),
      advanceService.recordCashRepayment({
        fishermanId,
        amount: '3000.00',
        paymentMethod: AdvancePaymentMethod.CASH
      }),
      advanceService.recordCashRepayment({
        fishermanId,
        amount: '4000.00',
        paymentMethod: AdvancePaymentMethod.CASH
      })
    ]);

    assert.strictEqual(results.length, 3);

    // Balance after parallel operations must be exactly ₹1,000.00
    const summary = await advanceService.getFishermanAdvanceBalance(fishermanId);
    assert.strictEqual(summary.currentBalance, '1000.00');

    // Final repayment of remaining ₹1,000
    await advanceService.recordCashRepayment({
      fishermanId,
      amount: '1000.00',
      paymentMethod: AdvancePaymentMethod.CASH
    });

    const finalSummary = await advanceService.getFishermanAdvanceBalance(fishermanId);
    assert.strictEqual(finalSummary.currentBalance, '0.00');
  });

  test('10. Concurrent Recovery Test: Parallel requests of ₹8,000 and ₹6,000 against ₹10,000 balance guarantees exactly one succeeds and one fails', async () => {
    // Disburse ₹10,000 initial balance
    await advanceService.disburseAdvance({
      fishermanId,
      sanctionDate: TEST_DATE,
      amount: '10000.00',
      paymentMethod: AdvancePaymentMethod.CASH
    });

    // Execute 2 concurrent repayment requests in parallel: ₹8,000 and ₹6,000 (total = ₹14,000 > ₹10,000)
    const results = await Promise.allSettled([
      advanceService.recordCashRepayment({
        fishermanId,
        amount: '8000.00',
        paymentMethod: AdvancePaymentMethod.CASH
      }),
      advanceService.recordCashRepayment({
        fishermanId,
        amount: '6000.00',
        paymentMethod: AdvancePaymentMethod.CASH
      })
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent request must succeed');
    assert.strictEqual(rejected.length, 1, 'Exactly one concurrent request must fail');

    const summary = await advanceService.getFishermanAdvanceBalance(fishermanId);
    // Balance must be either ₹2,000.00 or ₹4,000.00, NEVER negative and never ₹0
    assert.ok(
      summary.currentBalance === '2000.00' || summary.currentBalance === '4000.00',
      `Final balance must be ₹2,000.00 or ₹4,000.00, found: ${summary.currentBalance}`
    );

    // Clean up remaining debt
    await advanceService.recordCashRepayment({
      fishermanId,
      amount: summary.currentBalance,
      paymentMethod: AdvancePaymentMethod.CASH
    });
  });

  test('11. Advance Cancellation: Voids disbursement when no recovery has occurred via compensating CREDIT ledger entry', async () => {
    // 1. Disburse advance of ₹5,000
    const adv = await advanceService.disburseAdvance({
      fishermanId,
      sanctionDate: TEST_DATE,
      amount: '5000.00',
      paymentMethod: AdvancePaymentMethod.CASH,
      notes: 'Advance to be cancelled'
    });

    let summary = await advanceService.getFishermanAdvanceBalance(fishermanId);
    assert.strictEqual(summary.currentBalance, '5000.00');

    // 2. Cancel the advance
    const cancelResult = await advanceService.cancelAdvance({
      advanceId: adv.advance.id,
      fishermanId,
      reason: 'Fisherman cancelled voyage before departure'
    });

    assert.strictEqual(cancelResult.advance.status, AdvanceStatus.CANCELLED);
    assert.strictEqual(cancelResult.ledgerEntry.entryType, AdvanceEntryType.WRITE_OFF);
    assert.strictEqual(cancelResult.ledgerEntry.direction, LedgerDirection.CREDIT);
    assert.strictEqual(cancelResult.ledgerEntry.amount, '5000.00');
    assert.strictEqual(cancelResult.ledgerEntry.balanceBefore, '5000.00');
    assert.strictEqual(cancelResult.ledgerEntry.balanceAfter, '0.00');
    assert.strictEqual(cancelResult.currentBalance, '0.00');

    summary = await advanceService.getFishermanAdvanceBalance(fishermanId);
    assert.strictEqual(summary.currentBalance, '0.00');

    // 3. Attempting to cancel already cancelled advance rejects
    await assert.rejects(
      async () => {
        await advanceService.cancelAdvance({
          advanceId: adv.advance.id,
          fishermanId
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.code, 'ADVANCE_ALREADY_CANCELLED');
        return true;
      }
    );
  });

  test('12. Advance Cancellation Rejection: Rejects cancellation if advance has recoveries/repayments', async () => {
    // Disburse ₹5,000
    const adv = await advanceService.disburseAdvance({
      fishermanId,
      sanctionDate: TEST_DATE,
      amount: '5000.00',
      paymentMethod: AdvancePaymentMethod.CASH
    });

    // Partially repay ₹1,000
    await advanceService.recordCashRepayment({
      fishermanId,
      amount: '1000.00',
      paymentMethod: AdvancePaymentMethod.CASH
    });

    // Attempt to cancel advance -> should reject because recovery/repayment occurred
    await assert.rejects(
      async () => {
        await advanceService.cancelAdvance({
          advanceId: adv.advance.id,
          fishermanId
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.code, 'INVALID_ADVANCE_RECOVERY');
        return true;
      }
    );

    // Clean up remaining ₹4,000
    await advanceService.recordCashRepayment({
      fishermanId,
      amount: '4000.00',
      paymentMethod: AdvancePaymentMethod.CASH
    });
  });

  test('13. Idempotency Protection: Re-submitting mutation with same idempotency key produces exactly one financial transaction', async () => {
    const IDEMP_KEY = `IDEMP_${Date.now()}`;

    // First disbursement
    const first = await advanceService.disburseAdvance({
      fishermanId,
      sanctionDate: TEST_DATE,
      amount: '3000.00',
      paymentMethod: AdvancePaymentMethod.BANK_TRANSFER,
      idempotencyKey: IDEMP_KEY
    });

    // Duplicate disbursement with same idempotency key
    const second = await advanceService.disburseAdvance({
      fishermanId,
      sanctionDate: TEST_DATE,
      amount: '3000.00',
      paymentMethod: AdvancePaymentMethod.BANK_TRANSFER,
      idempotencyKey: IDEMP_KEY
    });

    assert.strictEqual(first.advance.id, second.advance.id);
    assert.strictEqual(first.ledgerEntry.id, second.ledgerEntry.id);
    assert.strictEqual(second.currentBalance, '3000.00');

    // Balance must only be ₹3,000.00, not ₹6,000.00
    const summary = await advanceService.getFishermanAdvanceBalance(fishermanId);
    assert.strictEqual(summary.currentBalance, '3000.00');

    // Duplicate repayment with same idempotency key
    const REPAY_KEY = `REPAY_${Date.now()}`;
    const rep1 = await advanceService.recordCashRepayment({
      fishermanId,
      amount: '3000.00',
      paymentMethod: AdvancePaymentMethod.CASH,
      idempotencyKey: REPAY_KEY
    });

    const rep2 = await advanceService.recordCashRepayment({
      fishermanId,
      amount: '3000.00',
      paymentMethod: AdvancePaymentMethod.CASH,
      idempotencyKey: REPAY_KEY
    });

    assert.strictEqual(rep1.ledgerEntry.id, rep2.ledgerEntry.id);
    assert.strictEqual(rep2.currentBalance, '0.00');
  });

  test('14. Day-End Protection: Rejects mutations on closed business dates', async () => {
    const CLOSED_DATE = '2026-10-25';
    const closedDateObj = DailyRateService.parseDate(CLOSED_DATE);

    let testUser = await prisma.user.findFirst();
    if (!testUser) {
      const role = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
      testUser = await prisma.user.create({
        data: {
          name: 'System DayEnd Test',
          email: `dayend_${Date.now()}@test.com`,
          passwordHash: 'dummyhash',
          roleId: role!.id
        }
      });
    }

    const dayEnd = await prisma.dayEndClosing.upsert({
      where: { businessDate: closedDateObj },
      update: { closingStatus: DayEndStatus.CLOSED },
      create: {
        businessDate: closedDateObj,
        closingStatus: DayEndStatus.CLOSED,
        openingStockKg: '0',
        totalReceivedKg: '0',
        totalSoldKg: '0',
        totalWastageKg: '0',
        totalAdjustedKg: '0',
        expectedClosingStockKg: '0',
        actualPhysicalStockKg: '0',
        stockVarianceKg: '0',
        openingCash: '0',
        cashReceivedSales: '0',
        cashPaidPurchases: '0',
        cashPaidAdvances: '0',
        cashPaidExpenses: '0',
        expectedClosingCash: '0',
        actualPhysicalCash: '0',
        cashVariance: '0',
        closedById: testUser.id
      }
    });

    try {
      await assert.rejects(
        async () => {
          await advanceService.disburseAdvance({
            fishermanId,
            sanctionDate: CLOSED_DATE,
            amount: '1000.00',
            paymentMethod: AdvancePaymentMethod.CASH
          });
        },
        (err: any) => {
          assert.ok(err instanceof AppError);
          assert.strictEqual(err.code, 'DAY_ALREADY_CLOSED');
          return true;
        }
      );
    } finally {
      await prisma.dayEndClosing.delete({ where: { id: dayEnd.id } }).catch(() => {});
    }
  });

  test('15. RBAC Enforcement: Unauthorized (401) and Worker Forbidden (403) on financial endpoints', async () => {
    const app = createApp();
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    const address = server.address() as any;
    const baseUrl = `http://localhost:${address.port}`;

    try {
      // 1. Unauthenticated request -> 401
      const unauthRes = await fetch(`${baseUrl}/api/fisherman-advances/disburse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fishermanId,
          amount: '1000.00',
          paymentMethod: 'CASH'
        })
      });
      assert.strictEqual(unauthRes.status, 401);

      // 2. Worker request -> 403 Forbidden
      const workerToken = signToken({
        id: 'worker-test-id',
        email: 'worker@marlin.com',
        name: 'Worker Bob',
        role: 'WORKER'
      });

      const workerRes = await fetch(`${baseUrl}/api/fisherman-advances/disburse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${workerToken}`
        },
        body: JSON.stringify({
          fishermanId,
          amount: '1000.00',
          paymentMethod: 'CASH'
        })
      });
      assert.strictEqual(workerRes.status, 403);

      // Worker on nested fisherman route -> 403
      const workerNestedRes = await fetch(`${baseUrl}/api/fishermen/${fishermanId}/advances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${workerToken}`
        },
        body: JSON.stringify({
          amount: '1000.00',
          paymentMethod: 'CASH'
        })
      });
      assert.strictEqual(workerNestedRes.status, 403);

      // 3. Admin request -> 201 Created
      let adminUser = await prisma.user.findFirst();
      if (!adminUser) {
        const role = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
        adminUser = await prisma.user.create({
          data: {
            name: 'Admin Alice',
            email: `admin_${Date.now()}@marlin.com`,
            passwordHash: 'dummyhash',
            roleId: role!.id
          }
        });
      }

      const adminToken = signToken({
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: 'ADMIN'
      });

      const adminRes = await fetch(`${baseUrl}/api/fishermen/${fishermanId}/advances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          amount: '2000.00',
          paymentMethod: 'CASH'
        })
      });
      assert.strictEqual(adminRes.status, 201);
      const adminJson = (await adminRes.json()) as any;
      assert.strictEqual(adminJson.success, true);
      assert.strictEqual(adminJson.data.advance.disbursedAmount, '2000.00');

      // Admin can view fisherman advance balance
      const balRes = await fetch(`${baseUrl}/api/fishermen/${fishermanId}/advance-balance`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(balRes.status, 200);
      const balJson = (await balRes.json()) as any;
      assert.strictEqual(balJson.data.currentBalance, '2000.00');

      // Admin can cancel advance via nested route
      const cancelRes = await fetch(`${baseUrl}/api/fishermen/${fishermanId}/advances/${adminJson.data.advance.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ reason: 'Admin void test' })
      });
      assert.strictEqual(cancelRes.status, 200);
      const cancelJson = (await cancelRes.json()) as any;
      assert.strictEqual(cancelJson.data.advance.status, 'CANCELLED');
      assert.strictEqual(cancelJson.data.currentBalance, '0.00');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
