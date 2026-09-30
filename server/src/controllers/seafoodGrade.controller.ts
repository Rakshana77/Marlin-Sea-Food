import { Request, Response } from 'express';
import { SeafoodGradeService } from '../services/seafoodGrade.service';
import { sendSuccess } from '../utils/response';

const service = new SeafoodGradeService();

export class SeafoodGradeController {
  public static async list(req: Request, res: Response): Promise<Response> {
    const activeOnly = req.query.active === 'true';
    const items = await service.getGrades(activeOnly);
    return sendSuccess(res, items);
  }

  public static async getById(req: Request, res: Response): Promise<Response> {
    const item = await service.getGradeById(req.params.id);
    return sendSuccess(res, item);
  }

  public static async create(req: Request, res: Response): Promise<Response> {
    const created = await service.createGrade(req.body);
    return sendSuccess(res, created, 201);
  }

  public static async update(req: Request, res: Response): Promise<Response> {
    const updated = await service.updateGrade(req.params.id, req.body);
    return sendSuccess(res, updated);
  }

  public static async delete(req: Request, res: Response): Promise<Response> {
    const deleted = await service.deleteGrade(req.params.id);
    return sendSuccess(res, deleted);
  }
}
