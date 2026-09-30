import { BaseRepository } from './base.repository';
import { Prisma, ExportCompany } from '@prisma/client';

export class ExportCompanyRepository extends BaseRepository {
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ExportCompanyWhereInput;
    orderBy?: Prisma.ExportCompanyOrderByWithRelationInput;
  }): Promise<ExportCompany[]> {
    return this.db.exportCompany.findMany({
      skip: params.skip,
      take: params.take,
      where: { deletedAt: null, ...params.where },
      orderBy: params.orderBy || { createdAt: 'desc' }
    });
  }

  async count(where?: Prisma.ExportCompanyWhereInput): Promise<number> {
    return this.db.exportCompany.count({
      where: { deletedAt: null, ...where }
    });
  }

  async findById(id: string): Promise<ExportCompany | null> {
    return this.db.exportCompany.findFirst({
      where: { id, deletedAt: null }
    });
  }

  async create(data: Prisma.ExportCompanyCreateInput): Promise<ExportCompany> {
    return this.db.exportCompany.create({ data });
  }

  async update(id: string, data: Prisma.ExportCompanyUpdateInput): Promise<ExportCompany> {
    return this.db.exportCompany.update({
      where: { id },
      data
    });
  }

  async softDelete(id: string): Promise<ExportCompany> {
    return this.db.exportCompany.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' }
    });
  }
}
