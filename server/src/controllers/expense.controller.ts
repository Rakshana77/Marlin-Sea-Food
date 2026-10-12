import { Request, Response } from 'express';
import { ExpenseService } from '../services/expense.service';
import { sendSuccess } from '../utils/response';
import {
  expenseQuerySchema,
  expenseSummaryQuerySchema
} from '../validators/expense.validator';

const service = new ExpenseService();

export class ExpenseController {
  public static async create(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const result = await service.createExpense(req.body, userId);
    return sendSuccess(res, result, 201);
  }

  public static async createWage(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const result = await service.recordWorkerWage(req.body, userId);
    return sendSuccess(res, result, 201);
  }

  public static async cancel(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { reason } = req.body;
    const result = await service.cancelExpense(id, reason, userId);
    return sendSuccess(res, result, 200);
  }

  public static async list(req: Request, res: Response): Promise<Response> {
    const query = expenseQuerySchema.parse(req.query);
    const result = await service.getExpenses(query);
    return sendSuccess(res, result, 200);
  }

  public static async getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const result = await service.getExpenseById(id);
    return sendSuccess(res, result, 200);
  }

  public static async summary(req: Request, res: Response): Promise<Response> {
    const query = expenseSummaryQuerySchema.parse(req.query);
    const result = await service.getExpenseSummary(query);
    return sendSuccess(res, result, 200);
  }
}
