import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { sendSuccess } from '../utils/response';
import { MasterStatus } from '@prisma/client';

const service = new CustomerService();

export class CustomerController {
  public static async list(req: Request, res: Response): Promise<Response> {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = req.query.search as string | undefined;
    const status = req.query.status as MasterStatus | undefined;

    const result = await service.getCustomers({ page, limit, search, status });
    return sendSuccess(res, result.items, 200, {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages
    });
  }

  public static async getById(req: Request, res: Response): Promise<Response> {
    const item = await service.getCustomerById(req.params.id);
    return sendSuccess(res, item);
  }

  public static async create(req: Request, res: Response): Promise<Response> {
    const created = await service.createCustomer(req.body);
    return sendSuccess(res, created, 201);
  }

  public static async update(req: Request, res: Response): Promise<Response> {
    const updated = await service.updateCustomer(req.params.id, req.body);
    return sendSuccess(res, updated);
  }

  public static async delete(req: Request, res: Response): Promise<Response> {
    const deleted = await service.deleteCustomer(req.params.id);
    return sendSuccess(res, deleted);
  }
}
