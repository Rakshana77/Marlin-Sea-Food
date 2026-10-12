import { BaseRepository } from './base.repository';
import { Prisma, DayEndClosing, DayEndStatus } from '@prisma/client';

export type DayEndWithRelations = DayEndClosing & {
  closedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  reopenedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export class DayEndRepository extends BaseRepository {
  async findByDate(date: Date, tx?: Prisma.TransactionClient): Promise<DayEndWithRelations | null> {
    const client = tx || this.db;
    return client.dayEndClosing.findUnique({
      where: { businessDate: date },
      include: {
        closedBy: { select: { id: true, name: true, email: true } },
        reopenedBy: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async findPreviousClosedDay(beforeDate: Date, tx?: Prisma.TransactionClient): Promise<DayEndClosing | null> {
    const client = tx || this.db;
    return client.dayEndClosing.findFirst({
      where: {
        businessDate: { lt: beforeDate },
        closingStatus: DayEndStatus.CLOSED
      },
      orderBy: { businessDate: 'desc' }
    });
  }

  async upsert(
    data: Prisma.DayEndClosingUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<DayEndWithRelations> {
    const client = tx || this.db;
    return client.dayEndClosing.upsert({
      where: { businessDate: data.businessDate },
      create: data,
      update: data,
      include: {
        closedBy: { select: { id: true, name: true, email: true } },
        reopenedBy: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.DayEndClosingWhereInput;
    orderBy?: Prisma.DayEndClosingOrderByWithRelationInput;
  }): Promise<DayEndWithRelations[]> {
    return this.db.dayEndClosing.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy || { businessDate: 'desc' },
      include: {
        closedBy: { select: { id: true, name: true, email: true } },
        reopenedBy: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async count(where?: Prisma.DayEndClosingWhereInput): Promise<number> {
    return this.db.dayEndClosing.count({ where });
  }
}
