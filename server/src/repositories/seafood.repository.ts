import { BaseRepository } from './base.repository';
import { Prisma, Seafood } from '@prisma/client';

export class SeafoodRepository extends BaseRepository {
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.SeafoodWhereInput;
    orderBy?: Prisma.SeafoodOrderByWithRelationInput;
  }): Promise<Seafood[]> {
    return this.db.seafood.findMany({
      skip: params.skip,
      take: params.take,
      where: { deletedAt: null, ...params.where },
      include: {
        category: {
          select: { id: true, name: true }
        }
      },
      orderBy: params.orderBy || { name: 'asc' }
    });
  }

  async count(where?: Prisma.SeafoodWhereInput): Promise<number> {
    return this.db.seafood.count({
      where: { deletedAt: null, ...where }
    });
  }

  async findById(id: string): Promise<Seafood | null> {
    return this.db.seafood.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async create(data: Prisma.SeafoodCreateInput): Promise<Seafood> {
    return this.db.seafood.create({
      data,
      include: {
        category: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async update(id: string, data: Prisma.SeafoodUpdateInput): Promise<Seafood> {
    return this.db.seafood.update({
      where: { id },
      data,
      include: {
        category: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async softDelete(id: string): Promise<Seafood> {
    return this.db.seafood.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' }
    });
  }
}
