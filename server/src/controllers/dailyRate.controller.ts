import { Request, Response } from 'express';
import { DailyRateService } from '../services/dailyRate.service';
import { sendSuccess } from '../utils/response';
import { DailyRateStatus } from '@prisma/client';

const service = new DailyRateService();

export class DailyRateController {
  public static async list(req: Request, res: Response): Promise<Response> {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const date = req.query.date as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const seafoodId = req.query.seafoodId as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const gradeId = req.query.gradeId as string | undefined;
    const status = req.query.status as DailyRateStatus | undefined;
    const search = req.query.search as string | undefined;

    const result = await service.getDailyRates({
      page,
      limit,
      date,
      fromDate,
      toDate,
      seafoodId,
      categoryId,
      gradeId,
      status,
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
    const item = await service.getDailyRateById(req.params.id);
    return sendSuccess(res, item);
  }

  public static async create(req: Request, res: Response): Promise<Response> {
    const created = await service.createDailyRate(req.body);
    return sendSuccess(res, created, 201);
  }

  public static async update(req: Request, res: Response): Promise<Response> {
    const updated = await service.updateDraftRate(req.params.id, req.body);
    return sendSuccess(res, updated);
  }

  public static async publish(req: Request, res: Response): Promise<Response> {
    const published = await service.publishRate(req.params.id);
    return sendSuccess(res, published);
  }

  public static async publishAll(req: Request, res: Response): Promise<Response> {
    const result = await service.publishAllForDate(req.body.rateDate);
    return sendSuccess(res, result);
  }

  public static async copyYesterday(req: Request, res: Response): Promise<Response> {
    const result = await service.copyYesterdayRates(req.body.sourceDate, req.body.targetDate);
    return sendSuccess(res, result);
  }

  public static async bulkAdjust(req: Request, res: Response): Promise<Response> {
    const { rateDate, percentage, scope } = req.body;
    const result = await service.bulkAdjustRates(rateDate, percentage, scope);
    return sendSuccess(res, result);
  }

  public static async getCurrent(req: Request, res: Response): Promise<Response> {
    const date = req.query.date as string;
    const seafoodId = req.query.seafoodId as string;
    const gradeId = req.query.gradeId as string;

    const current = await service.getCurrentRate(date, seafoodId, gradeId);
    return sendSuccess(res, current);
  }

  public static async getHistory(req: Request, res: Response): Promise<Response> {
    const seafoodId = req.query.seafoodId as string;
    const gradeId = req.query.gradeId as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;

    const history = await service.getRateHistory({
      seafoodId,
      gradeId,
      fromDate,
      toDate
    });

    return sendSuccess(res, history);
  }

  public static async delete(req: Request, res: Response): Promise<Response> {
    const deleted = await service.deleteDailyRate(req.params.id);
    return sendSuccess(res, deleted);
  }
}
