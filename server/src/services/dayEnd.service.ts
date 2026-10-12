import {
  Prisma,
  DayEndStatus,
  StockMovementType,
  PaymentMethod,
  PaymentStatus,
  AdvanceEntryType,
  ExpensePaymentMethod,
  ExpenseStatus,
  SaleStatus,
  PurchaseBillStatus
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/appError';
import { DayEndRepository, DayEndWithRelations } from '../repositories/dayEnd.repository';
import { DailyRateService } from './dailyRate.service';
import { CloseDayInput, ReopenDayInput, DayEndQueryParams } from '../validators/dayEnd.validator';

export interface FormattedDayEndClosing {
  id: string;
  businessDate: string;
  closingStatus: DayEndStatus;
  openingStockKg: string;
  totalReceivedKg: string;
  totalSoldKg: string;
  totalWastageKg: string;
  totalAdjustedKg: string;
  expectedClosingStockKg: string;
  actualPhysicalStockKg: string;
  stockVarianceKg: string;
  openingCash: string;
  cashReceivedSales: string;
  cashPaidPurchases: string;
  cashPaidAdvances: string;
  cashPaidExpenses: string;
  expectedClosingCash: string;
  actualPhysicalCash: string;
  cashVariance: string;
  varianceReason?: string | null;
  closedById: string;
  closedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  closedAt: string;
  reopenedById?: string | null;
  reopenedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  reopenedAt?: string | null;
  reopenReason?: string | null;
}

export interface DayEndPreview {
  businessDate: string;
  status: DayEndStatus;
  reconciliationStatus: 'RECONCILED' | 'DIFFERENCE_EXISTS';
  storedClosing?: FormattedDayEndClosing | null;

  stockSummary: {
    openingStockKg: string;
    totalReceivedKg: string;
    totalSoldKg: string;
    totalWastageKg: string;
    totalAdjustedKg: string;
    expectedClosingStockKg: string;
    actualPhysicalStockKg: string;
    stockVarianceKg: string;
    isStockReconciled: boolean;
    items: Array<{
      seafoodId: string;
      seafoodName: string;
      gradeId: string;
      gradeName: string;
      openingKg: string;
      receivedKg: string;
      soldKg: string;
      wastageKg: string;
      adjustedKg: string;
      expectedClosingKg: string;
      actualPhysicalKg: string;
      varianceKg: string;
    }>;
  };

  cashSummary: {
    openingCash: string;
    cashReceivedSales: string;
    cashReceivedRepayments: string;
    totalCashInflows: string;
    cashPaidPurchases: string;
    cashPaidAdvances: string;
    cashPaidExpenses: string;
    totalCashOutflows: string;
    expectedClosingCash: string;
    actualPhysicalCash: string;
    cashVariance: string;
    isCashReconciled: boolean;
  };

  collectionsSummary: {
    totalBills: number;
    cancelledBills: number;
    grossTotal: string;
    advanceDeducted: string;
    netPayableCash: string;
    cashPaid: string;
    upiPaid: string;
    bankPaid: string;
    outstandingSupplierPayable: string;
  };

  salesSummary: {
    totalSales: number;
    cancelledSales: number;
    grossSales: string;
    domesticSales: string;
    exportSales: string;
    cashCollected: string;
    upiCollected: string;
    bankCollected: string;
    buyerOutstanding: string;
    totalCogs: string;
    grossProfit: string;
  };

  advancesSummary: {
    openingAdvanceBalance: string;
    newAdvancesDisbursed: string;
    advancesRecovered: string;
    cashRepayments: string;
    writeOffs: string;
    reversals: string;
    closingAdvanceBalance: string;
  };

  wastageSummary: {
    totalWastageKg: string;
    totalWastageCost: string;
    eventCount: number;
  };

  expensesSummary: {
    totalOpex: string;
    cashOpex: string;
    upiOpex: string;
    bankOpex: string;
    workerWages: string;
    otherOpex: string;
    byCategory: Array<{
      category: string;
      count: number;
      amount: string;
    }>;
  };
}

export class DayEndService {
  private repo = new DayEndRepository();

  public static formatClosing(closing: DayEndWithRelations): FormattedDayEndClosing {
    const rawDate = closing.businessDate instanceof Date
      ? closing.businessDate.toISOString().split('T')[0]
      : String(closing.businessDate).split('T')[0];

    return {
      id: closing.id,
      businessDate: rawDate,
      closingStatus: closing.closingStatus,
      openingStockKg: new Prisma.Decimal(closing.openingStockKg).toFixed(3),
      totalReceivedKg: new Prisma.Decimal(closing.totalReceivedKg).toFixed(3),
      totalSoldKg: new Prisma.Decimal(closing.totalSoldKg).toFixed(3),
      totalWastageKg: new Prisma.Decimal(closing.totalWastageKg).toFixed(3),
      totalAdjustedKg: new Prisma.Decimal(closing.totalAdjustedKg).toFixed(3),
      expectedClosingStockKg: new Prisma.Decimal(closing.expectedClosingStockKg).toFixed(3),
      actualPhysicalStockKg: new Prisma.Decimal(closing.actualPhysicalStockKg).toFixed(3),
      stockVarianceKg: new Prisma.Decimal(closing.stockVarianceKg).toFixed(3),
      openingCash: new Prisma.Decimal(closing.openingCash).toFixed(2),
      cashReceivedSales: new Prisma.Decimal(closing.cashReceivedSales).toFixed(2),
      cashPaidPurchases: new Prisma.Decimal(closing.cashPaidPurchases).toFixed(2),
      cashPaidAdvances: new Prisma.Decimal(closing.cashPaidAdvances).toFixed(2),
      cashPaidExpenses: new Prisma.Decimal(closing.cashPaidExpenses).toFixed(2),
      expectedClosingCash: new Prisma.Decimal(closing.expectedClosingCash).toFixed(2),
      actualPhysicalCash: new Prisma.Decimal(closing.actualPhysicalCash).toFixed(2),
      cashVariance: new Prisma.Decimal(closing.cashVariance).toFixed(2),
      varianceReason: closing.varianceReason,
      closedById: closing.closedById,
      closedBy: closing.closedBy,
      closedAt: closing.closedAt.toISOString(),
      reopenedById: closing.reopenedById,
      reopenedBy: closing.reopenedBy,
      reopenedAt: closing.reopenedAt ? closing.reopenedAt.toISOString() : null,
      reopenReason: closing.reopenReason
    };
  }

  /**
   * Generates a comprehensive read-only Day-End Preview dynamically calculated from the database.
   */
  async getDayEndPreview(dateStr: string): Promise<DayEndPreview> {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = DailyRateService.parseDate(dateStr);
    const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

    // 1. Check if day-end closing record already exists
    const stored = await this.repo.findByDate(dateObj);

    // 2. Fetch all daily StockMovements for the business date (including referenced bills/sales)
    const [dailyBills, dailySales] = await Promise.all([
      prisma.purchaseBill.findMany({
        where: { billDate: dateObj, deletedAt: null },
        select: { id: true }
      }),
      prisma.sale.findMany({
        where: { saleDate: dateObj, deletedAt: null },
        select: { id: true }
      })
    ]);
    const billIds = dailyBills.map(b => b.id);
    const saleIds = dailySales.map(s => s.id);

    const dailyMovements = await prisma.stockMovement.findMany({
      where: {
        OR: [
          { movementDate: { gte: startOfDay, lte: endOfDay } },
          ...(billIds.length > 0 ? [{ referenceType: 'PURCHASE_BILL', referenceId: { in: billIds } }] : []),
          ...(saleIds.length > 0 ? [{ referenceType: 'SALE', referenceId: { in: saleIds } }] : [])
        ]
      },
      include: {
        seafood: { select: { id: true, name: true } },
        grade: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Fetch all Stock records to cover all current seafood/grades
    const allStocks = await prisma.stock.findMany({
      include: {
        seafood: { select: { id: true, name: true } },
        grade: { select: { id: true, name: true } }
      }
    });

    // Group movements by seafoodId_gradeId
    const itemFlowMap = new Map<string, {
      seafoodId: string;
      seafoodName: string;
      gradeId: string;
      gradeName: string;
      openingKg: Prisma.Decimal;
      receivedKg: Prisma.Decimal;
      soldKg: Prisma.Decimal;
      wastageKg: Prisma.Decimal;
      adjustedKg: Prisma.Decimal;
      actualPhysicalKg: Prisma.Decimal;
    }>();

    for (const stock of allStocks) {
      const key = `${stock.seafoodId}_${stock.gradeId}`;
      itemFlowMap.set(key, {
        seafoodId: stock.seafoodId,
        seafoodName: stock.seafood.name,
        gradeId: stock.gradeId,
        gradeName: stock.grade.name,
        openingKg: new Prisma.Decimal(stock.quantityKg),
        receivedKg: new Prisma.Decimal('0.000'),
        soldKg: new Prisma.Decimal('0.000'),
        wastageKg: new Prisma.Decimal('0.000'),
        adjustedKg: new Prisma.Decimal('0.000'),
        actualPhysicalKg: new Prisma.Decimal(stock.quantityKg)
      });
    }

    // Process movements to determine exact opening, flow, and closing
    const earliestMovementMap = new Map<string, Prisma.Decimal>();

    for (const mov of dailyMovements) {
      const key = `${mov.seafoodId}_${mov.gradeId}`;
      let flow = itemFlowMap.get(key);
      if (!flow) {
        flow = {
          seafoodId: mov.seafoodId,
          seafoodName: mov.seafood.name,
          gradeId: mov.gradeId,
          gradeName: mov.grade.name,
          openingKg: new Prisma.Decimal(mov.balanceBefore),
          receivedKg: new Prisma.Decimal('0.000'),
          soldKg: new Prisma.Decimal('0.000'),
          wastageKg: new Prisma.Decimal('0.000'),
          adjustedKg: new Prisma.Decimal('0.000'),
          actualPhysicalKg: new Prisma.Decimal(mov.balanceAfter)
        };
        itemFlowMap.set(key, flow);
      }

      if (!earliestMovementMap.has(key)) {
        earliestMovementMap.set(key, new Prisma.Decimal(mov.balanceBefore));
        flow.openingKg = new Prisma.Decimal(mov.balanceBefore);
      }

      const qty = new Prisma.Decimal(mov.quantityKg);

      if (mov.movementType === StockMovementType.PURCHASE || mov.movementType === StockMovementType.RETURN) {
        flow.receivedKg = flow.receivedKg.add(qty.abs());
      } else if (mov.movementType === StockMovementType.SALE || mov.movementType === StockMovementType.EXPORT) {
        flow.soldKg = flow.soldKg.add(qty.abs());
      } else if (mov.movementType === StockMovementType.WASTE) {
        flow.wastageKg = flow.wastageKg.add(qty.abs());
      } else if (mov.movementType === StockMovementType.ADJUSTMENT) {
        flow.adjustedKg = flow.adjustedKg.add(qty);
      }
    }

    let totalOpeningStockKg = new Prisma.Decimal('0.000');
    let totalReceivedKg = new Prisma.Decimal('0.000');
    let totalSoldKg = new Prisma.Decimal('0.000');
    let totalWastageKg = new Prisma.Decimal('0.000');
    let totalAdjustedKg = new Prisma.Decimal('0.000');
    let totalExpectedStockKg = new Prisma.Decimal('0.000');
    let totalActualPhysicalStockKg = new Prisma.Decimal('0.000');

    const itemDetails: DayEndPreview['stockSummary']['items'] = [];

    for (const flow of itemFlowMap.values()) {
      const expClosing = flow.openingKg
        .add(flow.receivedKg)
        .sub(flow.soldKg)
        .sub(flow.wastageKg)
        .add(flow.adjustedKg)
        .toDecimalPlaces(3, Prisma.Decimal.ROUND_HALF_UP);

      const variance = flow.actualPhysicalKg.sub(expClosing).toDecimalPlaces(3, Prisma.Decimal.ROUND_HALF_UP);

      totalOpeningStockKg = totalOpeningStockKg.add(flow.openingKg);
      totalReceivedKg = totalReceivedKg.add(flow.receivedKg);
      totalSoldKg = totalSoldKg.add(flow.soldKg);
      totalWastageKg = totalWastageKg.add(flow.wastageKg);
      totalAdjustedKg = totalAdjustedKg.add(flow.adjustedKg);
      totalExpectedStockKg = totalExpectedStockKg.add(expClosing);
      totalActualPhysicalStockKg = totalActualPhysicalStockKg.add(flow.actualPhysicalKg);

      itemDetails.push({
        seafoodId: flow.seafoodId,
        seafoodName: flow.seafoodName,
        gradeId: flow.gradeId,
        gradeName: flow.gradeName,
        openingKg: flow.openingKg.toFixed(3),
        receivedKg: flow.receivedKg.toFixed(3),
        soldKg: flow.soldKg.toFixed(3),
        wastageKg: flow.wastageKg.toFixed(3),
        adjustedKg: flow.adjustedKg.toFixed(3),
        expectedClosingKg: expClosing.toFixed(3),
        actualPhysicalKg: flow.actualPhysicalKg.toFixed(3),
        varianceKg: variance.toFixed(3)
      });
    }

    const stockVarianceKg = totalActualPhysicalStockKg.sub(totalExpectedStockKg).toDecimalPlaces(3, Prisma.Decimal.ROUND_HALF_UP);

    // 3. Daily Cash Flow Calculations
    // Opening cash from previous closed day or 0.00
    const prevClosedDay = await this.repo.findPreviousClosedDay(dateObj);
    const openingCash = prevClosedDay
      ? new Prisma.Decimal(prevClosedDay.actualPhysicalCash || prevClosedDay.expectedClosingCash)
      : new Prisma.Decimal('0.00');

    // A. Cash Sales Collections
    const cashSalesPayments = await prisma.payment.findMany({
      where: {
        saleId: { not: null },
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_PAID] },
        OR: [
          { paymentDate: { gte: startOfDay, lte: endOfDay } },
          { sale: { saleDate: dateObj } }
        ]
      }
    });
    const cashReceivedSales = cashSalesPayments.reduce(
      (acc, p) => acc.add(new Prisma.Decimal(p.amount)),
      new Prisma.Decimal('0.00')
    );

    // B. Fisherman Cash Repayments
    const advanceRepaymentEntries = await prisma.fishermanAdvanceLedger.findMany({
      where: {
        entryType: AdvanceEntryType.CASH_REPAYMENT,
        createdAt: { gte: startOfDay, lte: endOfDay }
      }
    });
    const cashReceivedRepayments = advanceRepaymentEntries.reduce(
      (acc, e) => acc.add(new Prisma.Decimal(e.amount)),
      new Prisma.Decimal('0.00')
    );

    // C. Supplier Catch Cash Payments
    const cashPurchasePayments = await prisma.payment.findMany({
      where: {
        purchaseBillId: { not: null },
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_PAID] },
        OR: [
          { paymentDate: { gte: startOfDay, lte: endOfDay } },
          { purchaseBill: { billDate: dateObj } }
        ]
      }
    });
    const cashPaidPurchases = cashPurchasePayments.reduce(
      (acc, p) => acc.add(new Prisma.Decimal(p.amount)),
      new Prisma.Decimal('0.00')
    );

    // D. Fisherman Advance Cash Disbursements
    const cashAdvances = await prisma.fishermanAdvance.findMany({
      where: {
        paymentMethod: 'CASH',
        status: { not: 'CANCELLED' },
        sanctionDate: dateObj
      }
    });
    const cashPaidAdvances = cashAdvances.reduce(
      (acc, a) => acc.add(new Prisma.Decimal(a.disbursedAmount)),
      new Prisma.Decimal('0.00')
    );

    // E. Operational Cash Expenses
    const cashExpenses = await prisma.expense.findMany({
      where: {
        paymentMethod: ExpensePaymentMethod.CASH,
        status: ExpenseStatus.RECORDED,
        expenseDate: dateObj
      }
    });
    const cashPaidExpenses = cashExpenses.reduce(
      (acc, e) => acc.add(new Prisma.Decimal(e.amount)),
      new Prisma.Decimal('0.00')
    );

    const totalCashInflows = cashReceivedSales.add(cashReceivedRepayments);
    const totalCashOutflows = cashPaidPurchases.add(cashPaidAdvances).add(cashPaidExpenses);
    const expectedClosingCash = openingCash
      .add(totalCashInflows)
      .sub(totalCashOutflows)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const actualPhysicalCash = stored
      ? new Prisma.Decimal(stored.actualPhysicalCash)
      : expectedClosingCash;
    const cashVariance = actualPhysicalCash.sub(expectedClosingCash).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    // 4. Daily Collections / Purchase Bills Summary
    const purchaseBills = await prisma.purchaseBill.findMany({
      where: { billDate: dateObj },
      include: { payments: true }
    });

    let pbGrossTotal = new Prisma.Decimal('0.00');
    let pbAdvanceDeducted = new Prisma.Decimal('0.00');
    let pbNetPayableCash = new Prisma.Decimal('0.00');
    let pbCashPaid = new Prisma.Decimal('0.00');
    let pbUpiPaid = new Prisma.Decimal('0.00');
    let pbBankPaid = new Prisma.Decimal('0.00');
    let activePbCount = 0;
    let cancelledPbCount = 0;

    for (const b of purchaseBills) {
      if (b.status === PurchaseBillStatus.CANCELLED) {
        cancelledPbCount++;
        continue;
      }
      activePbCount++;
      pbGrossTotal = pbGrossTotal.add(new Prisma.Decimal(b.grandTotal));
      pbAdvanceDeducted = pbAdvanceDeducted.add(new Prisma.Decimal(b.advanceDeducted));
      pbNetPayableCash = pbNetPayableCash.add(new Prisma.Decimal(b.netPayableCash));

      for (const p of b.payments) {
        if (p.paymentStatus === PaymentStatus.CANCELLED) continue;
        const pAmt = new Prisma.Decimal(p.amount);
        if (p.paymentMethod === PaymentMethod.CASH) pbCashPaid = pbCashPaid.add(pAmt);
        else if (p.paymentMethod === PaymentMethod.UPI) pbUpiPaid = pbUpiPaid.add(pAmt);
        else if (p.paymentMethod === PaymentMethod.BANK_TRANSFER) pbBankPaid = pbBankPaid.add(pAmt);
      }
    }

    const totalSupplierPayments = pbCashPaid.add(pbUpiPaid).add(pbBankPaid);
    const outstandingSupplierPayable = pbNetPayableCash.sub(totalSupplierPayments).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    // 5. Sales & POS Summary
    const sales = await prisma.sale.findMany({
      where: { saleDate: dateObj },
      include: { payments: true, items: true }
    });

    let sGrossSales = new Prisma.Decimal('0.00');
    let sCashCollected = new Prisma.Decimal('0.00');
    let sUpiCollected = new Prisma.Decimal('0.00');
    let sBankCollected = new Prisma.Decimal('0.00');
    let sTotalCogs = new Prisma.Decimal('0.00');
    let sGrossProfit = new Prisma.Decimal('0.00');
    let sDomesticSales = new Prisma.Decimal('0.00');
    let sExportSales = new Prisma.Decimal('0.00');
    let activeSalesCount = 0;
    let cancelledSalesCount = 0;

    for (const s of sales) {
      if (s.status === SaleStatus.CANCELLED) {
        cancelledSalesCount++;
        continue;
      }
      activeSalesCount++;
      const sGrandTotal = new Prisma.Decimal(s.grandTotal);
      sGrossSales = sGrossSales.add(sGrandTotal);
      sTotalCogs = sTotalCogs.add(new Prisma.Decimal(s.totalCogs || 0));
      sGrossProfit = sGrossProfit.add(new Prisma.Decimal(s.totalGrossProfit || 0));

      if (s.saleType === 'EXPORT') {
        sExportSales = sExportSales.add(sGrandTotal);
      } else {
        sDomesticSales = sDomesticSales.add(sGrandTotal);
      }

      for (const p of s.payments) {
        if (p.paymentStatus === PaymentStatus.CANCELLED) continue;
        const pAmt = new Prisma.Decimal(p.amount);
        if (p.paymentMethod === PaymentMethod.CASH) sCashCollected = sCashCollected.add(pAmt);
        else if (p.paymentMethod === PaymentMethod.UPI) sUpiCollected = sUpiCollected.add(pAmt);
        else if (p.paymentMethod === PaymentMethod.BANK_TRANSFER) sBankCollected = sBankCollected.add(pAmt);
      }
    }

    const totalBuyerCollections = sCashCollected.add(sUpiCollected).add(sBankCollected);
    const buyerOutstanding = sGrossSales.sub(totalBuyerCollections).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    // 6. Fisherman Advances Summary
    const dailyLedgerEntries = await prisma.fishermanAdvanceLedger.findMany({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } }
    });

    let advDisbursed = new Prisma.Decimal('0.00');
    let advRecovered = new Prisma.Decimal('0.00');
    let advRepaid = new Prisma.Decimal('0.00');
    let advWrittenOff = new Prisma.Decimal('0.00');
    let advReversed = new Prisma.Decimal('0.00');

    for (const le of dailyLedgerEntries) {
      const amt = new Prisma.Decimal(le.amount);
      if (le.entryType === AdvanceEntryType.DISBURSEMENT) advDisbursed = advDisbursed.add(amt);
      else if (le.entryType === AdvanceEntryType.RECOVERY_DEDUCTION) advRecovered = advRecovered.add(amt);
      else if (le.entryType === AdvanceEntryType.CASH_REPAYMENT) advRepaid = advRepaid.add(amt);
      else if (le.entryType === AdvanceEntryType.WRITE_OFF) advWrittenOff = advWrittenOff.add(amt);
      else if (le.entryType === AdvanceEntryType.RECOVERY_REVERSAL) advReversed = advReversed.add(amt);
    }

    // Historical advance balance before startOfDay
    const priorLedger = await prisma.fishermanAdvanceLedger.findMany({
      where: { createdAt: { lt: startOfDay } },
      distinct: ['fishermanId'],
      orderBy: [{ fishermanId: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }]
    });
    const openingAdvanceBalance = priorLedger.reduce(
      (acc, l) => acc.add(new Prisma.Decimal(l.balanceAfter)),
      new Prisma.Decimal('0.00')
    );
    const closingAdvanceBalance = openingAdvanceBalance
      .add(advDisbursed)
      .sub(advRecovered)
      .sub(advRepaid)
      .sub(advWrittenOff)
      .add(advReversed)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    // 7. Wastage Summary
    const wastageMovements = dailyMovements.filter((m) => m.movementType === StockMovementType.WASTE);
    const totalWastageKgSummary = wastageMovements.reduce(
      (acc, m) => acc.add(new Prisma.Decimal(m.quantityKg).abs()),
      new Prisma.Decimal('0.000')
    );
    const totalWastageCostSummary = wastageMovements.reduce(
      (acc, m) => acc.add(new Prisma.Decimal(m.totalCost || 0)),
      new Prisma.Decimal('0.00')
    );

    // 8. Operating Expenses Summary
    const expenses = await prisma.expense.findMany({
      where: { expenseDate: dateObj, status: ExpenseStatus.RECORDED }
    });

    let totalOpex = new Prisma.Decimal('0.00');
    let cashOpex = new Prisma.Decimal('0.00');
    let upiOpex = new Prisma.Decimal('0.00');
    let bankOpex = new Prisma.Decimal('0.00');
    let workerWages = new Prisma.Decimal('0.00');
    const catMap = new Map<string, { count: number; amount: Prisma.Decimal }>();

    for (const exp of expenses) {
      const amt = new Prisma.Decimal(exp.amount);
      totalOpex = totalOpex.add(amt);
      if (exp.paymentMethod === ExpensePaymentMethod.CASH) cashOpex = cashOpex.add(amt);
      else if (exp.paymentMethod === ExpensePaymentMethod.UPI) upiOpex = upiOpex.add(amt);
      else if (exp.paymentMethod === ExpensePaymentMethod.BANK_TRANSFER) bankOpex = bankOpex.add(amt);

      if (exp.category === 'WORKER_WAGE' || exp.category === 'COOLIE_WAGES') {
        workerWages = workerWages.add(amt);
      }

      const currentCat = catMap.get(exp.category) || { count: 0, amount: new Prisma.Decimal('0.00') };
      currentCat.count++;
      currentCat.amount = currentCat.amount.add(amt);
      catMap.set(exp.category, currentCat);
    }

    const isStockReconciled = stockVarianceKg.isZero();
    const isCashReconciled = cashVariance.isZero();
    const reconciliationStatus = isStockReconciled && isCashReconciled ? 'RECONCILED' : 'DIFFERENCE_EXISTS';
    const status = stored ? stored.closingStatus : DayEndStatus.OPEN;

    return {
      businessDate: dateStr,
      status,
      reconciliationStatus,
      storedClosing: stored ? DayEndService.formatClosing(stored) : null,
      stockSummary: {
        openingStockKg: totalOpeningStockKg.toFixed(3),
        totalReceivedKg: totalReceivedKg.toFixed(3),
        totalSoldKg: totalSoldKg.toFixed(3),
        totalWastageKg: totalWastageKg.toFixed(3),
        totalAdjustedKg: totalAdjustedKg.toFixed(3),
        expectedClosingStockKg: totalExpectedStockKg.toFixed(3),
        actualPhysicalStockKg: totalActualPhysicalStockKg.toFixed(3),
        stockVarianceKg: stockVarianceKg.toFixed(3),
        isStockReconciled,
        items: itemDetails
      },
      cashSummary: {
        openingCash: openingCash.toFixed(2),
        cashReceivedSales: cashReceivedSales.toFixed(2),
        cashReceivedRepayments: cashReceivedRepayments.toFixed(2),
        totalCashInflows: totalCashInflows.toFixed(2),
        cashPaidPurchases: cashPaidPurchases.toFixed(2),
        cashPaidAdvances: cashPaidAdvances.toFixed(2),
        cashPaidExpenses: cashPaidExpenses.toFixed(2),
        totalCashOutflows: totalCashOutflows.toFixed(2),
        expectedClosingCash: expectedClosingCash.toFixed(2),
        actualPhysicalCash: actualPhysicalCash.toFixed(2),
        cashVariance: cashVariance.toFixed(2),
        isCashReconciled
      },
      collectionsSummary: {
        totalBills: activePbCount,
        cancelledBills: cancelledPbCount,
        grossTotal: pbGrossTotal.toFixed(2),
        advanceDeducted: pbAdvanceDeducted.toFixed(2),
        netPayableCash: pbNetPayableCash.toFixed(2),
        cashPaid: pbCashPaid.toFixed(2),
        upiPaid: pbUpiPaid.toFixed(2),
        bankPaid: pbBankPaid.toFixed(2),
        outstandingSupplierPayable: outstandingSupplierPayable.toFixed(2)
      },
      salesSummary: {
        totalSales: activeSalesCount,
        cancelledSales: cancelledSalesCount,
        grossSales: sGrossSales.toFixed(2),
        domesticSales: sDomesticSales.toFixed(2),
        exportSales: sExportSales.toFixed(2),
        cashCollected: sCashCollected.toFixed(2),
        upiCollected: sUpiCollected.toFixed(2),
        bankCollected: sBankCollected.toFixed(2),
        buyerOutstanding: buyerOutstanding.toFixed(2),
        totalCogs: sTotalCogs.toFixed(2),
        grossProfit: sGrossProfit.toFixed(2)
      },
      advancesSummary: {
        openingAdvanceBalance: openingAdvanceBalance.toFixed(2),
        newAdvancesDisbursed: advDisbursed.toFixed(2),
        advancesRecovered: advRecovered.toFixed(2),
        cashRepayments: advRepaid.toFixed(2),
        writeOffs: advWrittenOff.toFixed(2),
        reversals: advReversed.toFixed(2),
        closingAdvanceBalance: closingAdvanceBalance.toFixed(2)
      },
      wastageSummary: {
        totalWastageKg: totalWastageKgSummary.toFixed(3),
        totalWastageCost: totalWastageCostSummary.toFixed(2),
        eventCount: wastageMovements.length
      },
      expensesSummary: {
        totalOpex: totalOpex.toFixed(2),
        cashOpex: cashOpex.toFixed(2),
        upiOpex: upiOpex.toFixed(2),
        bankOpex: bankOpex.toFixed(2),
        workerWages: workerWages.toFixed(2),
        otherOpex: totalOpex.sub(workerWages).toFixed(2),
        byCategory: Array.from(catMap.entries()).map(([category, stats]) => ({
          category,
          count: stats.count,
          amount: stats.amount.toFixed(2)
        }))
      }
    };
  }

  /**
   * Finalizes and closes the business date, creating an authoritative immutable snapshot.
   */
  async closeDay(dateStr: string, input: CloseDayInput, userId: string): Promise<FormattedDayEndClosing> {
    const dateObj = DailyRateService.parseDate(dateStr);

    // 1. Compute authoritative figures directly from PostgreSQL before transaction
    const preview = await this.getDayEndPreview(dateStr);

    return prisma.$transaction(
      async (tx) => {
        // 1. Transaction-level advisory lock serializes closing attempts for this business date
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`DAY_END_${dateStr}`}))`;

        // 2. Concurrency & duplicate closing protection check
        const existing = await tx.dayEndClosing.findUnique({
          where: { businessDate: dateObj }
        });

        if (existing && existing.closingStatus === DayEndStatus.CLOSED) {
          throw AppError.badRequest(
            `Business date ${dateStr} is already closed by day-end closing`,
            'DAY_ALREADY_CLOSED'
          );
        }

      const openingStockKgDec = new Prisma.Decimal(preview.stockSummary.openingStockKg);
      const totalReceivedKgDec = new Prisma.Decimal(preview.stockSummary.totalReceivedKg);
      const totalSoldKgDec = new Prisma.Decimal(preview.stockSummary.totalSoldKg);
      const totalWastageKgDec = new Prisma.Decimal(preview.stockSummary.totalWastageKg);
      const totalAdjustedKgDec = new Prisma.Decimal(preview.stockSummary.totalAdjustedKg);
      const expectedClosingStockKgDec = new Prisma.Decimal(preview.stockSummary.expectedClosingStockKg);

      const actualPhysicalStockKgDec = input.actualPhysicalStockKg !== undefined
        ? new Prisma.Decimal(input.actualPhysicalStockKg).toDecimalPlaces(3, Prisma.Decimal.ROUND_HALF_UP)
        : expectedClosingStockKgDec;

      const stockVarianceKgDec = actualPhysicalStockKgDec.sub(expectedClosingStockKgDec).toDecimalPlaces(3, Prisma.Decimal.ROUND_HALF_UP);

      const openingCashDec = input.openingCash !== undefined
        ? new Prisma.Decimal(input.openingCash).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        : new Prisma.Decimal(preview.cashSummary.openingCash);

      const cashReceivedSalesDec = new Prisma.Decimal(preview.cashSummary.cashReceivedSales);
      const cashPaidPurchasesDec = new Prisma.Decimal(preview.cashSummary.cashPaidPurchases);
      const cashPaidAdvancesDec = new Prisma.Decimal(preview.cashSummary.cashPaidAdvances);
      const cashPaidExpensesDec = new Prisma.Decimal(preview.cashSummary.cashPaidExpenses);
      const cashReceivedRepaymentsDec = new Prisma.Decimal(preview.cashSummary.cashReceivedRepayments);

      const expectedClosingCashDec = openingCashDec
        .add(cashReceivedSalesDec)
        .add(cashReceivedRepaymentsDec)
        .sub(cashPaidPurchasesDec)
        .sub(cashPaidAdvancesDec)
        .sub(cashPaidExpensesDec)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      const actualPhysicalCashDec = input.actualPhysicalCash !== undefined
        ? new Prisma.Decimal(input.actualPhysicalCash).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        : expectedClosingCashDec;

      const cashVarianceDec = actualPhysicalCashDec.sub(expectedClosingCashDec).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      // 4. Reconciliation check: If differences exist, require a mandatory explanation reason
      const hasDifference = !cashVarianceDec.isZero() || !stockVarianceKgDec.isZero();
      if (hasDifference && (!input.varianceReason || input.varianceReason.trim().length === 0)) {
        throw AppError.badRequest(
          `Reconciliation variance exists (Cash: ₹${cashVarianceDec.toFixed(2)}, Stock: ${stockVarianceKgDec.toFixed(3)} KG). A variance explanation reason is mandatory to close the day.`,
          'RECONCILIATION_REASON_REQUIRED',
          {
            cashVariance: cashVarianceDec.toFixed(2),
            stockVarianceKg: stockVarianceKgDec.toFixed(3)
          }
        );
      }

      // 5. Store snapshot in DayEndClosing
      const closed = await tx.dayEndClosing.upsert({
        where: { businessDate: dateObj },
        create: {
          businessDate: dateObj,
          closingStatus: DayEndStatus.CLOSED,
          openingStockKg: openingStockKgDec,
          totalReceivedKg: totalReceivedKgDec,
          totalSoldKg: totalSoldKgDec,
          totalWastageKg: totalWastageKgDec,
          totalAdjustedKg: totalAdjustedKgDec,
          expectedClosingStockKg: expectedClosingStockKgDec,
          actualPhysicalStockKg: actualPhysicalStockKgDec,
          stockVarianceKg: stockVarianceKgDec,
          openingCash: openingCashDec,
          cashReceivedSales: cashReceivedSalesDec,
          cashPaidPurchases: cashPaidPurchasesDec,
          cashPaidAdvances: cashPaidAdvancesDec,
          cashPaidExpenses: cashPaidExpensesDec,
          expectedClosingCash: expectedClosingCashDec,
          actualPhysicalCash: actualPhysicalCashDec,
          cashVariance: cashVarianceDec,
          varianceReason: input.varianceReason ? input.varianceReason.trim() : null,
          closedById: userId,
          closedAt: new Date(),
          reopenedById: null,
          reopenedAt: null,
          reopenReason: null
        },
        update: {
          closingStatus: DayEndStatus.CLOSED,
          openingStockKg: openingStockKgDec,
          totalReceivedKg: totalReceivedKgDec,
          totalSoldKg: totalSoldKgDec,
          totalWastageKg: totalWastageKgDec,
          totalAdjustedKg: totalAdjustedKgDec,
          expectedClosingStockKg: expectedClosingStockKgDec,
          actualPhysicalStockKg: actualPhysicalStockKgDec,
          stockVarianceKg: stockVarianceKgDec,
          openingCash: openingCashDec,
          cashReceivedSales: cashReceivedSalesDec,
          cashPaidPurchases: cashPaidPurchasesDec,
          cashPaidAdvances: cashPaidAdvancesDec,
          cashPaidExpenses: cashPaidExpensesDec,
          expectedClosingCash: expectedClosingCashDec,
          actualPhysicalCash: actualPhysicalCashDec,
          cashVariance: cashVarianceDec,
          varianceReason: input.varianceReason ? input.varianceReason.trim() : null,
          closedById: userId,
          closedAt: new Date(),
          reopenedById: null,
          reopenedAt: null,
          reopenReason: null
        },
        include: {
          closedBy: { select: { id: true, name: true, email: true } },
          reopenedBy: { select: { id: true, name: true, email: true } }
        }
      });

      return DayEndService.formatClosing(closed);
    },
    {
      maxWait: 15000,
      timeout: 60000
    });
  }

  /**
   * Reopens a closed business date (Admin only) with mandatory audit reason.
   */
  async reopenDay(dateStr: string, input: ReopenDayInput, userId: string): Promise<FormattedDayEndClosing> {
    const dateObj = DailyRateService.parseDate(dateStr);

    return prisma.$transaction(
      async (tx) => {
        // Transaction-level advisory lock serializes reopen attempts
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`DAY_END_${dateStr}`}))`;

        const existing = await tx.dayEndClosing.findUnique({
          where: { businessDate: dateObj },
          include: {
            closedBy: { select: { id: true, name: true, email: true } },
            reopenedBy: { select: { id: true, name: true, email: true } }
          }
        });

        if (!existing || existing.closingStatus !== DayEndStatus.CLOSED) {
          throw AppError.badRequest(
            `Business date ${dateStr} is not closed`,
            'DAY_NOT_CLOSED'
          );
        }

        const reopened = await tx.dayEndClosing.update({
          where: { businessDate: dateObj },
          data: {
            closingStatus: DayEndStatus.REOPENED,
            reopenedById: userId,
            reopenedAt: new Date(),
            reopenReason: input.reason.trim()
          },
          include: {
            closedBy: { select: { id: true, name: true, email: true } },
            reopenedBy: { select: { id: true, name: true, email: true } }
          }
        });

        return DayEndService.formatClosing(reopened);
      },
      {
        maxWait: 15000,
        timeout: 60000
      }
    );
  }

  /**
   * Retrieves closing record for a date (or dynamic preview if open).
   */
  async getDayEndRecord(dateStr: string): Promise<{
    isClosed: boolean;
    closing?: FormattedDayEndClosing | null;
    preview?: DayEndPreview;
  }> {
    const dateObj = DailyRateService.parseDate(dateStr);
    const existing = await this.repo.findByDate(dateObj);

    if (existing && existing.closingStatus === DayEndStatus.CLOSED) {
      return {
        isClosed: true,
        closing: DayEndService.formatClosing(existing)
      };
    }

    const preview = await this.getDayEndPreview(dateStr);
    return {
      isClosed: false,
      closing: existing ? DayEndService.formatClosing(existing) : null,
      preview
    };
  }

  /**
   * Lists historical day-end closing records.
   */
  async listDayEnds(params: DayEndQueryParams): Promise<{
    items: FormattedDayEndClosing[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.DayEndClosingWhereInput = {};

    if (params.status) {
      where.closingStatus = params.status;
    }

    if (params.fromDate || params.toDate) {
      where.businessDate = {};
      if (params.fromDate) where.businessDate.gte = DailyRateService.parseDate(params.fromDate);
      if (params.toDate) where.businessDate.lte = DailyRateService.parseDate(params.toDate);
    }

    const [items, total] = await Promise.all([
      this.repo.findMany({ skip, take: limit, where }),
      this.repo.count(where)
    ]);

    return {
      items: items.map(DayEndService.formatClosing),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}
