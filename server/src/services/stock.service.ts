import { StockRepository, StockWithRelations, StockMovementWithRelations } from '../repositories/stock.repository';
import { AppError } from '../utils/appError';
import { Prisma, StockMovementType } from '@prisma/client';
import { DailyRateService } from './dailyRate.service';
import { assertBusinessDateOpen } from '../utils/dayEnd';
import { prisma } from '../lib/prisma';

export interface FormattedStock {
  id: string;
  seafoodId: string;
  gradeId: string;
  quantityKg: string;
  averageCost: string;
  totalValue: string;
  createdAt: string;
  updatedAt: string;
  seafood: {
    id: string;
    name: string;
    unit: string;
    category: {
      id: string;
      name: string;
    };
  };
  grade: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface FormattedStockMovement {
  id: string;
  stockId: string;
  seafoodId: string;
  gradeId: string;
  movementType: StockMovementType;
  quantityKg: string;
  balanceBefore: string;
  balanceAfter: string;
  unitCost: string | null;
  totalCost: string | null;
  referenceType: string;
  referenceId: string | null;
  movementDate: string;
  notes: string | null;
  createdAt: string;
  seafood: {
    id: string;
    name: string;
    unit: string;
  };
  grade: {
    id: string;
    name: string;
    description: string | null;
  };
}

export class StockService {
  private readonly repo = new StockRepository();

  public static formatStock(item: StockWithRelations): FormattedStock {
    return {
      id: item.id,
      seafoodId: item.seafoodId,
      gradeId: item.gradeId,
      quantityKg: new Prisma.Decimal(item.quantityKg).toFixed(2),
      averageCost: new Prisma.Decimal(item.averageCost ?? 0).toFixed(2),
      totalValue: new Prisma.Decimal(item.totalValue ?? 0).toFixed(2),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      seafood: item.seafood,
      grade: item.grade
    };
  }

  public static formatMovement(item: StockMovementWithRelations): FormattedStockMovement {
    return {
      id: item.id,
      stockId: item.stockId,
      seafoodId: item.seafoodId,
      gradeId: item.gradeId,
      movementType: item.movementType,
      quantityKg: new Prisma.Decimal(item.quantityKg).toFixed(2),
      balanceBefore: new Prisma.Decimal(item.balanceBefore).toFixed(2),
      balanceAfter: new Prisma.Decimal(item.balanceAfter).toFixed(2),
      unitCost: item.unitCost != null ? new Prisma.Decimal(item.unitCost).toFixed(2) : null,
      totalCost: item.totalCost != null ? new Prisma.Decimal(item.totalCost).toFixed(2) : null,
      referenceType: item.referenceType,
      referenceId: item.referenceId,
      movementDate: item.movementDate.toISOString(),
      notes: item.notes,
      createdAt: item.createdAt.toISOString(),
      seafood: {
        id: item.seafood.id,
        name: item.seafood.name,
        unit: item.seafood.unit
      },
      grade: item.grade
    };
  }

  async getStockList(params: {
    page: number;
    limit: number;
    seafoodId?: string;
    gradeId?: string;
    categoryId?: string;
    search?: string;
  }): Promise<{ items: FormattedStock[]; total: number; totalPages: number }> {
    const { page, limit, seafoodId, gradeId, categoryId, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.StockWhereInput = {};

    if (seafoodId) where.seafoodId = seafoodId;
    if (gradeId) where.gradeId = gradeId;

    if (categoryId) {
      where.seafood = { categoryId };
    }

    if (search) {
      where.OR = [
        { seafood: { name: { contains: search, mode: 'insensitive' } } },
        { seafood: { category: { name: { contains: search, mode: 'insensitive' } } } },
        { grade: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [items, total] = await Promise.all([
      this.repo.findMany({ skip, take: limit, where }),
      this.repo.count(where)
    ]);

    return {
      items: items.map(StockService.formatStock),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getStockById(id: string): Promise<FormattedStock> {
    const stock = await this.repo.findById(id);
    if (!stock) {
      throw AppError.notFound('Stock record not found', 'STOCK_NOT_FOUND');
    }
    return StockService.formatStock(stock);
  }

  async getStockBySeafoodAndGrade(
    seafoodId: string,
    gradeId: string
  ): Promise<{ seafoodId: string; gradeId: string; quantityKg: string; stock: FormattedStock | null }> {
    const stock = await this.repo.findBySeafoodAndGradeWithRelations(seafoodId, gradeId);
    if (!stock) {
      return {
        seafoodId,
        gradeId,
        quantityKg: '0.00',
        stock: null
      };
    }
    return {
      seafoodId,
      gradeId,
      quantityKg: new Prisma.Decimal(stock.quantityKg).toFixed(2),
      stock: StockService.formatStock(stock)
    };
  }

  async getStockMovements(params: {
    page?: number;
    limit?: number;
    seafoodId?: string;
    gradeId?: string;
    movementType?: StockMovementType;
    fromDate?: string;
    toDate?: string;
    referenceType?: string;
  }): Promise<{ items: FormattedStockMovement[]; total: number; totalPages: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const { seafoodId, gradeId, movementType, fromDate, toDate, referenceType } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = {};

    if (seafoodId) where.seafoodId = seafoodId;
    if (gradeId) where.gradeId = gradeId;
    if (movementType) where.movementType = movementType;
    if (referenceType) where.referenceType = referenceType;

    if (fromDate || toDate) {
      where.movementDate = {};
      if (fromDate) where.movementDate.gte = DailyRateService.parseDate(fromDate);
      if (toDate) {
        // Include the entire end date until 23:59:59.999 UTC
        const endDate = DailyRateService.parseDate(toDate);
        endDate.setUTCHours(23, 59, 59, 999);
        where.movementDate.lte = endDate;
      }
    }

    const [items, total] = await Promise.all([
      this.repo.findMovements({ skip, take: limit, where }),
      this.repo.countMovements(where)
    ]);

    return {
      items: items.map(StockService.formatMovement),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async recordWastage(data: {
    seafoodId: string;
    gradeId: string;
    quantityKg: string | number;
    reason: string;
    notes?: string;
    date?: string;
    userId?: string;
  }): Promise<{
    movement: FormattedStockMovement;
    estimatedLoss: string;
    remainingStockKg: string;
  }> {
    const qtyDecimal = new Prisma.Decimal(data.quantityKg);
    if (qtyDecimal.lessThanOrEqualTo(0)) {
      throw AppError.badRequest('Wastage quantity must be greater than zero', 'INVALID_QUANTITY');
    }

    const businessDate = data.date ? DailyRateService.parseDate(data.date) : new Date();

    return prisma.$transaction(async (tx) => {
      await assertBusinessDateOpen(tx, businessDate);
      await assertBusinessDateOpen(tx, new Date());

      const seafood = await tx.seafood.findUnique({ where: { id: data.seafoodId } });
      if (!seafood) throw AppError.notFound('Seafood not found', 'SEAFOOD_NOT_FOUND');

      const grade = await tx.seafoodGrade.findUnique({ where: { id: data.gradeId } });
      if (!grade) throw AppError.notFound('Grade not found', 'GRADE_NOT_FOUND');

      const lockedRows = await tx.$queryRaw<Array<{
        id: string;
        quantityKg: string | number | Prisma.Decimal;
        averageCost: string | number | Prisma.Decimal;
        totalValue: string | number | Prisma.Decimal;
      }>>`
        SELECT id, "quantityKg", "averageCost", "totalValue"
        FROM "Stock"
        WHERE "seafoodId" = ${data.seafoodId} AND "gradeId" = ${data.gradeId}
        FOR UPDATE
      `;

      if (!lockedRows || lockedRows.length === 0) {
        throw AppError.badRequest(`No stock record found for ${seafood.name} (${grade.name})`, 'NO_STOCK');
      }

      const balanceBefore = new Prisma.Decimal(lockedRows[0].quantityKg);
      if (balanceBefore.lessThan(qtyDecimal)) {
        throw AppError.badRequest(
          `Cannot record wastage of ${qtyDecimal.toFixed(2)} KG. Available stock is only ${balanceBefore.toFixed(2)} KG.`,
          'INSUFFICIENT_STOCK',
          { availableKg: balanceBefore.toFixed(2), requestedKg: qtyDecimal.toFixed(2) }
        );
      }

      const balanceAfter = balanceBefore.sub(qtyDecimal);

      let currentAvgCost = new Prisma.Decimal(lockedRows[0].averageCost || 0);

      // If averageCost is zero, check latest published DailyRate as benchmark so wastage loss is not falsely reported as 0
      if (currentAvgCost.isZero()) {
        const rateRecord = await tx.dailyRate.findFirst({
          where: {
            seafoodId: data.seafoodId,
            gradeId: data.gradeId,
            status: 'PUBLISHED',
            deletedAt: null
          },
          orderBy: [{ rateDate: 'desc' }, { version: 'desc' }]
        });
        if (rateRecord) {
          currentAvgCost = new Prisma.Decimal(rateRecord.purchaseRate);
        }
      }

      const estimatedLoss = qtyDecimal.mul(currentAvgCost).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      const newTotalValue = balanceAfter.mul(new Prisma.Decimal(lockedRows[0].averageCost || currentAvgCost)).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      await tx.stock.update({
        where: { id: lockedRows[0].id },
        data: {
          quantityKg: balanceAfter,
          totalValue: newTotalValue
        }
      });

      const movementNote = `Wastage: ${data.reason}${data.notes ? ` - ${data.notes}` : ''} | Cost Loss: ₹${estimatedLoss.toFixed(2)} (at ₹${currentAvgCost.toFixed(2)}/KG)`;
      const movement = await tx.stockMovement.create({
        data: {
          stockId: lockedRows[0].id,
          seafoodId: data.seafoodId,
          gradeId: data.gradeId,
          movementType: 'WASTE',
          quantityKg: qtyDecimal.negated(),
          balanceBefore,
          balanceAfter,
          unitCost: currentAvgCost,
          totalCost: estimatedLoss,
          referenceType: 'WASTAGE',
          referenceId: null,
          movementDate: businessDate,
          notes: movementNote,
          createdById: data.userId || null
        },
        include: {
          seafood: { select: { id: true, name: true, unit: true } },
          grade: { select: { id: true, name: true, description: true } }
        }
      });

      return {
        movement: StockService.formatMovement(movement as StockMovementWithRelations),
        estimatedLoss: estimatedLoss.toFixed(2),
        remainingStockKg: balanceAfter.toFixed(2)
      };
    }, {
      maxWait: 15000,
      timeout: 60000
    });
  }

  async recordAdjustment(data: {
    seafoodId: string;
    gradeId: string;
    quantityKg: string | number;
    reason: string;
    notes?: string;
    date?: string;
    userId?: string;
  }): Promise<{
    movement: FormattedStockMovement;
    remainingStockKg: string;
  }> {
    const qtyDecimal = new Prisma.Decimal(data.quantityKg);
    const businessDate = data.date ? DailyRateService.parseDate(data.date) : new Date();

    return prisma.$transaction(async (tx) => {
      await assertBusinessDateOpen(tx, businessDate);
      await assertBusinessDateOpen(tx, new Date());

      const seafood = await tx.seafood.findUnique({ where: { id: data.seafoodId } });
      if (!seafood) throw AppError.notFound('Seafood not found', 'SEAFOOD_NOT_FOUND');

      const grade = await tx.seafoodGrade.findUnique({ where: { id: data.gradeId } });
      if (!grade) throw AppError.notFound('Grade not found', 'GRADE_NOT_FOUND');

      const lockedRows = await tx.$queryRaw<Array<{
        id: string;
        quantityKg: string | number | Prisma.Decimal;
        averageCost: string | number | Prisma.Decimal;
        totalValue: string | number | Prisma.Decimal;
      }>>`
        SELECT id, "quantityKg", "averageCost", "totalValue"
        FROM "Stock"
        WHERE "seafoodId" = ${data.seafoodId} AND "gradeId" = ${data.gradeId}
        FOR UPDATE
      `;

      let stockId: string;
      let balanceBefore = new Prisma.Decimal(0);
      let currentAvgCost = new Prisma.Decimal(0);

      if (!lockedRows || lockedRows.length === 0) {
        const newStock = await tx.stock.create({
          data: {
            seafoodId: data.seafoodId,
            gradeId: data.gradeId,
            quantityKg: '0.00',
            averageCost: '0.00',
            totalValue: '0.00'
          }
        });
        stockId = newStock.id;
      } else {
        stockId = lockedRows[0].id;
        balanceBefore = new Prisma.Decimal(lockedRows[0].quantityKg);
        currentAvgCost = new Prisma.Decimal(lockedRows[0].averageCost || 0);
      }

      const balanceAfter = balanceBefore.add(qtyDecimal);

      if (balanceAfter.lessThan(0)) {
        throw AppError.badRequest('Stock balance cannot be adjusted to negative', 'INVALID_ADJUSTMENT');
      }

      // If averageCost is 0, lookup published daily rate benchmark
      if (currentAvgCost.isZero()) {
        const rateRecord = await tx.dailyRate.findFirst({
          where: {
            seafoodId: data.seafoodId,
            gradeId: data.gradeId,
            status: 'PUBLISHED',
            deletedAt: null
          },
          orderBy: [{ rateDate: 'desc' }, { version: 'desc' }]
        });
        if (rateRecord) {
          currentAvgCost = new Prisma.Decimal(rateRecord.purchaseRate);
        }
      }

      const adjTotalCost = qtyDecimal.abs().mul(currentAvgCost).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      const newTotalValue = balanceAfter.mul(currentAvgCost).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      await tx.stock.update({
        where: { id: stockId },
        data: {
          quantityKg: balanceAfter,
          averageCost: currentAvgCost,
          totalValue: newTotalValue
        }
      });

      const movementNote = `Adjustment: ${data.reason}${data.notes ? ` - ${data.notes}` : ''}`;
      const movement = await tx.stockMovement.create({
        data: {
          stockId,
          seafoodId: data.seafoodId,
          gradeId: data.gradeId,
          movementType: 'ADJUSTMENT',
          quantityKg: qtyDecimal,
          balanceBefore,
          balanceAfter,
          unitCost: currentAvgCost,
          totalCost: adjTotalCost,
          referenceType: 'ADJUSTMENT',
          referenceId: null,
          movementDate: businessDate,
          notes: movementNote,
          createdById: data.userId || null
        },
        include: {
          seafood: { select: { id: true, name: true, unit: true } },
          grade: { select: { id: true, name: true, description: true } }
        }
      });

      return {
        movement: StockService.formatMovement(movement as StockMovementWithRelations),
        remainingStockKg: balanceAfter.toFixed(2)
      };
    }, {
      maxWait: 15000,
      timeout: 60000
    });
  }

  async getDailyFlow(dateStr?: string): Promise<{
    date: string;
    summary: {
      openingKg: string;
      receivedKg: string;
      soldKg: string;
      wastageKg: string;
      adjustedKg: string;
      closingKg: string;
      expectedClosingKg: string;
      isReconciled: boolean;
      totalProcurementValue: string;
      totalWholesaleValue: string;
      totalWastageLoss: string;
    };
    items: Array<{
      seafoodId: string;
      seafoodName: string;
      gradeId: string;
      gradeName: string;
      unit: string;
      openingKg: string;
      receivedKg: string;
      soldKg: string;
      wastageKg: string;
      adjustedKg: string;
      closingKg: string;
      purchaseRate: string;
      sellingRate: string;
      wastageCostLoss: string;
      isReconciled: boolean;
    }>;
  }> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const startDate = DailyRateService.parseDate(targetDate);
    const endDate = new Date(startDate);
    endDate.setUTCHours(23, 59, 59, 999);

    // Get all movements on this business day
    const movements = await prisma.stockMovement.findMany({
      where: {
        movementDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        seafood: { select: { id: true, name: true, unit: true } },
        grade: { select: { id: true, name: true } }
      }
    });

    // Get all active stock items to have complete catalogue overview
    const stocks = await prisma.stock.findMany({
      include: {
        seafood: { select: { id: true, name: true, unit: true } },
        grade: { select: { id: true, name: true } }
      }
    });

    // Get daily rates for today
    const rates = await prisma.dailyRate.findMany({
      where: {
        rateDate: startDate,
        status: 'PUBLISHED',
        deletedAt: null
      }
    });

    const rateMap = new Map<string, { purchaseRate: Prisma.Decimal; sellingRate: Prisma.Decimal }>();
    rates.forEach((r) => {
      rateMap.set(`${r.seafoodId}:${r.gradeId}`, {
        purchaseRate: new Prisma.Decimal(r.purchaseRate),
        sellingRate: new Prisma.Decimal(r.sellingRate)
      });
    });

    // Group movements by seafoodId:gradeId
    const itemFlowMap = new Map<
      string,
      {
        seafoodId: string;
        seafoodName: string;
        gradeId: string;
        gradeName: string;
        unit: string;
        receivedKg: Prisma.Decimal;
        soldKg: Prisma.Decimal;
        wastageKg: Prisma.Decimal;
        adjustedKg: Prisma.Decimal;
      }
    >();

    // Initialize with all existing stocks
    stocks.forEach((st) => {
      const key = `${st.seafoodId}:${st.gradeId}`;
      itemFlowMap.set(key, {
        seafoodId: st.seafoodId,
        seafoodName: st.seafood.name,
        gradeId: st.gradeId,
        gradeName: st.grade.name,
        unit: st.seafood.unit,
        receivedKg: new Prisma.Decimal(0),
        soldKg: new Prisma.Decimal(0),
        wastageKg: new Prisma.Decimal(0),
        adjustedKg: new Prisma.Decimal(0)
      });
    });

    // Aggregate movements
    movements.forEach((m) => {
      const key = `${m.seafoodId}:${m.gradeId}`;
      let flow = itemFlowMap.get(key);
      if (!flow) {
        flow = {
          seafoodId: m.seafoodId,
          seafoodName: m.seafood.name,
          gradeId: m.gradeId,
          gradeName: m.grade.name,
          unit: m.seafood.unit,
          receivedKg: new Prisma.Decimal(0),
          soldKg: new Prisma.Decimal(0),
          wastageKg: new Prisma.Decimal(0),
          adjustedKg: new Prisma.Decimal(0)
        };
        itemFlowMap.set(key, flow);
      }

      const absQty = new Prisma.Decimal(m.quantityKg).abs();

      if (m.movementType === 'PURCHASE') {
        flow.receivedKg = flow.receivedKg.add(absQty);
      } else if (m.movementType === 'SALE' || m.movementType === 'EXPORT') {
        flow.soldKg = flow.soldKg.add(absQty);
      } else if (m.movementType === 'WASTE') {
        flow.wastageKg = flow.wastageKg.add(absQty);
      } else if (m.movementType === 'ADJUSTMENT') {
        flow.adjustedKg = flow.adjustedKg.add(new Prisma.Decimal(m.quantityKg));
      }
    });

    let totalReceived = new Prisma.Decimal(0);
    let totalSold = new Prisma.Decimal(0);
    let totalWastage = new Prisma.Decimal(0);
    let totalAdjusted = new Prisma.Decimal(0);
    let totalClosing = new Prisma.Decimal(0);
    let totalProcurementVal = new Prisma.Decimal(0);
    let totalWholesaleVal = new Prisma.Decimal(0);
    let totalWastageVal = new Prisma.Decimal(0);

    const items = Array.from(itemFlowMap.values()).map((flow) => {
      const opening = new Prisma.Decimal(0); // Daily flow starts at 0 KG
      const closing = opening
        .add(flow.receivedKg)
        .sub(flow.soldKg)
        .sub(flow.wastageKg)
        .add(flow.adjustedKg);

      const rates = rateMap.get(`${flow.seafoodId}:${flow.gradeId}`) || {
        purchaseRate: new Prisma.Decimal(0),
        sellingRate: new Prisma.Decimal(0)
      };

      const wastageCost = flow.wastageKg.mul(rates.purchaseRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      const procurementCost = flow.receivedKg.mul(rates.purchaseRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      const wholesaleRevenue = flow.soldKg.mul(rates.sellingRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      totalReceived = totalReceived.add(flow.receivedKg);
      totalSold = totalSold.add(flow.soldKg);
      totalWastage = totalWastage.add(flow.wastageKg);
      totalAdjusted = totalAdjusted.add(flow.adjustedKg);
      totalClosing = totalClosing.add(closing);
      totalProcurementVal = totalProcurementVal.add(procurementCost);
      totalWholesaleVal = totalWholesaleVal.add(wholesaleRevenue);
      totalWastageVal = totalWastageVal.add(wastageCost);

      return {
        seafoodId: flow.seafoodId,
        seafoodName: flow.seafoodName,
        gradeId: flow.gradeId,
        gradeName: flow.gradeName,
        unit: flow.unit,
        openingKg: opening.toFixed(2),
        receivedKg: flow.receivedKg.toFixed(2),
        soldKg: flow.soldKg.toFixed(2),
        wastageKg: flow.wastageKg.toFixed(2),
        adjustedKg: flow.adjustedKg.toFixed(2),
        closingKg: closing.toFixed(2),
        purchaseRate: rates.purchaseRate.toFixed(2),
        sellingRate: rates.sellingRate.toFixed(2),
        wastageCostLoss: wastageCost.toFixed(2),
        isReconciled: closing.isZero()
      };
    });

    return {
      date: targetDate,
      summary: {
        openingKg: '0.00',
        receivedKg: totalReceived.toFixed(2),
        soldKg: totalSold.toFixed(2),
        wastageKg: totalWastage.toFixed(2),
        adjustedKg: totalAdjusted.toFixed(2),
        closingKg: totalClosing.toFixed(2),
        expectedClosingKg: '0.00',
        isReconciled: totalClosing.isZero(),
        totalProcurementValue: totalProcurementVal.toFixed(2),
        totalWholesaleValue: totalWholesaleVal.toFixed(2),
        totalWastageLoss: totalWastageVal.toFixed(2)
      },
      items
    };
  }
}

