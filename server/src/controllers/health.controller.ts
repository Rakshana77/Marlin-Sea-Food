import { Request, Response } from 'express';
import { HealthService } from '../services/health.service';
import { sendSuccess } from '../utils/response';

export class HealthController {
  public static async getHealth(_req: Request, res: Response): Promise<Response> {
    const health = await HealthService.getHealth();
    return sendSuccess(res, health);
  }

  public static ping(_req: Request, res: Response): Response {
    return sendSuccess(res, { ping: 'pong', timestamp: new Date().toISOString() });
  }
}
