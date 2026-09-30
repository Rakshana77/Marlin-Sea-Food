import { BaseRepository } from './base.repository';
import { Prisma, DailyRate, DailyRateStatus } from '@prisma/client';

export type DailyRateWithRelations = DailyRate & {
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
};

export class DailyRateRepository extends BaseRepository {
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.DailyRateWhereInput;
    orderBy?: Prisma.DailyRateOrderByWithRelationInput | Prisma.DailyRateOrderByWithRelationInput[];
  }): Promise<DailyRateWithRelations[]> {
    return this.db.dailyRate.findMany({
      skip: params.skip,
      take: params.take,
      where: { deletedAt: null, ...params.where },
      include: {
        seafood: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: { select: { id: true, name: true } }
          }
        },
        grade: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: params.orderBy || [{ rateDate: 'desc' }, { createdAt: 'desc' }]
    });
  }

  async count(where?: Prisma.DailyRateWhereInput): Promise<number> {
    return this.db.dailyRate.count({
      where: { deletedAt: null, ...where }
    });
  }

  async findById(id: string): Promise<DailyRateWithRelations | null> {
    return this.db.dailyRate.findFirst({
      where: { id, deletedAt: null },
      include: {
        seafood: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: { select: { id: true, name: true } }
          }
        },
        grade: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });
  }

  async findActiveByUnique(
    rateDate: Date,
    seafoodId: string,
    gradeId: string,
    version = 1
  ): Promise<DailyRate | null> {
    return this.db.dailyRate.findUnique({
      where: {
        rateDate_seafoodId_gradeId_version: {
          rateDate,
          seafoodId,
          gradeId,
          version
        }
      }
    });
  }

  async findCurrentPublished(
    rateDate: Date,
    seafoodId: string,
    gradeId: string
  ): Promise<DailyRateWithRelations | null> {
    return this.db.dailyRate.findFirst({
      where: {
        rateDate,
        seafoodId,
        gradeId,
        status: DailyRateStatus.PUBLISHED,
        deletedAt: null
      },
      include: {
        seafood: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: { select: { id: true, name: true } }
          }
        },
        grade: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: { version: 'desc' }
    });
  }

  async findDraftsByDate(
    rateDate: Date,
    scope?: { categoryId?: string; gradeId?: string }
  ): Promise<DailyRateWithRelations[]> {
    const where: Prisma.DailyRateWhereInput = {
      rateDate,
      status: DailyRateStatus.DRAFT,
      deletedAt: null
    };

    if (scope?.gradeId) where.gradeId = scope.gradeId;
    if (scope?.categoryId) {
      where.seafood = { categoryId: scope.categoryId };
    }

    return this.db.dailyRate.findMany({
      where,
      include: {
        seafood: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: { select: { id: true, name: true } }
          }
        },
        grade: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });
  }

  async findPublishedByDate(rateDate: Date): Promise<DailyRateWithRelations[]> {
    return this.db.dailyRate.findMany({
      where: {
        rateDate,
        status: DailyRateStatus.PUBLISHED,
        deletedAt: null
      },
      include: {
        seafood: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: { select: { id: true, name: true } }
          }
        },
        grade: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });
  }

  async create(data: Prisma.DailyRateCreateInput): Promise<DailyRate> {
    return this.db.dailyRate.create({ data });
  }

  async update(id: string, data: Prisma.DailyRateUpdateInput): Promise<DailyRate> {
    return this.db.dailyRate.update({
      where: { id },
      data
    });
  }

  async softDelete(id: string): Promise<DailyRate> {
    return this.db.dailyRate.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async runTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.db.$transaction(fn);
  }
}
