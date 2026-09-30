import { BaseRepository } from './base.repository';
import { Prisma, Role } from '@prisma/client';

export class RoleRepository extends BaseRepository {
  async findMany(): Promise<Role[]> {
    return this.db.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: string): Promise<Role | null> {
    return this.db.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.db.role.findUnique({
      where: { name }
    });
  }

  async create(data: Prisma.RoleCreateInput): Promise<Role> {
    return this.db.role.create({
      data,
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }
}
