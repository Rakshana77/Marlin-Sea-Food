import { BaseRepository } from './base.repository';
import {
  Prisma,
  FishermanAdvance,
  FishermanAdvanceLedger
} from '@prisma/client';

export type FishermanAdvanceWithRelations = FishermanAdvance & {
  fisherman: {
    id: string;
    name: string;
    countryCode: string;
    mobileNumber: string;
    boatName: string | null;
  };
  createdBy?: {
    id: string;
    name: string;
  } | null;
  ledgerEntries?: FishermanAdvanceLedger[];
};

export type AdvanceLedgerWithRelations = FishermanAdvanceLedger & {
  fisherman: {
    id: string;
    name: string;
    countryCode: string;
    mobileNumber: string;
    boatName: string | null;
  };
  advance?: {
    id: string;
    advanceNumber: string;
    sanctionDate: Date;
    disbursedAmount: Prisma.Decimal;
  } | null;
  createdBy?: {
    id: string;
    name: string;
  } | null;
};

export class FishermanAdvanceRepository extends BaseRepository {
  async findManyAdvances(params: {
    skip?: number;
    take?: number;
    where?: Prisma.FishermanAdvanceWhereInput;
    orderBy?: Prisma.FishermanAdvanceOrderByWithRelationInput;
  }): Promise<FishermanAdvanceWithRelations[]> {
    return this.db.fishermanAdvance.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      include: {
        fisherman: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            mobileNumber: true,
            boatName: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: params.orderBy || { sanctionDate: 'desc' }
    });
  }

  async countAdvances(where?: Prisma.FishermanAdvanceWhereInput): Promise<number> {
    return this.db.fishermanAdvance.count({ where });
  }

  async findAdvanceById(id: string): Promise<FishermanAdvanceWithRelations | null> {
    return this.db.fishermanAdvance.findUnique({
      where: { id },
      include: {
        fisherman: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            mobileNumber: true,
            boatName: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        ledgerEntries: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async findAdvanceByNumber(advanceNumber: string): Promise<FishermanAdvanceWithRelations | null> {
    return this.db.fishermanAdvance.findUnique({
      where: { advanceNumber },
      include: {
        fisherman: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            mobileNumber: true,
            boatName: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async findManyLedgerEntries(params: {
    skip?: number;
    take?: number;
    where?: Prisma.FishermanAdvanceLedgerWhereInput;
    orderBy?: Prisma.FishermanAdvanceLedgerOrderByWithRelationInput;
  }): Promise<AdvanceLedgerWithRelations[]> {
    return this.db.fishermanAdvanceLedger.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      include: {
        fisherman: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            mobileNumber: true,
            boatName: true
          }
        },
        advance: {
          select: {
            id: true,
            advanceNumber: true,
            sanctionDate: true,
            disbursedAmount: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: params.orderBy || [{ createdAt: 'desc' }, { id: 'desc' }]
    });
  }

  async countLedgerEntries(where?: Prisma.FishermanAdvanceLedgerWhereInput): Promise<number> {
    return this.db.fishermanAdvanceLedger.count({ where });
  }

  async getLatestLedgerEntry(
    fishermanId: string,
    tx?: Prisma.TransactionClient
  ): Promise<FishermanAdvanceLedger | null> {
    const client = tx || this.db;
    return client.fishermanAdvanceLedger.findFirst({
      where: { fishermanId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
    });
  }
}
