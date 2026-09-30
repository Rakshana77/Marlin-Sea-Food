import { Request, Response } from 'express';
import { StockService } from '../services/stock.service';
import { sendSuccess } from '../utils/response';
import { StockMovementType } from '@prisma/client';

const service = new StockService();

export class StockController {
  public static async list(req: Request, res: Response): Promise<Response> {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const seafoodId = req.query.seafoodId as string | undefined;
    const gradeId = req.query.gradeId as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await service.getStockList({
      page,
      limit,
      seafoodId,
      gradeId,
      categoryId,
      search
    });

    return sendSuccess(res, result.items, 200, {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages
    });
  }

  public static async getById(req: Request, res: Response): Promise<Response> {
    const stock = await service.getStockById(req.params.id);
    return sendSuccess(res, stock);
  }

  public static async getBySeafoodAndGrade(req: Request, res: Response): Promise<Response> {
    const { seafoodId, gradeId } = req.params;
    const result = await service.getStockBySeafoodAndGrade(seafoodId, gradeId);
    return sendSuccess(res, result);
  }

  public static async getMovements(req: Request, res: Response): Promise<Response> {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const seafoodId = req.query.seafoodId as string | undefined;
    const gradeId = req.query.gradeId as string | undefined;
    const movementType = req.query.movementType as StockMovementType | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const referenceType = req.query.referenceType as string | undefined;

    const result = await service.getStockMovements({
      page,
      limit,
      seafoodId,
      gradeId,
      movementType,
      fromDate,
      toDate,
      referenceType
    });

    return sendSuccess(res, result.items, 200, {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages
    });
  }
}
