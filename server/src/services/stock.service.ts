import { StockRepository, StockWithRelations, StockMovementWithRelations } from '../repositories/stock.repository';
import { AppError } from '../utils/appError';
import { Prisma, StockMovementType } from '@prisma/client';
import { DailyRateService } from './dailyRate.service';

export interface FormattedStock {
  id: string;
  seafoodId: string;
  gradeId: string;
  quantityKg: string;
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
    page: number;
    limit: number;
    seafoodId?: string;
    gradeId?: string;
    movementType?: StockMovementType;
    fromDate?: string;
    toDate?: string;
    referenceType?: string;
  }): Promise<{ items: FormattedStockMovement[]; total: number; totalPages: number }> {
    const { page, limit, seafoodId, gradeId, movementType, fromDate, toDate, referenceType } = params;
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
}
