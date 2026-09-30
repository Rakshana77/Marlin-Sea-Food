import { UserRepository, UserWithoutPassword } from '../repositories/user.repository';
import { RoleRepository } from '../repositories/role.repository';
import { AppError } from '../utils/appError';
import { hashPassword } from '../utils/password';
import { Prisma, UserStatus } from '@prisma/client';

export class UserService {
  private readonly repo = new UserRepository();
  private readonly roleRepo = new RoleRepository();

  async getUsers(params: {
    page: number;
    limit: number;
    search?: string;
    roleId?: string;
    status?: UserStatus;
  }): Promise<{ items: UserWithoutPassword[]; total: number; totalPages: number }> {
    const { page, limit, search, roleId, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (status) where.status = status;
    if (roleId) where.roleId = roleId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
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

  async getUserById(id: string): Promise<UserWithoutPassword> {
    const item = await this.repo.findById(id);
    if (!item) {
      throw AppError.notFound(`User with ID ${id} not found`);
    }
    return item;
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    roleId: string;
    status?: UserStatus;
  }): Promise<UserWithoutPassword> {
    const emailNormalized = data.email.toLowerCase().trim();

    // Check duplicate email
    const existing = await this.repo.findByEmail(emailNormalized);
    if (existing) {
      throw AppError.conflict(`User with email '${emailNormalized}' already exists`);
    }

    // Check valid role
    const role = await this.roleRepo.findById(data.roleId);
    if (!role) {
      throw AppError.badRequest(`Role with ID ${data.roleId} does not exist`);
    }

    // Securely hash password
    const passwordHash = await hashPassword(data.password);

    return this.repo.create({
      name: data.name,
      email: emailNormalized,
      passwordHash,
      role: { connect: { id: data.roleId } },
      status: data.status || 'ACTIVE'
    });
  }

  async updateUser(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      roleId: string;
      status: UserStatus;
      password: string;
    }>
  ): Promise<UserWithoutPassword> {
    await this.getUserById(id);

    const updateData: Prisma.UserUpdateInput = {};
    if (data.name) updateData.name = data.name;
    if (data.status) updateData.status = data.status;

    if (data.roleId) {
      const role = await this.roleRepo.findById(data.roleId);
      if (!role) {
        throw AppError.badRequest(`Role with ID ${data.roleId} does not exist`);
      }
      updateData.role = { connect: { id: data.roleId } };
    }

    if (data.email) {
      const emailNormalized = data.email.toLowerCase().trim();
      const existing = await this.repo.findByEmail(emailNormalized);
      if (existing && existing.id !== id) {
        throw AppError.conflict(`User with email '${emailNormalized}' already exists`);
      }
      updateData.email = emailNormalized;
    }

    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    return this.repo.update(id, updateData);
  }

  async deleteUser(id: string): Promise<UserWithoutPassword> {
    await this.getUserById(id);
    return this.repo.softDelete(id);
  }
}
