import { BaseRepository } from './base.repository';
import { Prisma, SeafoodCategory } from '@prisma/client';

export class SeafoodCategoryRepository extends BaseRepository {
  async findMany(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.SeafoodCategoryWhereInput;
    orderBy?: Prisma.SeafoodCategoryOrderByWithRelationInput;
  }): Promise<SeafoodCategory[]> {
    return this.db.seafoodCategory.findMany({
      skip: params?.skip,
      take: params?.take,
      where: { deletedAt: null, ...params?.where },
      orderBy: params?.orderBy || { name: 'asc' }
    });
  }

  async count(where?: Prisma.SeafoodCategoryWhereInput): Promise<number> {
    return this.db.seafoodCategory.count({
      where: { deletedAt: null, ...where }
    });
  }

  async findById(id: string): Promise<SeafoodCategory | null> {
    return this.db.seafoodCategory.findFirst({
      where: { id, deletedAt: null }
    });
  }

  async findByName(name: string): Promise<SeafoodCategory | null> {
    return this.db.seafoodCategory.findFirst({
      where: { name, deletedAt: null }
    });
  }

  async create(data: Prisma.SeafoodCategoryCreateInput): Promise<SeafoodCategory> {
    return this.db.seafoodCategory.create({ data });
  }

  async update(id: string, data: Prisma.SeafoodCategoryUpdateInput): Promise<SeafoodCategory> {
    return this.db.seafoodCategory.update({
      where: { id },
      data
    });
  }

  async softDelete(id: string): Promise<SeafoodCategory> {
    return this.db.seafoodCategory.update({
      where: { id },
      data: { deletedAt: new Date(), active: false }
    });
  }
}
