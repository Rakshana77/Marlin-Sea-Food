import { Request, Response } from 'express';
import { DayEndService } from '../services/dayEnd.service';
import { sendSuccess } from '../utils/response';
import { dayEndQuerySchema } from '../validators/dayEnd.validator';

const service = new DayEndService();

export class DayEndController {
  public static async preview(req: Request, res: Response): Promise<Response> {
    const { date } = req.params;
    const result = await service.getDayEndPreview(date);
    return sendSuccess(res, result, 200);
  }

  public static async getRecord(req: Request, res: Response): Promise<Response> {
    const { date } = req.params;
    const result = await service.getDayEndRecord(date);
    return sendSuccess(res, result, 200);
  }

  public static async close(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const { date } = req.params;
    const result = await service.closeDay(date, req.body, userId);
    return sendSuccess(res, result, 200);
  }

  public static async reopen(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const { date } = req.params;
    const result = await service.reopenDay(date, req.body, userId);
    return sendSuccess(res, result, 200);
  }

  public static async list(req: Request, res: Response): Promise<Response> {
    const query = dayEndQuerySchema.parse(req.query);
    const result = await service.listDayEnds(query);
    return sendSuccess(res, result, 200);
  }
}
