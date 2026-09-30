import { BaseRepository } from './base.repository';
import { Permission } from '@prisma/client';

export class PermissionRepository extends BaseRepository {
  async findMany(): Promise<Permission[]> {
    return this.db.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }]
    });
  }

  async findByCode(code: string): Promise<Permission | null> {
    return this.db.permission.findUnique({
      where: { code }
    });
  }
}
