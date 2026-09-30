import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { UserStatus } from '@prisma/client';

const service = new UserService();

export class UserController {
  public static async list(req: Request, res: Response): Promise<Response> {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = req.query.search as string | undefined;
    const roleId = req.query.roleId as string | undefined;
    const status = req.query.status as UserStatus | undefined;

    const result = await service.getUsers({ page, limit, search, roleId, status });
    return sendSuccess(res, result.items, 200, {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages
    });
  }

  public static async getById(req: Request, res: Response): Promise<Response> {
    const item = await service.getUserById(req.params.id);
    return sendSuccess(res, item);
  }

  public static async create(req: Request, res: Response): Promise<Response> {
    const created = await service.createUser(req.body);
    return sendSuccess(res, created, 201);
  }

  public static async update(req: Request, res: Response): Promise<Response> {
    const updated = await service.updateUser(req.params.id, req.body);
    return sendSuccess(res, updated);
  }

  public static async delete(req: Request, res: Response): Promise<Response> {
    const deleted = await service.deleteUser(req.params.id);
    return sendSuccess(res, deleted);
  }
}
