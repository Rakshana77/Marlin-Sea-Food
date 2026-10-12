import { ExportCompanyRepository } from '../repositories/exportCompany.repository';
import { AppError } from '../utils/appError';
import { ExportCompany, MasterStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class ExportCompanyService {
  private readonly repo = new ExportCompanyRepository();

  async getExportCompanies(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: MasterStatus;
  }): Promise<{ items: ExportCompany[]; total: number; totalPages: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const { search, status } = params;
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
      throw AppError.notFound(`Export Company with ID ${id} not found`, 'EXPORT_COMPANY_NOT_FOUND');
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
    const trimmedName = data.companyName.trim();
    if (!trimmedName) {
      throw AppError.badRequest('Company name is required', 'INVALID_COMPANY_NAME');
    }

    // Check for duplicate active company name
    const existing = await prisma.exportCompany.findFirst({
      where: {
        companyName: { equals: trimmedName, mode: 'insensitive' },
        deletedAt: null
      }
    });

    if (existing) {
      throw AppError.conflict('An active export company with this name already exists', 'DUPLICATE_EXPORT_COMPANY');
    }

    return this.repo.create({
      companyName: trimmedName,
      contactPerson: data.contactPerson?.trim() || null,
      countryCode: data.countryCode?.trim() || '+91',
      mobileNumber: data.mobileNumber?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      taxNumber: data.taxNumber?.trim() || null
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

    if (data.companyName !== undefined) {
      const trimmedName = data.companyName.trim();
      if (!trimmedName) {
        throw AppError.badRequest('Company name cannot be empty', 'INVALID_COMPANY_NAME');
      }

      const duplicate = await prisma.exportCompany.findFirst({
        where: {
          id: { not: id },
          companyName: { equals: trimmedName, mode: 'insensitive' },
          deletedAt: null
        }
      });

      if (duplicate) {
        throw AppError.conflict('Another active export company with this name already exists', 'DUPLICATE_EXPORT_COMPANY');
      }

      data.companyName = trimmedName;
    }

    return this.repo.update(id, data);
  }

  async deleteExportCompany(id: string): Promise<ExportCompany> {
    await this.getExportCompanyById(id);

    // Safeguard: Check if company is referenced by historical sales
    const salesCount = await prisma.sale.count({
      where: {
        exportCompanyId: id,
        deletedAt: null
      }
    });

    if (salesCount > 0) {
      throw AppError.badRequest(
        'Cannot delete export company that has existing sales transactions. Deactivate the company instead.',
        'EXPORT_COMPANY_HAS_SALES'
      );
    }

    return this.repo.softDelete(id);
  }
}
