import { SeafoodCategoryRepository } from '../repositories/seafoodCategory.repository';
import { AppError } from '../utils/appError';
import { SeafoodCategory } from '@prisma/client';

export class SeafoodCategoryService {
  private readonly repo = new SeafoodCategoryRepository();

  async getCategories(activeOnly = false): Promise<SeafoodCategory[]> {
    return this.repo.findMany({
      where: activeOnly ? { active: true } : undefined
    });
  }

  async getCategoryById(id: string): Promise<SeafoodCategory> {
    const item = await this.repo.findById(id);
    if (!item) {
      throw AppError.notFound(`Seafood category with ID ${id} not found`);
    }
    return item;
  }

  async createCategory(data: {
    name: string;
    description?: string | null;
    active?: boolean;
  }): Promise<SeafoodCategory> {
    const existing = await this.repo.findByName(data.name);
    if (existing) {
      throw AppError.conflict(`Seafood category '${data.name}' already exists`);
    }

    return this.repo.create({
      name: data.name,
      description: data.description,
      active: data.active ?? true
    });
  }

  async updateCategory(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      active: boolean;
    }>
  ): Promise<SeafoodCategory> {
    await this.getCategoryById(id);

    if (data.name) {
      const existing = await this.repo.findByName(data.name);
      if (existing && existing.id !== id) {
        throw AppError.conflict(`Seafood category '${data.name}' already exists`);
      }
    }

    return this.repo.update(id, data);
  }

  async deleteCategory(id: string): Promise<SeafoodCategory> {
    await this.getCategoryById(id);
    return this.repo.softDelete(id);
  }
}
