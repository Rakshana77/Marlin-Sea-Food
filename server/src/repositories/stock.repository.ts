import { BaseRepository } from './base.repository';
import { Prisma, Stock, StockMovement } from '@prisma/client';

export type StockWithRelations = Stock & {
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

export type StockMovementWithRelations = StockMovement & {
  seafood: {
    id: string;
    name: string;
    unit: string;
    category?: {
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

export class StockRepository extends BaseRepository {
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.StockWhereInput;
    orderBy?: Prisma.StockOrderByWithRelationInput;
  }): Promise<StockWithRelations[]> {
    return this.db.stock.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      include: {
        seafood: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
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
      orderBy: params.orderBy || { updatedAt: 'desc' }
    });
  }

  async count(where?: Prisma.StockWhereInput): Promise<number> {
    return this.db.stock.count({ where });
  }

  async findById(id: string): Promise<StockWithRelations | null> {
    return this.db.stock.findUnique({
      where: { id },
      include: {
        seafood: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
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

  async findBySeafoodAndGrade(
    seafoodId: string,
    gradeId: string,
    tx?: Prisma.TransactionClient
  ): Promise<Stock | null> {
    const client = tx || this.db;
    return client.stock.findUnique({
      where: {
        seafoodId_gradeId: {
          seafoodId,
          gradeId
        }
      }
    });
  }

  async findBySeafoodAndGradeWithRelations(
    seafoodId: string,
    gradeId: string
  ): Promise<StockWithRelations | null> {
    return this.db.stock.findUnique({
      where: {
        seafoodId_gradeId: {
          seafoodId,
          gradeId
        }
      },
      include: {
        seafood: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
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

  async findMovements(params: {
    skip?: number;
    take?: number;
    where?: Prisma.StockMovementWhereInput;
    orderBy?: Prisma.StockMovementOrderByWithRelationInput;
  }): Promise<StockMovementWithRelations[]> {
    return this.db.stockMovement.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      include: {
        seafood: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
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
      orderBy: params.orderBy || { movementDate: 'desc' }
    });
  }

  async countMovements(where?: Prisma.StockMovementWhereInput): Promise<number> {
    return this.db.stockMovement.count({ where });
  }

  async createMovement(
    data: Prisma.StockMovementUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<StockMovement> {
    const client = tx || this.db;
    return client.stockMovement.create({ data });
  }
}
