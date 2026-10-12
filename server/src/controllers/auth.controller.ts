import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';

const authService = new AuthService();

export class AuthController {
  public static async login(req: Request, res: Response): Promise<Response> {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, 200);
  }

  public static async me(req: Request, res: Response): Promise<Response> {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const profile = await authService.getProfile(userId);
    return sendSuccess(res, profile, 200);
  }
}
