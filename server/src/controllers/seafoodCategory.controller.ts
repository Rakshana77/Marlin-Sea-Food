import { Request, Response } from 'express';
import { SeafoodCategoryService } from '../services/seafoodCategory.service';
import { sendSuccess } from '../utils/response';

const service = new SeafoodCategoryService();

export class SeafoodCategoryController {
  public static async list(req: Request, res: Response): Promise<Response> {
    const activeOnly = req.query.active === 'true';
    const items = await service.getCategories(activeOnly);
    return sendSuccess(res, items);
  }

  public static async getById(req: Request, res: Response): Promise<Response> {
    const item = await service.getCategoryById(req.params.id);
    return sendSuccess(res, item);
  }

  public static async create(req: Request, res: Response): Promise<Response> {
    const created = await service.createCategory(req.body);
    return sendSuccess(res, created, 201);
  }

  public static async update(req: Request, res: Response): Promise<Response> {
    const updated = await service.updateCategory(req.params.id, req.body);
    return sendSuccess(res, updated);
  }

  public static async delete(req: Request, res: Response): Promise<Response> {
    const deleted = await service.deleteCategory(req.params.id);
    return sendSuccess(res, deleted);
  }
}
