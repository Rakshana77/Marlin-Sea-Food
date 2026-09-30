import { BaseRepository } from './base.repository';
import { Prisma, Customer } from '@prisma/client';

export class CustomerRepository extends BaseRepository {
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CustomerWhereInput;
    orderBy?: Prisma.CustomerOrderByWithRelationInput;
  }): Promise<Customer[]> {
    return this.db.customer.findMany({
      skip: params.skip,
      take: params.take,
      where: { deletedAt: null, ...params.where },
      orderBy: params.orderBy || { createdAt: 'desc' }
    });
  }

  async count(where?: Prisma.CustomerWhereInput): Promise<number> {
    return this.db.customer.count({
      where: { deletedAt: null, ...where }
    });
  }

  async findById(id: string): Promise<Customer | null> {
    return this.db.customer.findFirst({
      where: { id, deletedAt: null }
    });
  }

  async create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return this.db.customer.create({ data });
  }

  async update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return this.db.customer.update({
      where: { id },
      data
    });
  }

  async softDelete(id: string): Promise<Customer> {
    return this.db.customer.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' }
    });
  }
}
