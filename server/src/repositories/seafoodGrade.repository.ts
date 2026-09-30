import { BaseRepository } from './base.repository';
import { Prisma, SeafoodGrade } from '@prisma/client';

export class SeafoodGradeRepository extends BaseRepository {
  async findMany(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.SeafoodGradeWhereInput;
    orderBy?: Prisma.SeafoodGradeOrderByWithRelationInput;
  }): Promise<SeafoodGrade[]> {
    return this.db.seafoodGrade.findMany({
      skip: params?.skip,
      take: params?.take,
      where: { deletedAt: null, ...params?.where },
      orderBy: params?.orderBy || { name: 'asc' }
    });
  }

  async count(where?: Prisma.SeafoodGradeWhereInput): Promise<number> {
    return this.db.seafoodGrade.count({
      where: { deletedAt: null, ...where }
    });
  }

  async findById(id: string): Promise<SeafoodGrade | null> {
    return this.db.seafoodGrade.findFirst({
      where: { id, deletedAt: null }
    });
  }

  async findByName(name: string): Promise<SeafoodGrade | null> {
    return this.db.seafoodGrade.findFirst({
      where: { name, deletedAt: null }
    });
  }

  async create(data: Prisma.SeafoodGradeCreateInput): Promise<SeafoodGrade> {
    return this.db.seafoodGrade.create({ data });
  }

  async update(id: string, data: Prisma.SeafoodGradeUpdateInput): Promise<SeafoodGrade> {
    return this.db.seafoodGrade.update({
      where: { id },
      data
    });
  }

  async softDelete(id: string): Promise<SeafoodGrade> {
    return this.db.seafoodGrade.update({
      where: { id },
      data: { deletedAt: new Date(), active: false }
    });
  }
}
