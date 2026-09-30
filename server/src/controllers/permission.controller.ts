import { Request, Response } from 'express';
import { PermissionService } from '../services/permission.service';
import { sendSuccess } from '../utils/response';

const service = new PermissionService();

export class PermissionController {
  public static async list(_req: Request, res: Response): Promise<Response> {
    const permissions = await service.getPermissions();
    return sendSuccess(res, permissions);
  }
}
