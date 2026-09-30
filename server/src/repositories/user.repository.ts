import { BaseRepository } from './base.repository';
import { Prisma, User } from '@prisma/client';

export type UserWithoutPassword = Omit<User, 'passwordHash'>;

export class UserRepository extends BaseRepository {
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<UserWithoutPassword[]> {
    return this.db.user.findMany({
      skip: params.skip,
      take: params.take,
      where: { deletedAt: null, ...params.where },
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        status: true,
        lastLoginAt: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true, description: true }
        }
      },
      orderBy: params.orderBy || { createdAt: 'desc' }
    });
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.db.user.count({
      where: { deletedAt: null, ...where }
    });
  }

  async findById(id: string): Promise<UserWithoutPassword | null> {
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        status: true,
        lastLoginAt: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true, description: true }
        }
      }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { email, deletedAt: null }
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<UserWithoutPassword> {
    return this.db.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        status: true,
        lastLoginAt: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true, description: true }
        }
      }
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<UserWithoutPassword> {
    return this.db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        status: true,
        lastLoginAt: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true, description: true }
        }
      }
    });
  }

  async softDelete(id: string): Promise<UserWithoutPassword> {
    return this.db.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        status: true,
        lastLoginAt: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true, description: true }
        }
      }
    });
  }
}
