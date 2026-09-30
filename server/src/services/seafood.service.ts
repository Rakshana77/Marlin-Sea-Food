import { SeafoodRepository } from '../repositories/seafood.repository';
import { SeafoodCategoryRepository } from '../repositories/seafoodCategory.repository';
import { AppError } from '../utils/appError';
import { MasterStatus, Prisma, Seafood } from '@prisma/client';

export class SeafoodService {
  private readonly repo = new SeafoodRepository();
  private readonly categoryRepo = new SeafoodCategoryRepository();

  async getSeafoodList(params: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    status?: MasterStatus;
  }): Promise<{ items: Seafood[]; total: number; totalPages: number }> {
    const { page, limit, search, categoryId, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.SeafoodWhereInput = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [items, total] = await Promise.all([
      this.repo.findMany({ skip, take: limit, where }),
      this.repo.count(where)
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getSeafoodById(id: string): Promise<Seafood> {
    const item = await this.repo.findById(id);
    if (!item) {
      throw AppError.notFound(`Seafood with ID ${id} not found`);
    }
    return item;
  }

  async createSeafood(data: {
    name: string;
    categoryId: string;
    unit?: string;
    status?: MasterStatus;
    description?: string | null;
  }): Promise<Seafood> {
    // Validate category exists
    const category = await this.categoryRepo.findById(data.categoryId);
    if (!category) {
      throw AppError.badRequest(`Category with ID ${data.categoryId} does not exist`);
    }

    return this.repo.create({
      name: data.name,
      category: { connect: { id: data.categoryId } },
      unit: data.unit || 'KG',
      status: data.status || 'ACTIVE',
      description: data.description
    });
  }

  async updateSeafood(
    id: string,
    data: Partial<{
      name: string;
      categoryId: string;
      unit: string;
      status: MasterStatus;
      description: string | null;
    }>
  ): Promise<Seafood> {
    await this.getSeafoodById(id);

    if (data.categoryId) {
      const category = await this.categoryRepo.findById(data.categoryId);
      if (!category) {
        throw AppError.badRequest(`Category with ID ${data.categoryId} does not exist`);
      }
    }

    return this.repo.update(id, data);
  }

  async deleteSeafood(id: string): Promise<Seafood> {
    await this.getSeafoodById(id);
    return this.repo.softDelete(id);
  }
}
