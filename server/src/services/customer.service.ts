import { CustomerRepository } from '../repositories/customer.repository';
import { AppError } from '../utils/appError';
import { Customer, MasterStatus, Prisma } from '@prisma/client';

export class CustomerService {
  private readonly repo = new CustomerRepository();

  async getCustomers(params: {
    page: number;
    limit: number;
    search?: string;
    status?: MasterStatus;
  }): Promise<{ items: Customer[]; total: number; totalPages: number }> {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
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

  async getCustomerById(id: string): Promise<Customer> {
    const item = await this.repo.findById(id);
    if (!item) {
      throw AppError.notFound(`Customer with ID ${id} not found`);
    }
    return item;
  }

  async createCustomer(data: {
    name: string;
    countryCode?: string;
    mobileNumber: string;
    email?: string | null;
    address?: string | null;
  }): Promise<Customer> {
    return this.repo.create({
      name: data.name,
      countryCode: data.countryCode || '+91',
      mobileNumber: data.mobileNumber,
      email: data.email,
      address: data.address
    });
  }

  async updateCustomer(
    id: string,
    data: Partial<{
      name: string;
      countryCode: string;
      mobileNumber: string;
      email: string | null;
      address: string | null;
      status: MasterStatus;
    }>
  ): Promise<Customer> {
    await this.getCustomerById(id);
    return this.repo.update(id, data);
  }

  async deleteCustomer(id: string): Promise<Customer> {
    await this.getCustomerById(id);
    return this.repo.softDelete(id);
  }
}
