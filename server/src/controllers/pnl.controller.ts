import { Request, Response } from 'express';
import { PnlService } from '../services/pnl.service';
import { sendSuccess } from '../utils/response';
import {
  dailyPnlQuerySchema,
  dateRangePnlQuerySchema
} from '../validators/pnl.validator';

const service = new PnlService();

export class PnlController {
  /**
   * GET /api/pnl/daily?date=YYYY-MM-DD
   * Return single-day P&L report
   */
  public static async getDaily(req: Request, res: Response): Promise<Response> {
    const validated = dailyPnlQuerySchema.parse(req.query);
    const result = await service.getDailyPnl(validated.date);
    return sendSuccess(res, result, 200);
  }

  /**
   * GET /api/pnl/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * or GET /api/pnl?startDate=...
   * Return date-range P&L report
   */
  public static async getDateRange(req: Request, res: Response): Promise<Response> {
    const validated = dateRangePnlQuerySchema.parse(req.query);
    const result = await service.getDateRangePnl(validated.startDate, validated.endDate);
    return sendSuccess(res, result, 200);
  }

  /**
   * GET /api/pnl/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * Return high-level summary only
   */
  public static async getSummary(req: Request, res: Response): Promise<Response> {
    const validated = dateRangePnlQuerySchema.parse(req.query);
    const result = await service.getPnlSummary(validated.startDate, validated.endDate);
    return sendSuccess(res, result, 200);
  }

  /**
   * GET /api/pnl/breakdown?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * Return detailed breakdowns only
   */
  public static async getBreakdowns(req: Request, res: Response): Promise<Response> {
    const validated = dateRangePnlQuerySchema.parse(req.query);
    const result = await service.getPnlBreakdowns(validated.startDate, validated.endDate);
    return sendSuccess(res, result, 200);
  }
}
