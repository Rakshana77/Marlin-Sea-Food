import { RoleRepository } from '../repositories/role.repository';
import { AppError } from '../utils/appError';
import { Role } from '@prisma/client';

export class RoleService {
  private readonly repo = new RoleRepository();

  async getRoles(): Promise<Role[]> {
    return this.repo.findMany();
  }

  async getRoleById(id: string): Promise<Role> {
    const role = await this.repo.findById(id);
    if (!role) {
      throw AppError.notFound(`Role with ID ${id} not found`);
    }
    return role;
  }

  async createRole(data: {
    name: string;
    description?: string | null;
    permissionIds?: string[];
  }): Promise<Role> {
    const existing = await this.repo.findByName(data.name);
    if (existing) {
      throw AppError.conflict(`Role '${data.name}' already exists`);
    }

    return this.repo.create({
      name: data.name,
      description: data.description,
      permissions: data.permissionIds?.length
        ? {
            create: data.permissionIds.map((pId) => ({
              permission: { connect: { id: pId } }
            }))
          }
        : undefined
    });
  }
}
