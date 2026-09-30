import { Request, Response } from 'express';
import { SaleService } from '../services/sale.service';
import { sendSuccess } from '../utils/response';
import { SaleStatus, PaymentStatus } from '@prisma/client';

const service = new SaleService();

export class SaleController {
  public static async list(req: Request, res: Response): Promise<Response> {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const date = req.query.date as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const customerId = req.query.customerId as string | undefined;
    const seafoodId = req.query.seafoodId as string | undefined;
    const gradeId = req.query.gradeId as string | undefined;
    const status = req.query.status as SaleStatus | undefined;
    const paymentStatus = req.query.paymentStatus as PaymentStatus | undefined;
    const search = req.query.search as string | undefined;

    const result = await service.getSalesList({
      page,
      limit,
      date,
      fromDate,
      toDate,
      customerId,
      seafoodId,
      gradeId,
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
    const sale = await service.getSaleById(req.params.id);
    return sendSuccess(res, sale);
  }

  public static async create(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const sale = await service.createSale(req.body, userId);
    return sendSuccess(res, sale, 201);
  }

  public static async cancel(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const sale = await service.cancelSale(req.params.id, userId);
    return sendSuccess(res, sale, 200);
  }
}