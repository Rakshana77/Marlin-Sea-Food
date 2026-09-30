import { DailyRateRepository, DailyRateWithRelations } from '../repositories/dailyRate.repository';
import { SeafoodRepository } from '../repositories/seafood.repository';
import { SeafoodGradeRepository } from '../repositories/seafoodGrade.repository';
import { AppError } from '../utils/appError';
import { Prisma, DailyRateStatus } from '@prisma/client';

export interface FormattedDailyRate {
  id: string;
  rateDate: string;
  seafoodId: string;
  gradeId: string;
  purchaseRate: string;
  sellingRate: string;
  status: DailyRateStatus;
  version: number;
  publishedAt: string | null;
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

export class DailyRateService {
  private readonly repo = new DailyRateRepository();
  private readonly seafoodRepo = new SeafoodRepository();
  private readonly gradeRepo = new SeafoodGradeRepository();

  public static parseDate(dateStr: string): Date {
    // Normalize to UTC midnight for @db.Date consistency
    const [year, month, day] = dateStr.split('-').map((n) => parseInt(n, 10));
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  public static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  public static formatRate(item: DailyRateWithRelations): FormattedDailyRate {
    return {
      id: item.id,
      rateDate: DailyRateService.formatDate(item.rateDate),
      seafoodId: item.seafoodId,
      gradeId: item.gradeId,
      purchaseRate: new Prisma.Decimal(item.purchaseRate).toFixed(2),
      sellingRate: new Prisma.Decimal(item.sellingRate).toFixed(2),
      status: item.status,
      version: item.version,
      publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      seafood: item.seafood,
      grade: item.grade
    };
  }

  async getDailyRates(params: {
    page: number;
    limit: number;
    date?: string;
    fromDate?: string;
    toDate?: string;
    seafoodId?: string;
    categoryId?: string;
    gradeId?: string;
    status?: DailyRateStatus;
    search?: string;
  }): Promise<{ items: FormattedDailyRate[]; total: number; totalPages: number }> {
    const { page, limit, date, fromDate, toDate, seafoodId, categoryId, gradeId, status, search } =
      params;
    const skip = (page - 1) * limit;

    const where: Prisma.DailyRateWhereInput = {};

    if (date) {
      where.rateDate = DailyRateService.parseDate(date);
    } else if (fromDate || toDate) {
      where.rateDate = {};
      if (fromDate) where.rateDate.gte = DailyRateService.parseDate(fromDate);
      if (toDate) where.rateDate.lte = DailyRateService.parseDate(toDate);
    }

    if (seafoodId) where.seafoodId = seafoodId;
    if (gradeId) where.gradeId = gradeId;
    if (status) where.status = status;

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

    const [rawItems, total] = await Promise.all([
      this.repo.findMany({
        skip,
        take: limit,
        where,
        orderBy: [{ rateDate: 'desc' }, { seafood: { name: 'asc' } }]
      }),
      this.repo.count(where)
    ]);

    return {
      items: rawItems.map(DailyRateService.formatRate),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getDailyRateById(id: string): Promise<FormattedDailyRate> {
    const item = await this.repo.findById(id);
    if (!item) {
      throw AppError.notFound(`Daily rate with ID ${id} not found`, 'DAILY_RATE_NOT_FOUND');
    }
    return DailyRateService.formatRate(item);
  }

  async createDailyRate(data: {
    rateDate: string;
    seafoodId: string;
    gradeId: string;
    purchaseRate: string;
    sellingRate: string;
  }): Promise<FormattedDailyRate> {
    const rateDate = DailyRateService.parseDate(data.rateDate);

    // 1. Validate Seafood exists
    const seafood = await this.seafoodRepo.findById(data.seafoodId);
    if (!seafood) {
      throw AppError.badRequest(`Seafood with ID ${data.seafoodId} not found`, 'SEAFOOD_NOT_FOUND');
    }

    // 2. Validate Grade exists
    const grade = await this.gradeRepo.findById(data.gradeId);
    if (!grade) {
      throw AppError.badRequest(`Seafood grade with ID ${data.gradeId} not found`, 'GRADE_NOT_FOUND');
    }

    // 3. Check uniqueness for this date, seafood, grade, version=1
    const existing = await this.repo.findActiveByUnique(rateDate, data.seafoodId, data.gradeId, 1);
    if (existing && !existing.deletedAt) {
      throw AppError.conflict(
        `A rate record already exists for ${seafood.name} (${grade.name}) on ${data.rateDate}`,
        'RATE_ALREADY_EXISTS'
      );
    }

    // 4. Decimal conversion
    const purchaseRateDec = new Prisma.Decimal(data.purchaseRate);
    const sellingRateDec = new Prisma.Decimal(data.sellingRate);

    if (purchaseRateDec.isNegative() || sellingRateDec.isNegative()) {
      throw AppError.badRequest('Rates cannot be negative numbers', 'INVALID_RATE');
    }

    const created = await this.repo.create({
      rateDate,
      seafood: { connect: { id: data.seafoodId } },
      grade: { connect: { id: data.gradeId } },
      purchaseRate: purchaseRateDec,
      sellingRate: sellingRateDec,
      status: DailyRateStatus.DRAFT,
      version: 1
    });

    return this.getDailyRateById(created.id);
  }

  async updateDraftRate(
    id: string,
    data: {
      purchaseRate?: string;
      sellingRate?: string;
      gradeId?: string;
      seafoodId?: string;
    }
  ): Promise<FormattedDailyRate> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw AppError.notFound(`Daily rate with ID ${id} not found`, 'DAILY_RATE_NOT_FOUND');
    }

    // CRITICAL BUSINESS RULE: Published rates cannot be modified in place
    if (existing.status === DailyRateStatus.PUBLISHED) {
      throw AppError.badRequest(
        'Published rates are historical and cannot be modified directly.',
        'RATE_ALREADY_PUBLISHED'
      );
    }

    if (existing.status === DailyRateStatus.ARCHIVED) {
      throw AppError.badRequest('Archived rates cannot be modified.', 'RATE_ARCHIVED');
    }

    const updateData: Prisma.DailyRateUpdateInput = {};

    if (data.purchaseRate !== undefined) {
      const pDec = new Prisma.Decimal(data.purchaseRate);
      if (pDec.isNegative()) throw AppError.badRequest('Purchase rate cannot be negative', 'INVALID_RATE');
      updateData.purchaseRate = pDec;
    }

    if (data.sellingRate !== undefined) {
      const sDec = new Prisma.Decimal(data.sellingRate);
      if (sDec.isNegative()) throw AppError.badRequest('Selling rate cannot be negative', 'INVALID_RATE');
      updateData.sellingRate = sDec;
    }

    if (data.seafoodId) {
      const seafood = await this.seafoodRepo.findById(data.seafoodId);
      if (!seafood) throw AppError.badRequest('Seafood not found', 'SEAFOOD_NOT_FOUND');
      updateData.seafood = { connect: { id: data.seafoodId } };
    }

    if (data.gradeId) {
      const grade = await this.gradeRepo.findById(data.gradeId);
      if (!grade) throw AppError.badRequest('Grade not found', 'GRADE_NOT_FOUND');
      updateData.grade = { connect: { id: data.gradeId } };
    }

    await this.repo.update(id, updateData);
    return this.getDailyRateById(id);
  }

  async publishRate(id: string): Promise<FormattedDailyRate> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw AppError.notFound(`Daily rate with ID ${id} not found`, 'DAILY_RATE_NOT_FOUND');
    }

    if (existing.status === DailyRateStatus.PUBLISHED) {
      throw AppError.badRequest('This rate is already published.', 'RATE_ALREADY_PUBLISHED');
    }

    await this.repo.update(id, {
      status: DailyRateStatus.PUBLISHED,
      publishedAt: new Date()
    });

    return this.getDailyRateById(id);
  }

  async publishAllForDate(rateDateStr: string): Promise<{
    publishedCount: number;
    date: string;
    status: DailyRateStatus;
  }> {
    const rateDate = DailyRateService.parseDate(rateDateStr);
    const drafts = await this.repo.findDraftsByDate(rateDate);

    if (drafts.length === 0) {
      throw AppError.badRequest(
        `No draft rates found to publish for ${rateDateStr}`,
        'NO_RATES_TO_PUBLISH'
      );
    }

    // Atomic transaction publishing all draft rates
    await this.repo.runTransaction(async (tx) => {
      const now = new Date();
      for (const draft of drafts) {
        await tx.dailyRate.update({
          where: { id: draft.id },
          data: {
            status: DailyRateStatus.PUBLISHED,
            publishedAt: now
          }
        });
      }
    });

    return {
      publishedCount: drafts.length,
      date: rateDateStr,
      status: DailyRateStatus.PUBLISHED
    };
  }

  async copyYesterdayRates(
    sourceDateStr: string,
    targetDateStr: string
  ): Promise<{
    copiedCount: number;
    skippedCount: number;
    sourceDate: string;
    targetDate: string;
  }> {
    const sourceDate = DailyRateService.parseDate(sourceDateStr);
    const targetDate = DailyRateService.parseDate(targetDateStr);

    const sourcePublished = await this.repo.findPublishedByDate(sourceDate);
    if (sourcePublished.length === 0) {
      throw AppError.badRequest(
        `No published rates found on ${sourceDateStr} to copy`,
        'NO_RATES_TO_PUBLISH'
      );
    }

    // Read existing rates on targetDate to prevent overwriting or duplicates
    const targetExisting = await this.repo.findMany({
      where: { rateDate: targetDate }
    });

    const targetKeySet = new Set(
      targetExisting.map((r) => `${r.seafoodId}_${r.gradeId}_${r.version}`)
    );

    let copiedCount = 0;
    let skippedCount = 0;

    await this.repo.runTransaction(async (tx) => {
      for (const source of sourcePublished) {
        const key = `${source.seafoodId}_${source.gradeId}_1`;
        if (targetKeySet.has(key)) {
          skippedCount++;
          continue;
        }

        await tx.dailyRate.create({
          data: {
            rateDate: targetDate,
            seafoodId: source.seafoodId,
            gradeId: source.gradeId,
            purchaseRate: source.purchaseRate,
            sellingRate: source.sellingRate,
            status: DailyRateStatus.DRAFT,
            version: 1
          }
        });
        copiedCount++;
      }
    });

    return {
      copiedCount,
      skippedCount,
      sourceDate: sourceDateStr,
      targetDate: targetDateStr
    };
  }

  async bulkAdjustRates(
    rateDateStr: string,
    percentage: number,
    scope?: { categoryId?: string; gradeId?: string }
  ): Promise<{ updatedCount: number; percentage: number; date: string }> {
    const rateDate = DailyRateService.parseDate(rateDateStr);
    const drafts = await this.repo.findDraftsByDate(rateDate, scope);

    if (drafts.length === 0) {
      throw AppError.badRequest(
        `No draft rates found matching criteria for ${rateDateStr}`,
        'NO_RATES_TO_PUBLISH'
      );
    }

    // Decimal multiplier calculation: (100 + percentage) / 100
    const multiplier = new Prisma.Decimal(100).add(new Prisma.Decimal(percentage)).div(new Prisma.Decimal(100));

    await this.repo.runTransaction(async (tx) => {
      for (const draft of drafts) {
        const newPurchase = draft.purchaseRate
          .mul(multiplier)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const newSelling = draft.sellingRate
          .mul(multiplier)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        await tx.dailyRate.update({
          where: { id: draft.id },
          data: {
            purchaseRate: newPurchase,
            sellingRate: newSelling
          }
        });
      }
    });

    return {
      updatedCount: drafts.length,
      percentage,
      date: rateDateStr
    };
  }

  async getCurrentRate(
    dateStr: string,
    seafoodId: string,
    gradeId: string
  ): Promise<FormattedDailyRate> {
    const rateDate = DailyRateService.parseDate(dateStr);
    const current = await this.repo.findCurrentPublished(rateDate, seafoodId, gradeId);

    if (!current) {
      throw AppError.notFound(
        `No published rate found for this seafood and grade on ${dateStr}`,
        'RATE_NOT_PUBLISHED'
      );
    }

    return DailyRateService.formatRate(current);
  }

  async getRateHistory(params: {
    seafoodId: string;
    gradeId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<FormattedDailyRate[]> {
    const { seafoodId, gradeId, fromDate, toDate } = params;
    const where: Prisma.DailyRateWhereInput = {
      seafoodId,
      status: DailyRateStatus.PUBLISHED,
      deletedAt: null
    };

    if (gradeId) where.gradeId = gradeId;

    if (fromDate || toDate) {
      where.rateDate = {};
      if (fromDate) where.rateDate.gte = DailyRateService.parseDate(fromDate);
      if (toDate) where.rateDate.lte = DailyRateService.parseDate(toDate);
    }

    const items = await this.repo.findMany({
      where,
      orderBy: { rateDate: 'asc' }
    });

    return items.map(DailyRateService.formatRate);
  }

  async deleteDailyRate(id: string): Promise<FormattedDailyRate> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw AppError.notFound(`Daily rate with ID ${id} not found`, 'DAILY_RATE_NOT_FOUND');
    }

    // Historical published rates must NEVER be deleted
    if (existing.status === DailyRateStatus.PUBLISHED) {
      throw AppError.badRequest(
        'Published historical rates cannot be deleted.',
        'RATE_ALREADY_PUBLISHED'
      );
    }

    const deleted = await this.repo.softDelete(id);
    return this.getDailyRateById(deleted.id);
  }
}
