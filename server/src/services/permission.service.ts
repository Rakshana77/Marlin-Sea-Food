import { PermissionRepository } from '../repositories/permission.repository';
import { Permission } from '@prisma/client';

export class PermissionService {
  private readonly repo = new PermissionRepository();

  async getPermissions(): Promise<Permission[]> {
    return this.repo.findMany();
  }
}
