import { Request, Response } from 'express';
import { PurchaseBillService } from '../services/purchaseBill.service';
import { sendSuccess } from '../utils/response';
import { PurchaseBillStatus, PaymentStatus } from '@prisma/client';

const service = new PurchaseBillService();

export class PurchaseBillController {
  public static async list(req: Request, res: Response): Promise<Response> {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const billDate = req.query.billDate as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const fishermanId = req.query.fishermanId as string | undefined;
    const status = req.query.status as PurchaseBillStatus | undefined;
    const paymentStatus = req.query.paymentStatus as PaymentStatus | undefined;
    const search = req.query.search as string | undefined;

    const result = await service.getPurchaseBills({
      page,
      limit,
      billDate,
      fromDate,
      toDate,
      fishermanId,
      status,
      paymentStatus,
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
    const bill = await service.getPurchaseBillById(req.params.id);
    return sendSuccess(res, bill);
  }

  public static async create(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const bill = await service.createPurchaseBill(req.body, userId);
    return sendSuccess(res, bill, 201);
  }

  public static async update(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const bill = await service.updatePurchaseBill(req.params.id, req.body, userId);
    return sendSuccess(res, bill);
  }
}
