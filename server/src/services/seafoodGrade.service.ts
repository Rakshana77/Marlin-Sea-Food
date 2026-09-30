import { SeafoodGradeRepository } from '../repositories/seafoodGrade.repository';
import { AppError } from '../utils/appError';
import { SeafoodGrade } from '@prisma/client';

export class SeafoodGradeService {
  private readonly repo = new SeafoodGradeRepository();

  async getGrades(activeOnly = false): Promise<SeafoodGrade[]> {
    return this.repo.findMany({
      where: activeOnly ? { active: true } : undefined
    });
  }

  async getGradeById(id: string): Promise<SeafoodGrade> {
    const item = await this.repo.findById(id);
    if (!item) {
      throw AppError.notFound(`Seafood grade with ID ${id} not found`);
    }
    return item;
  }

  async createGrade(data: {
    name: string;
    description?: string | null;
    active?: boolean;
  }): Promise<SeafoodGrade> {
    const existing = await this.repo.findByName(data.name);
    if (existing) {
      throw AppError.conflict(`Seafood grade '${data.name}' already exists`);
    }

    return this.repo.create({
      name: data.name,
      description: data.description,
      active: data.active ?? true
    });
  }

  async updateGrade(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      active: boolean;
    }>
  ): Promise<SeafoodGrade> {
    await this.getGradeById(id);

    if (data.name) {
      const existing = await this.repo.findByName(data.name);
      if (existing && existing.id !== id) {
        throw AppError.conflict(`Seafood grade '${data.name}' already exists`);
      }
    }

    return this.repo.update(id, data);
  }

  async deleteGrade(id: string): Promise<SeafoodGrade> {
    await this.getGradeById(id);
    return this.repo.softDelete(id);
  }
}
