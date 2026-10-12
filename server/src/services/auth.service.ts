import { prisma } from '../lib/prisma';
import { AppError } from '../utils/appError';
import { verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { LoginInput } from '../validators/auth.validator';
import { UserStatus } from '@prisma/client';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: UserStatus;
    permissions?: string[];
  };
}

export class AuthService {
  async login(input: LoginInput): Promise<AuthResponse> {
    const emailNormalized = input.email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        email: emailNormalized,
        deletedAt: null
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw AppError.unauthorized('Your user account is suspended or inactive', 'ACCOUNT_INACTIVE');
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const permissions = user.role.permissions?.map((p) => p.permission.code) || [];

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        status: user.status,
        permissions
      }
    };
  }

  async getProfile(userId: string): Promise<AuthResponse['user']> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      status: user.status,
      permissions: user.role.permissions?.map((p) => p.permission.code) || []
    };
  }
}
