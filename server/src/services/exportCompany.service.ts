import { ExportCompanyRepository } from '../repositories/exportCompany.repository';
import { AppError } from '../utils/appError';
import { ExportCompany, MasterStatus, Prisma } from '@prisma/client';

export class ExportCompanyService {
  private readonly repo = new ExportCompanyRepository();

  async getExportCompanies(params: {
    page: number;
    limit: number;
    search?: string;
    status?: MasterStatus;
  }): Promise<{ items: ExportCompany[]; total: number; totalPages: number }> {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ExportCompanyWhereInput = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { taxNumber: { contains: search, mode: 'insensitive' } }
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

  async getExportCompanyById(id: string): Promise<ExportCompany> {
    const item = await this.repo.findById(id);
    if (!item) {
      throw AppError.notFound(`Export Company with ID ${id} not found`);
    }
    return item;
  }

  async createExportCompany(data: {
    companyName: string;
    contactPerson?: string | null;
    countryCode?: string;
    mobileNumber?: string | null;
    email?: string | null;
    address?: string | null;
    taxNumber?: string | null;
  }): Promise<ExportCompany> {
    return this.repo.create({
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      countryCode: data.countryCode || '+91',
      mobileNumber: data.mobileNumber,
      email: data.email,
      address: data.address,
      taxNumber: data.taxNumber
    });
  }

  async updateExportCompany(
    id: string,
    data: Partial<{
      companyName: string;
      contactPerson: string | null;
      countryCode: string;
      mobileNumber: string | null;
      email: string | null;
      address: string | null;
      taxNumber: string | null;
      status: MasterStatus;
    }>
  ): Promise<ExportCompany> {
    await this.getExportCompanyById(id);
    return this.repo.update(id, data);
  }

  async deleteExportCompany(id: string): Promise<ExportCompany> {
    await this.getExportCompanyById(id);
    return this.repo.softDelete(id);
  }
}
