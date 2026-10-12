import {
  Prisma,
  SaleStatus,
  ExpenseStatus,
  StockMovementType,
  DayEndStatus,
  ExpenseCategory
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/appError';
import { DailyRateService } from './dailyRate.service';

export interface PnlSummary {
  period: {
    startDate: string;
    endDate: string;
    isSingleDay: boolean;
  };
  revenue: {
    grossSales: string;
    totalDiscount: string;
    netRevenue: string;
    totalKgSold: string;
    completedSalesCount: number;
  };
  cogs: {
    totalCogs: string;
    averageCogsPerKg: string;
  };
  grossProfit: {
    grossProfit: string;
    grossMarginPercent: string;
  };
  wastage: {
    totalWastageKg: string;
    wastageCost: string;
  };
  operatingExpenses: {
    totalExpenses: string;
    workerWages: string;
    otherExpenses: string;
    expensesCount: number;
  };
  operatingProfit: {
    operatingProfit: string;
    operatingMarginPercent: string;
  };
  dayEndStatus?: {
    isClosed: boolean;
    closingStatus?: DayEndStatus | null;
  };
}

export interface SeafoodBreakdownItem {
  seafoodId: string;
  seafoodName: string;
  categoryName: string;
  totalKg: string;
  revenue: string;
  cogs: string;
  grossProfit: string;
  grossMarginPercent: string;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  totalKg: string;
  revenue: string;
  cogs: string;
  grossProfit: string;
  grossMarginPercent: string;
}

export interface GradeBreakdownItem {
  gradeId: string;
  gradeName: string;
  totalKg: string;
  revenue: string;
  cogs: string;
  grossProfit: string;
  grossMarginPercent: string;
}

export interface CustomerBreakdownItem {
  customerId: string;
  customerName: string;
  salesCount: number;
  totalKg: string;
  revenue: string;
  cogs: string;
  grossProfit: string;
  grossMarginPercent: string;
}

export interface ExportCompanyBreakdownItem {
  exportCompanyId: string;
  companyName: string;
  salesCount: number;
  totalKg: string;
  revenue: string;
  cogs: string;
  grossProfit: string;
  grossMarginPercent: string;
}

export interface ExpenseBreakdownItem {
  category: ExpenseCategory;
  categoryName: string;
  amount: string;
  percentageOfOpex: string;
  count: number;
}

export interface DailyBreakdownItem {
  date: string;
  revenue: string;
  cogs: string;
  grossProfit: string;
  grossMarginPercent: string;
  wastageCost: string;
  operatingExpenses: string;
  operatingProfit: string;
  operatingMarginPercent: string;
  isClosed: boolean;
}

export interface SaleTypeBreakdownItem {
  saleType: string;
  salesCount: number;
  totalKg: string;
  revenue: string;
  cogs: string;
  grossProfit: string;
  grossMarginPercent: string;
}

export interface PnlReport extends PnlSummary {
  breakdowns?: {
    daily?: DailyBreakdownItem[];
    bySaleType?: SaleTypeBreakdownItem[];
    bySeafood?: SeafoodBreakdownItem[];
    byCategory?: CategoryBreakdownItem[];
    byGrade?: GradeBreakdownItem[];
    byCustomer?: CustomerBreakdownItem[];
    byExportCompany?: ExportCompanyBreakdownItem[];
    byExpenseCategory?: ExpenseBreakdownItem[];
  };
}

export class PnlService {
  private static formatMoney(val: Prisma.Decimal | number | string): string {
    return new Prisma.Decimal(val).toFixed(2);
  }

  private static formatKg(val: Prisma.Decimal | number | string): string {
    return new Prisma.Decimal(val).toFixed(3);
  }

  private static calculateMargin(profit: Prisma.Decimal, revenue: Prisma.Decimal): string {
    if (revenue.isZero() || revenue.lessThan(0)) {
      return '0.00';
    }
    return profit.div(revenue).mul(100).toFixed(2);
  }

  private static humanizeCategory(category: ExpenseCategory): string {
    switch (category) {
      case 'WORKER_WAGE':
        return 'Worker Wage';
      case 'COOLIE_WAGES':
        return 'Coolie Wages';
      case 'SALARY':
        return 'Salary';
      case 'ICE':
        return 'Ice';
      case 'DIESEL_FUEL':
        return 'Diesel Fuel';
      case 'FUEL':
        return 'Fuel';
      case 'TRANSPORT':
        return 'Transport';
      case 'PACKING':
        return 'Packing';
      case 'PACKAGING':
        return 'Packaging';
      case 'LOADING_UNLOADING':
        return 'Loading / Unloading';
      case 'ELECTRICITY':
        return 'Electricity';
      case 'RENT':
        return 'Rent';
      case 'MAINTENANCE':
        return 'Maintenance';
      case 'CLEANING':
        return 'Cleaning';
      case 'OFFICE':
        return 'Office';
      case 'OTHER':
      default:
        return 'Other Operational Expenses';
    }
  }

  /**
   * Internal Core Calculation Engine for P&L across a specified Date Range.
   */
  private async calculatePeriodPnl(
    startDateStr: string,
    endDateStr: string,
    isSingleDay: boolean
  ): Promise<PnlReport> {
    const startDateObj = DailyRateService.parseDate(startDateStr);
    const endDateObj = DailyRateService.parseDate(endDateStr);

    if (startDateObj > endDateObj) {
      throw AppError.badRequest('Start date must be less than or equal to end date', 'INVALID_DATE_RANGE');
    }

    // Boundary for timestamped StockMovement table
    const startDateTime = new Date(
      Date.UTC(
        startDateObj.getUTCFullYear(),
        startDateObj.getUTCMonth(),
        startDateObj.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );
    const endDateTime = new Date(
      Date.UTC(
        endDateObj.getUTCFullYear(),
        endDateObj.getUTCMonth(),
        endDateObj.getUTCDate(),
        23,
        59,
        59,
        999
      )
    );

    // 1. Fetch Authoritative Completed Sales
    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDateObj,
          lte: endDateObj
        },
        status: SaleStatus.COMPLETED
      },
      include: {
        customer: { select: { id: true, name: true } },
        exportCompany: { select: { id: true, companyName: true } },
        items: {
          include: {
            seafood: {
              select: {
                id: true,
                name: true,
                category: { select: { id: true, name: true } }
              }
            },
            grade: { select: { id: true, name: true } }
          }
        }
      }
    });

    // 2. Fetch Authoritative Wastage Stock Movements
    const stockMovements = await prisma.stockMovement.findMany({
      where: {
        movementDate: {
          gte: startDateTime,
          lte: endDateTime
        },
        OR: [
          { movementType: StockMovementType.WASTE },
          {
            movementType: StockMovementType.RETURN,
            referenceType: { in: ['WASTAGE', 'WASTAGE_REVERSAL'] }
          }
        ]
      }
    });

    // 3. Fetch Authoritative Recorded Operating Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startDateObj,
          lte: endDateObj
        },
        status: ExpenseStatus.RECORDED
      }
    });

    // 4. Fetch Day End status
    const dayEndClosings = await prisma.dayEndClosing.findMany({
      where: {
        businessDate: {
          gte: startDateObj,
          lte: endDateObj
        }
      }
    });
    const closedDateSet = new Set(
      dayEndClosings
        .filter((d) => d.closingStatus === DayEndStatus.CLOSED)
        .map((d) => DailyRateService.formatDate(d.businessDate))
    );

    // ----------------------------------------------------
    // Revenue & COGS Computations
    // ----------------------------------------------------
    let grossSales = new Prisma.Decimal('0.00');
    let totalDiscount = new Prisma.Decimal('0.00');
    let netRevenue = new Prisma.Decimal('0.00');
    let totalKgSold = new Prisma.Decimal('0.000');
    let totalCogs = new Prisma.Decimal('0.00');

    // Mappings for breakdowns
    const seafoodMap = new Map<
      string,
      {
        seafoodId: string;
        seafoodName: string;
        categoryName: string;
        totalKg: Prisma.Decimal;
        revenue: Prisma.Decimal;
        cogs: Prisma.Decimal;
      }
    >();

    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        totalKg: Prisma.Decimal;
        revenue: Prisma.Decimal;
        cogs: Prisma.Decimal;
      }
    >();

    const gradeMap = new Map<
      string,
      {
        gradeId: string;
        gradeName: string;
        totalKg: Prisma.Decimal;
        revenue: Prisma.Decimal;
        cogs: Prisma.Decimal;
      }
    >();

    const customerMap = new Map<
      string,
      {
        customerId: string;
        customerName: string;
        salesCount: number;
        totalKg: Prisma.Decimal;
        revenue: Prisma.Decimal;
        cogs: Prisma.Decimal;
      }
    >();

    const exportCompanyMap = new Map<
      string,
      {
        exportCompanyId: string;
        companyName: string;
        salesCount: number;
        totalKg: Prisma.Decimal;
        revenue: Prisma.Decimal;
        cogs: Prisma.Decimal;
      }
    >();

    const saleTypeMap = new Map<
      string,
      {
        saleType: string;
        salesCount: number;
        totalKg: Prisma.Decimal;
        revenue: Prisma.Decimal;
        cogs: Prisma.Decimal;
      }
    >();

    // Daily breakdown tracking
    const dailyMap = new Map<
      string,
      {
        revenue: Prisma.Decimal;
        cogs: Prisma.Decimal;
        wastageCost: Prisma.Decimal;
        operatingExpenses: Prisma.Decimal;
      }
    >();

    // Helper to get or initialize daily entry
    const getDailyEntry = (dateKey: string) => {
      let entry = dailyMap.get(dateKey);
      if (!entry) {
        entry = {
          revenue: new Prisma.Decimal('0.00'),
          cogs: new Prisma.Decimal('0.00'),
          wastageCost: new Prisma.Decimal('0.00'),
          operatingExpenses: new Prisma.Decimal('0.00')
        };
        dailyMap.set(dateKey, entry);
      }
      return entry;
    };

    // Process Sales
    for (const sale of sales) {
      const sSubtotal = new Prisma.Decimal(sale.subtotal);
      const sDiscount = new Prisma.Decimal(sale.discount);
      const sGrandTotal = new Prisma.Decimal(sale.grandTotal);
      const sKg = new Prisma.Decimal(sale.totalKg);

      grossSales = grossSales.add(sSubtotal);
      totalDiscount = totalDiscount.add(sDiscount);
      netRevenue = netRevenue.add(sGrandTotal);
      totalKgSold = totalKgSold.add(sKg);

      let saleCogs = new Prisma.Decimal('0.00');

      for (const item of sale.items) {
        const itemKg = new Prisma.Decimal(item.quantityKg);
        const itemAmount = new Prisma.Decimal(item.amount);
        const itemCogs = new Prisma.Decimal(item.cogsAmount || '0.00');

        saleCogs = saleCogs.add(itemCogs);

        // Breakdown: Seafood
        const sfKey = item.seafoodId;
        const sfEntry = seafoodMap.get(sfKey) || {
          seafoodId: item.seafood.id,
          seafoodName: item.seafood.name,
          categoryName: item.seafood.category?.name || 'Uncategorized',
          totalKg: new Prisma.Decimal('0.000'),
          revenue: new Prisma.Decimal('0.00'),
          cogs: new Prisma.Decimal('0.00')
        };
        sfEntry.totalKg = sfEntry.totalKg.add(itemKg);
        sfEntry.revenue = sfEntry.revenue.add(itemAmount);
        sfEntry.cogs = sfEntry.cogs.add(itemCogs);
        seafoodMap.set(sfKey, sfEntry);

        // Breakdown: Category
        const catId = item.seafood.category?.id || 'uncategorized';
        const catName = item.seafood.category?.name || 'Uncategorized';
        const catEntry = categoryMap.get(catId) || {
          categoryId: catId,
          categoryName: catName,
          totalKg: new Prisma.Decimal('0.000'),
          revenue: new Prisma.Decimal('0.00'),
          cogs: new Prisma.Decimal('0.00')
        };
        catEntry.totalKg = catEntry.totalKg.add(itemKg);
        catEntry.revenue = catEntry.revenue.add(itemAmount);
        catEntry.cogs = catEntry.cogs.add(itemCogs);
        categoryMap.set(catId, catEntry);

        // Breakdown: Grade
        const grId = item.gradeId;
        const grName = item.grade.name;
        const grEntry = gradeMap.get(grId) || {
          gradeId: grId,
          gradeName: grName,
          totalKg: new Prisma.Decimal('0.000'),
          revenue: new Prisma.Decimal('0.00'),
          cogs: new Prisma.Decimal('0.00')
        };
        grEntry.totalKg = grEntry.totalKg.add(itemKg);
        grEntry.revenue = grEntry.revenue.add(itemAmount);
        grEntry.cogs = grEntry.cogs.add(itemCogs);
        gradeMap.set(grId, grEntry);
      }

      totalCogs = totalCogs.add(saleCogs);

      // Breakdown: Customer (Buyer)
      if (sale.customerId && sale.customer) {
        const custKey = sale.customerId;
        const custEntry = customerMap.get(custKey) || {
          customerId: sale.customer.id,
          customerName: sale.customer.name,
          salesCount: 0,
          totalKg: new Prisma.Decimal('0.000'),
          revenue: new Prisma.Decimal('0.00'),
          cogs: new Prisma.Decimal('0.00')
        };
        custEntry.salesCount += 1;
        custEntry.totalKg = custEntry.totalKg.add(sKg);
        custEntry.revenue = custEntry.revenue.add(sGrandTotal);
        custEntry.cogs = custEntry.cogs.add(saleCogs);
        customerMap.set(custKey, custEntry);
      }

      // Breakdown: Export Company
      if (sale.exportCompanyId && sale.exportCompany) {
        const expKey = sale.exportCompanyId;
        const expEntry = exportCompanyMap.get(expKey) || {
          exportCompanyId: sale.exportCompany.id,
          companyName: sale.exportCompany.companyName,
          salesCount: 0,
          totalKg: new Prisma.Decimal('0.000'),
          revenue: new Prisma.Decimal('0.00'),
          cogs: new Prisma.Decimal('0.00')
        };
        expEntry.salesCount += 1;
        expEntry.totalKg = expEntry.totalKg.add(sKg);
        expEntry.revenue = expEntry.revenue.add(sGrandTotal);
        expEntry.cogs = expEntry.cogs.add(saleCogs);
        exportCompanyMap.set(expKey, expEntry);
      }

      // Breakdown: Sale Type (Wholesale vs Export)
      const stKey = sale.saleType || 'WHOLESALE';
      const stEntry = saleTypeMap.get(stKey) || {
        saleType: stKey,
        salesCount: 0,
        totalKg: new Prisma.Decimal('0.000'),
        revenue: new Prisma.Decimal('0.00'),
        cogs: new Prisma.Decimal('0.00')
      };
      stEntry.salesCount += 1;
      stEntry.totalKg = stEntry.totalKg.add(sKg);
      stEntry.revenue = stEntry.revenue.add(sGrandTotal);
      stEntry.cogs = stEntry.cogs.add(saleCogs);
      saleTypeMap.set(stKey, stEntry);

      // Daily mapping
      const saleDateKey = DailyRateService.formatDate(sale.saleDate);
      const dEntry = getDailyEntry(saleDateKey);
      dEntry.revenue = dEntry.revenue.add(sGrandTotal);
      dEntry.cogs = dEntry.cogs.add(saleCogs);
    }

    const grossProfit = netRevenue.sub(totalCogs);
    const grossMarginPercent = PnlService.calculateMargin(grossProfit, netRevenue);
    const averageCogsPerKg = totalKgSold.greaterThan(0)
      ? totalCogs.div(totalKgSold).toFixed(2)
      : '0.00';

    // ----------------------------------------------------
    // Wastage Computations
    // ----------------------------------------------------
    let totalWastageKg = new Prisma.Decimal('0.000');
    let totalWastageCost = new Prisma.Decimal('0.00');

    for (const mov of stockMovements) {
      const q = new Prisma.Decimal(mov.quantityKg).abs();
      const cost = new Prisma.Decimal(mov.totalCost || '0.00');
      const dateKey = DailyRateService.formatDate(mov.movementDate);
      const dEntry = getDailyEntry(dateKey);

      if (mov.movementType === StockMovementType.WASTE) {
        totalWastageKg = totalWastageKg.add(q);
        totalWastageCost = totalWastageCost.add(cost);
        dEntry.wastageCost = dEntry.wastageCost.add(cost);
      } else if (
        mov.movementType === StockMovementType.RETURN &&
        (mov.referenceType === 'WASTAGE' || mov.referenceType === 'WASTAGE_REVERSAL')
      ) {
        // Compensating reversal of wastage
        totalWastageKg = totalWastageKg.sub(q);
        totalWastageCost = totalWastageCost.sub(cost);
        dEntry.wastageCost = dEntry.wastageCost.sub(cost);
      }
    }

    if (totalWastageKg.lessThan(0)) totalWastageKg = new Prisma.Decimal('0.000');
    if (totalWastageCost.lessThan(0)) totalWastageCost = new Prisma.Decimal('0.00');

    // ----------------------------------------------------
    // Operating Expenses Computations
    // ----------------------------------------------------
    let totalExpenses = new Prisma.Decimal('0.00');
    let workerWages = new Prisma.Decimal('0.00');

    const expenseCategoryMap = new Map<
      ExpenseCategory,
      {
        category: ExpenseCategory;
        categoryName: string;
        amount: Prisma.Decimal;
        count: number;
      }
    >();

    for (const exp of expenses) {
      const amt = new Prisma.Decimal(exp.amount);
      totalExpenses = totalExpenses.add(amt);

      if (
        exp.category === 'WORKER_WAGE' ||
        exp.category === 'COOLIE_WAGES' ||
        exp.category === 'SALARY'
      ) {
        workerWages = workerWages.add(amt);
      }

      const catEntry = expenseCategoryMap.get(exp.category) || {
        category: exp.category,
        categoryName: PnlService.humanizeCategory(exp.category),
        amount: new Prisma.Decimal('0.00'),
        count: 0
      };
      catEntry.amount = catEntry.amount.add(amt);
      catEntry.count += 1;
      expenseCategoryMap.set(exp.category, catEntry);

      const expDateKey = DailyRateService.formatDate(exp.expenseDate);
      const dEntry = getDailyEntry(expDateKey);
      dEntry.operatingExpenses = dEntry.operatingExpenses.add(amt);
    }

    const otherExpenses = totalExpenses.sub(workerWages);

    // ----------------------------------------------------
    // Final Operating Profit Computations
    // ----------------------------------------------------
    // Operating Profit = Gross Profit − Wastage Cost − Operating Expenses
    const operatingProfit = grossProfit.sub(totalWastageCost).sub(totalExpenses);
    const operatingMarginPercent = PnlService.calculateMargin(operatingProfit, netRevenue);

    // ----------------------------------------------------
    // Build Structured Breakdowns
    // ----------------------------------------------------
    const bySeafood: SeafoodBreakdownItem[] = Array.from(seafoodMap.values())
      .map((item) => {
        const itemGp = item.revenue.sub(item.cogs);
        return {
          seafoodId: item.seafoodId,
          seafoodName: item.seafoodName,
          categoryName: item.categoryName,
          totalKg: PnlService.formatKg(item.totalKg),
          revenue: PnlService.formatMoney(item.revenue),
          cogs: PnlService.formatMoney(item.cogs),
          grossProfit: PnlService.formatMoney(itemGp),
          grossMarginPercent: PnlService.calculateMargin(itemGp, item.revenue)
        };
      })
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

    const byCategory: CategoryBreakdownItem[] = Array.from(categoryMap.values())
      .map((item) => {
        const itemGp = item.revenue.sub(item.cogs);
        return {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          totalKg: PnlService.formatKg(item.totalKg),
          revenue: PnlService.formatMoney(item.revenue),
          cogs: PnlService.formatMoney(item.cogs),
          grossProfit: PnlService.formatMoney(itemGp),
          grossMarginPercent: PnlService.calculateMargin(itemGp, item.revenue)
        };
      })
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

    const byGrade: GradeBreakdownItem[] = Array.from(gradeMap.values())
      .map((item) => {
        const itemGp = item.revenue.sub(item.cogs);
        return {
          gradeId: item.gradeId,
          gradeName: item.gradeName,
          totalKg: PnlService.formatKg(item.totalKg),
          revenue: PnlService.formatMoney(item.revenue),
          cogs: PnlService.formatMoney(item.cogs),
          grossProfit: PnlService.formatMoney(itemGp),
          grossMarginPercent: PnlService.calculateMargin(itemGp, item.revenue)
        };
      })
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

    const byCustomer: CustomerBreakdownItem[] = Array.from(customerMap.values())
      .map((item) => {
        const itemGp = item.revenue.sub(item.cogs);
        return {
          customerId: item.customerId,
          customerName: item.customerName,
          salesCount: item.salesCount,
          totalKg: PnlService.formatKg(item.totalKg),
          revenue: PnlService.formatMoney(item.revenue),
          cogs: PnlService.formatMoney(item.cogs),
          grossProfit: PnlService.formatMoney(itemGp),
          grossMarginPercent: PnlService.calculateMargin(itemGp, item.revenue)
        };
      })
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

    const byExportCompany: ExportCompanyBreakdownItem[] = Array.from(exportCompanyMap.values())
      .map((item) => {
        const itemGp = item.revenue.sub(item.cogs);
        return {
          exportCompanyId: item.exportCompanyId,
          companyName: item.companyName,
          salesCount: item.salesCount,
          totalKg: PnlService.formatKg(item.totalKg),
          revenue: PnlService.formatMoney(item.revenue),
          cogs: PnlService.formatMoney(item.cogs),
          grossProfit: PnlService.formatMoney(itemGp),
          grossMarginPercent: PnlService.calculateMargin(itemGp, item.revenue)
        };
      })
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

    const bySaleType: SaleTypeBreakdownItem[] = Array.from(saleTypeMap.values())
      .map((item) => {
        const itemGp = item.revenue.sub(item.cogs);
        return {
          saleType: item.saleType,
          salesCount: item.salesCount,
          totalKg: PnlService.formatKg(item.totalKg),
          revenue: PnlService.formatMoney(item.revenue),
          cogs: PnlService.formatMoney(item.cogs),
          grossProfit: PnlService.formatMoney(itemGp),
          grossMarginPercent: PnlService.calculateMargin(itemGp, item.revenue)
        };
      })
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

    const byExpenseCategory: ExpenseBreakdownItem[] = Array.from(expenseCategoryMap.values())
      .map((item) => {
        const pct = totalExpenses.greaterThan(0)
          ? item.amount.div(totalExpenses).mul(100).toFixed(2)
          : '0.00';
        return {
          category: item.category,
          categoryName: item.categoryName,
          amount: PnlService.formatMoney(item.amount),
          percentageOfOpex: pct,
          count: item.count
        };
      })
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));

    // Daily breakdown for the range
    const daily: DailyBreakdownItem[] = [];
    const curr = new Date(startDateObj.getTime());
    while (curr <= endDateObj) {
      const dateKey = DailyRateService.formatDate(curr);
      const entry = dailyMap.get(dateKey) || {
        revenue: new Prisma.Decimal('0.00'),
        cogs: new Prisma.Decimal('0.00'),
        wastageCost: new Prisma.Decimal('0.00'),
        operatingExpenses: new Prisma.Decimal('0.00')
      };

      const dGp = entry.revenue.sub(entry.cogs);
      const dOp = dGp.sub(entry.wastageCost).sub(entry.operatingExpenses);

      daily.push({
        date: dateKey,
        revenue: PnlService.formatMoney(entry.revenue),
        cogs: PnlService.formatMoney(entry.cogs),
        grossProfit: PnlService.formatMoney(dGp),
        grossMarginPercent: PnlService.calculateMargin(dGp, entry.revenue),
        wastageCost: PnlService.formatMoney(entry.wastageCost),
        operatingExpenses: PnlService.formatMoney(entry.operatingExpenses),
        operatingProfit: PnlService.formatMoney(dOp),
        operatingMarginPercent: PnlService.calculateMargin(dOp, entry.revenue),
        isClosed: closedDateSet.has(dateKey)
      });

      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    // DayEnd single-day status check
    let singleDayEndStatus: PnlSummary['dayEndStatus'] = undefined;
    if (isSingleDay) {
      const singleClosing = dayEndClosings.find(
        (c) => DailyRateService.formatDate(c.businessDate) === startDateStr
      );
      singleDayEndStatus = {
        isClosed: singleClosing ? singleClosing.closingStatus === DayEndStatus.CLOSED : false,
        closingStatus: singleClosing ? singleClosing.closingStatus : DayEndStatus.OPEN
      };
    }

    return {
      period: {
        startDate: startDateStr,
        endDate: endDateStr,
        isSingleDay
      },
      revenue: {
        grossSales: PnlService.formatMoney(grossSales),
        totalDiscount: PnlService.formatMoney(totalDiscount),
        netRevenue: PnlService.formatMoney(netRevenue),
        totalKgSold: PnlService.formatKg(totalKgSold),
        completedSalesCount: sales.length
      },
      cogs: {
        totalCogs: PnlService.formatMoney(totalCogs),
        averageCogsPerKg
      },
      grossProfit: {
        grossProfit: PnlService.formatMoney(grossProfit),
        grossMarginPercent
      },
      wastage: {
        totalWastageKg: PnlService.formatKg(totalWastageKg),
        wastageCost: PnlService.formatMoney(totalWastageCost)
      },
      operatingExpenses: {
        totalExpenses: PnlService.formatMoney(totalExpenses),
        workerWages: PnlService.formatMoney(workerWages),
        otherExpenses: PnlService.formatMoney(otherExpenses),
        expensesCount: expenses.length
      },
      operatingProfit: {
        operatingProfit: PnlService.formatMoney(operatingProfit),
        operatingMarginPercent
      },
      dayEndStatus: singleDayEndStatus,
      breakdowns: {
        daily,
        bySaleType,
        bySeafood,
        byCategory,
        byGrade,
        byCustomer,
        byExportCompany,
        byExpenseCategory
      }
    };
  }

  /**
   * Get single-day P&L report.
   */
  async getDailyPnl(dateStr?: string): Promise<PnlReport> {
    const targetDate = dateStr || DailyRateService.formatDate(new Date());
    return this.calculatePeriodPnl(targetDate, targetDate, true);
  }

  /**
   * Get date-range P&L report.
   */
  async getDateRangePnl(startDateStr: string, endDateStr: string): Promise<PnlReport> {
    const isSingleDay = startDateStr === endDateStr;
    return this.calculatePeriodPnl(startDateStr, endDateStr, isSingleDay);
  }

  /**
   * Get summary-only P&L metrics.
   */
  async getPnlSummary(startDateStr: string, endDateStr: string): Promise<PnlSummary> {
    const report = await this.getDateRangePnl(startDateStr, endDateStr);
    const { breakdowns, ...summary } = report;
    return summary;
  }

  /**
   * Get breakdowns only.
   */
  async getPnlBreakdowns(startDateStr: string, endDateStr: string): Promise<PnlReport['breakdowns']> {
    const report = await this.getDateRangePnl(startDateStr, endDateStr);
    return report.breakdowns;
  }
}
