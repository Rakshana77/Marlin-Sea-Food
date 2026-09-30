import { BaseRepository } from './base.repository';
import { Prisma, Fisherman } from '@prisma/client';

export class FishermanRepository extends BaseRepository {
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.FishermanWhereInput;
    orderBy?: Prisma.FishermanOrderByWithRelationInput;
  }): Promise<Fisherman[]> {
    return this.db.fisherman.findMany({
      skip: params.skip,
      take: params.take,
      where: { deletedAt: null, ...params.where },
      orderBy: params.orderBy || { createdAt: 'desc' }
    });
  }

  async count(where?: Prisma.FishermanWhereInput): Promise<number> {
    return this.db.fisherman.count({
      where: { deletedAt: null, ...where }
    });
  }

  async findById(id: string): Promise<Fisherman | null> {
    return this.db.fisherman.findFirst({
      where: { id, deletedAt: null }
    });
  }

  async findByPhone(countryCode: string, mobileNumber: string): Promise<Fisherman | null> {
    return this.db.fisherman.findFirst({
      where: { countryCode, mobileNumber, deletedAt: null }
    });
  }

  async create(data: Prisma.FishermanCreateInput): Promise<Fisherman> {
    return this.db.fisherman.create({ data });
  }

  async update(id: string, data: Prisma.FishermanUpdateInput): Promise<Fisherman> {
    return this.db.fisherman.update({
      where: { id },
      data
    });
  }

  async softDelete(id: string): Promise<Fisherman> {
    return this.db.fisherman.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' }
    });
  }
}
