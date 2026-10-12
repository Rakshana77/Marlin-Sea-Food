import { BaseRepository } from './base.repository';
import { Prisma, Expense } from '@prisma/client';

export type ExpenseWithRelations = Expense & {
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  cancelledBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export class ExpenseRepository extends BaseRepository {
  async findById(id: string, tx?: Prisma.TransactionClient): Promise<ExpenseWithRelations | null> {
    const client = tx || this.db;
    return client.expense.findFirst({
      where: {
        OR: [{ id }, { expenseNumber: id }]
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        cancelledBy: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async findByIdempotencyKey(key: string, tx?: Prisma.TransactionClient): Promise<ExpenseWithRelations | null> {
    const client = tx || this.db;
    return client.expense.findUnique({
      where: { idempotencyKey: key },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        cancelledBy: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ExpenseWhereInput;
    orderBy?: Prisma.ExpenseOrderByWithRelationInput | Prisma.ExpenseOrderByWithRelationInput[];
  }): Promise<ExpenseWithRelations[]> {
    return this.db.expense.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy || [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        cancelledBy: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async count(where?: Prisma.ExpenseWhereInput): Promise<number> {
    return this.db.expense.count({ where });
  }

  async create(data: Prisma.ExpenseUncheckedCreateInput, tx?: Prisma.TransactionClient): Promise<ExpenseWithRelations> {
    const client = tx || this.db;
    return client.expense.create({
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        cancelledBy: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async update(id: string, data: Prisma.ExpenseUncheckedUpdateInput, tx?: Prisma.TransactionClient): Promise<ExpenseWithRelations> {
    const client = tx || this.db;
    return client.expense.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        cancelledBy: { select: { id: true, name: true, email: true } }
      }
    });
  }
}
