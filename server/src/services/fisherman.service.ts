import { FishermanRepository } from '../repositories/fisherman.repository';
import { AppError } from '../utils/appError';
import { Fisherman, MasterStatus, Prisma } from '@prisma/client';

export class FishermanService {
  private readonly repo = new FishermanRepository();

  async getFishermen(params: {
    page: number;
    limit: number;
    search?: string;
    status?: MasterStatus;
  }): Promise<{ items: Fisherman[]; total: number; totalPages: number }> {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.FishermanWhereInput = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search } },
        { boatName: { contains: search, mode: 'insensitive' } }
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

  async getFishermanById(id: string): Promise<Fisherman> {
    const item = await this.repo.findById(id);
    if (!item) {
      throw AppError.notFound(`Fisherman with ID ${id} not found`);
    }
    return item;
  }

  async createFisherman(data: {
    name: string;
    countryCode?: string;
    mobileNumber: string;
    boatName?: string | null;
    boatRegistration?: string | null;
    address?: string | null;
    notes?: string | null;
  }): Promise<Fisherman> {
    const countryCode = data.countryCode || '+91';

    // Check uniqueness strategy
    const existing = await this.repo.findByPhone(countryCode, data.mobileNumber);
    if (existing) {
      throw AppError.conflict(
        `Fisherman with mobile number ${countryCode} ${data.mobileNumber} already exists`
      );
    }

    return this.repo.create({
      name: data.name,
      countryCode,
      mobileNumber: data.mobileNumber,
      boatName: data.boatName,
      boatRegistration: data.boatRegistration,
      address: data.address,
      notes: data.notes
    });
  }

  async updateFisherman(
    id: string,
    data: Partial<{
      name: string;
      countryCode: string;
      mobileNumber: string;
      boatName: string | null;
      boatRegistration: string | null;
      address: string | null;
      notes: string | null;
      status: MasterStatus;
    }>
  ): Promise<Fisherman> {
    await this.getFishermanById(id);

    if (data.mobileNumber) {
      const countryCode = data.countryCode || '+91';
      const existing = await this.repo.findByPhone(countryCode, data.mobileNumber);
      if (existing && existing.id !== id) {
        throw AppError.conflict(
          `Another fisherman with mobile number ${countryCode} ${data.mobileNumber} already exists`
        );
      }
    }

    return this.repo.update(id, data);
  }

  async deleteFisherman(id: string): Promise<Fisherman> {
    await this.getFishermanById(id);
    return this.repo.softDelete(id);
  }
}
