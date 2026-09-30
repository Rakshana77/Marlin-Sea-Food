import { Request, Response } from 'express';
import { RoleService } from '../services/role.service';
import { sendSuccess } from '../utils/response';

const service = new RoleService();

export class RoleController {
  public static async list(_req: Request, res: Response): Promise<Response> {
    const roles = await service.getRoles();
    return sendSuccess(res, roles);
  }

  public static async getById(req: Request, res: Response): Promise<Response> {
    const role = await service.getRoleById(req.params.id);
    return sendSuccess(res, role);
  }

  public static async create(req: Request, res: Response): Promise<Response> {
    const created = await service.createRole(req.body);
    return sendSuccess(res, created, 201);
  }
}
