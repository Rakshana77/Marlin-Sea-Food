import { Request, Response } from 'express';
import { FishermanAdvanceService } from '../services/fishermanAdvance.service';
import { sendSuccess } from '../utils/response';
import { AdvanceStatus, AdvancePaymentMethod, AdvanceEntryType, LedgerDirection } from '@prisma/client';

const service = new FishermanAdvanceService();

export class FishermanAdvanceController {
  /**
   * Disburse a new advance to a fisherman.
   */
  public static async disburse(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const fishermanId = req.params.fishermanId || req.params.id || req.body.fishermanId;
    const result = await service.disburseAdvance({ ...req.body, fishermanId }, userId);
    return sendSuccess(res, result, 201);
  }

  /**
   * Record direct cash repayment from a fisherman.
   */
  public static async repay(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const fishermanId = req.params.fishermanId || req.params.id || req.body.fishermanId;
    const result = await service.recordCashRepayment({ ...req.body, fishermanId }, userId);
    return sendSuccess(res, result, 200);
  }

  /**
   * Cancel / void an advance disbursement.
   */
  public static async cancel(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const advanceId = req.params.advanceId || req.params.id;
    const fishermanId = req.params.advanceId ? req.params.id : (req.params.fishermanId || req.body.fishermanId);
    const reason = req.body.reason;
    const result = await service.cancelAdvance({ advanceId, fishermanId, reason }, userId);
    return sendSuccess(res, result, 200);
  }

  /**
   * Write off unrecoverable fisherman advance debt.
   */
  public static async writeOff(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const result = await service.writeOffAdvance(req.body, userId);
    return sendSuccess(res, result, 200);
  }

  /**
   * List advance agreements with pagination and filtering.
   */
  public static async list(req: Request, res: Response): Promise<Response> {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const fishermanId = req.query.fishermanId as string | undefined;
    const status = req.query.status as AdvanceStatus | undefined;
    const paymentMethod = req.query.paymentMethod as AdvancePaymentMethod | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await service.getAdvancesList({
      page,
      limit,
      fishermanId,
      status,
      paymentMethod,
      fromDate,
      toDate,
      search
    });

    return sendSuccess(res, result.items, 200, {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages
    });
  }

  /**
   * Get single advance record by ID.
   */
  public static async getById(req: Request, res: Response): Promise<Response> {
    const advance = await service.getAdvanceById(req.params.id);
    return sendSuccess(res, advance);
  }

  /**
   * Get current outstanding advance balance and summary for a fisherman.
   */
  public static async getBalance(req: Request, res: Response): Promise<Response> {
    const fishermanId = req.params.fishermanId || req.params.id;
    const summary = await service.getFishermanAdvanceBalance(fishermanId);
    return sendSuccess(res, summary);
  }

  /**
   * Global audit query for Advance Ledger entries.
   */
  public static async getLedger(req: Request, res: Response): Promise<Response> {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const fishermanId = req.query.fishermanId as string | undefined;
    const advanceId = req.query.advanceId as string | undefined;
    const entryType = req.query.entryType as AdvanceEntryType | undefined;
    const direction = req.query.direction as LedgerDirection | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;

    const result = await service.getAdvanceLedger({
      page,
      limit,
      fishermanId,
      advanceId,
      entryType,
      direction,
      fromDate,
      toDate
    });

    return sendSuccess(res, result.items, 200, {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages
    });
  }

  /**
   * Get complete advance ledger for a specific fisherman.
   */
  public static async getFishermanLedger(req: Request, res: Response): Promise<Response> {
    const fishermanId = req.params.fishermanId;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const advanceId = req.query.advanceId as string | undefined;
    const entryType = req.query.entryType as AdvanceEntryType | undefined;
    const direction = req.query.direction as LedgerDirection | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;

    const result = await service.getAdvanceLedger({
      page,
      limit,
      fishermanId,
      advanceId,
      entryType,
      direction,
      fromDate,
      toDate
    });

    return sendSuccess(res, result.items, 200, {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages
    });
  }

  /**
   * Get advances specifically for a fisherman.
   */
  public static async getFishermanAdvances(req: Request, res: Response): Promise<Response> {
    const fishermanId = req.params.fishermanId || req.params.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const status = req.query.status as AdvanceStatus | undefined;
    const paymentMethod = req.query.paymentMethod as AdvancePaymentMethod | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await service.getAdvancesList({
      page,
      limit,
      fishermanId,
      status,
      paymentMethod,
      fromDate,
      toDate,
      search
    });

    return sendSuccess(res, result.items, 200, {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages
    });
  }
}
