import { Prisma, ExpenseCategory, ExpensePaymentMethod, ExpenseStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/appError';
import { ExpenseRepository, ExpenseWithRelations } from '../repositories/expense.repository';
import { generateExpenseNumber } from '../utils/billNumber';
import { assertBusinessDateOpen } from '../utils/dayEnd';
import { DailyRateService } from './dailyRate.service';
import {
  CreateExpenseInput,
  CreateWorkerWageInput,
  ExpenseQueryParams,
  ExpenseSummaryQueryParams
} from '../validators/expense.validator';

export interface FormattedExpense {
  id: string;
  expenseNumber: string;
  idempotencyKey?: string | null;
  expenseDate: string;
  category: ExpenseCategory;
  amount: string;
  paymentMethod: ExpensePaymentMethod;
  recipient: string;
  status: ExpenseStatus;
  reference?: string | null;
  notes?: string | null;
  createdById?: string | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  cancelledById?: string | null;
  cancelledBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummaryReport {
  dateRange: {
    from: string;
    to: string;
  };
  totalOpex: string;
  cashOpex: string;
  upiOpex: string;
  bankOpex: string;
  workerWages: string;
  otherOpex: string;
  activeCount: number;
  cancelledCount: number;
  cancelledTotal: string;
  byCategory: Array<{
    category: ExpenseCategory;
    count: number;
    amount: string;
  }>;
  byPaymentMethod: Array<{
    paymentMethod: ExpensePaymentMethod;
    count: number;
    amount: string;
  }>;
}

export class ExpenseService {
  private repo = new ExpenseRepository();

  public static formatExpense(expense: ExpenseWithRelations): FormattedExpense {
    const rawDate = expense.expenseDate instanceof Date
      ? expense.expenseDate.toISOString().split('T')[0]
      : String(expense.expenseDate).split('T')[0];

    return {
      id: expense.id,
      expenseNumber: expense.expenseNumber,
      idempotencyKey: expense.idempotencyKey,
      expenseDate: rawDate,
      category: expense.category,
      amount: new Prisma.Decimal(expense.amount).toFixed(2),
      paymentMethod: expense.paymentMethod,
      recipient: expense.recipient,
      status: expense.status,
      reference: expense.reference,
      notes: expense.notes,
      createdById: expense.createdById,
      createdBy: expense.createdBy,
      cancelledById: expense.cancelledById,
      cancelledBy: expense.cancelledBy,
      cancelledAt: expense.cancelledAt ? expense.cancelledAt.toISOString() : null,
      cancelReason: expense.cancelReason,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString()
    };
  }

  async createExpense(data: CreateExpenseInput, userId?: string): Promise<FormattedExpense> {
    // 1. Idempotency protection check
    if (data.idempotencyKey) {
      const existing = await this.repo.findByIdempotencyKey(data.idempotencyKey);
      if (existing) {
        return ExpenseService.formatExpense(existing);
      }
    }

    const dateStr = data.expenseDate || new Date().toISOString().split('T')[0];
    const expenseDateObj = DailyRateService.parseDate(dateStr);
    const amountDecimal = new Prisma.Decimal(data.amount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    if (amountDecimal.lessThanOrEqualTo(0)) {
      throw AppError.badRequest('Expense amount must be greater than zero', 'EXPENSE_INVALID_AMOUNT');
    }

    const created = await prisma.$transaction(async (tx) => {
      // 2. Day-end closed business date check
      await assertBusinessDateOpen(tx, expenseDateObj);
      await assertBusinessDateOpen(tx, new Date());

      // 3. Collision-safe atomic sequential numbering
      const expenseNumber = await generateExpenseNumber(tx, dateStr);

      // 4. Create Expense record
      const expense = await this.repo.create(
        {
          expenseNumber,
          idempotencyKey: data.idempotencyKey || null,
          expenseDate: expenseDateObj,
          category: data.category,
          amount: amountDecimal,
          paymentMethod: data.paymentMethod,
          recipient: data.recipient.trim(),
          status: ExpenseStatus.RECORDED,
          reference: data.reference ? data.reference.trim() : null,
          notes: data.notes ? data.notes.trim() : null,
          createdById: userId || null
        },
        tx
      );

      return expense;
    }, {
      maxWait: 15000,
      timeout: 60000
    });

    return ExpenseService.formatExpense(created);
  }

  async recordWorkerWage(data: CreateWorkerWageInput, userId?: string): Promise<FormattedExpense> {
    const workerRecipient = (data.workerName || data.recipient)!.trim();
    return this.createExpense(
      {
        expenseDate: data.expenseDate,
        category: ExpenseCategory.WORKER_WAGE,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        recipient: workerRecipient,
        reference: data.reference,
        notes: data.notes,
        idempotencyKey: data.idempotencyKey
      },
      userId
    );
  }

  async cancelExpense(id: string, reason?: string, userId?: string): Promise<FormattedExpense> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw AppError.notFound('Expense record not found', 'EXPENSE_NOT_FOUND');
    }

    if (existing.status === ExpenseStatus.CANCELLED) {
      throw AppError.badRequest('Expense is already cancelled', 'EXPENSE_ALREADY_CANCELLED');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Day-end validation on original expense date and today
      await assertBusinessDateOpen(tx, existing.expenseDate);
      await assertBusinessDateOpen(tx, new Date());

      // 2. Compensating cancellation transition with audit stamps
      const cancelled = await this.repo.update(
        existing.id,
        {
          status: ExpenseStatus.CANCELLED,
          cancelledById: userId || null,
          cancelledAt: new Date(),
          cancelReason: reason ? reason.trim() : 'Expense cancelled by admin'
        },
        tx
      );

      return cancelled;
    }, {
      maxWait: 15000,
      timeout: 60000
    });

    return ExpenseService.formatExpense(updated);
  }

  async getExpenses(params: ExpenseQueryParams): Promise<{
    items: FormattedExpense[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.category) {
      where.category = params.category;
    }

    if (params.paymentMethod) {
      where.paymentMethod = params.paymentMethod;
    }

    if (params.recipient) {
      where.recipient = { contains: params.recipient, mode: 'insensitive' };
    }

    const exactDate = params.date;
    const fromDate = params.dateFrom || params.fromDate;
    const toDate = params.dateTo || params.toDate;

    if (exactDate) {
      where.expenseDate = DailyRateService.parseDate(exactDate);
    } else if (fromDate || toDate) {
      where.expenseDate = {};
      if (fromDate) where.expenseDate.gte = DailyRateService.parseDate(fromDate);
      if (toDate) where.expenseDate.lte = DailyRateService.parseDate(toDate);
    }

    if (params.search) {
      where.OR = [
        { expenseNumber: { contains: params.search, mode: 'insensitive' } },
        { recipient: { contains: params.search, mode: 'insensitive' } },
        { reference: { contains: params.search, mode: 'insensitive' } },
        { notes: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    const [items, total] = await Promise.all([
      this.repo.findMany({ skip, take: limit, where }),
      this.repo.count(where)
    ]);

    return {
      items: items.map(ExpenseService.formatExpense),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getExpenseById(id: string): Promise<FormattedExpense> {
    const expense = await this.repo.findById(id);
    if (!expense) {
      throw AppError.notFound('Expense record not found', 'EXPENSE_NOT_FOUND');
    }
    return ExpenseService.formatExpense(expense);
  }

  async getExpenseSummary(params: ExpenseSummaryQueryParams): Promise<ExpenseSummaryReport> {
    const todayStr = new Date().toISOString().split('T')[0];
    const exactDate = params.date;
    const fromDateStr = exactDate || params.dateFrom || params.fromDate || todayStr;
    const toDateStr = exactDate || params.dateTo || params.toDate || fromDateStr;

    const fromDate = DailyRateService.parseDate(fromDateStr);
    const toDate = DailyRateService.parseDate(toDateStr);

    const whereBase: Prisma.ExpenseWhereInput = {
      expenseDate: {
        gte: fromDate,
        lte: toDate
      }
    };

    const allExpenses = await this.repo.findMany({
      where: whereBase,
      orderBy: { expenseDate: 'asc' }
    });

    let totalOpex = new Prisma.Decimal('0.00');
    let cashOpex = new Prisma.Decimal('0.00');
    let upiOpex = new Prisma.Decimal('0.00');
    let bankOpex = new Prisma.Decimal('0.00');
    let workerWages = new Prisma.Decimal('0.00');
    let cancelledTotal = new Prisma.Decimal('0.00');

    let activeCount = 0;
    let cancelledCount = 0;

    const categoryMap = new Map<ExpenseCategory, { count: number; amount: Prisma.Decimal }>();
    const methodMap = new Map<ExpensePaymentMethod, { count: number; amount: Prisma.Decimal }>();

    for (const exp of allExpenses) {
      const amt = new Prisma.Decimal(exp.amount);

      if (exp.status === ExpenseStatus.CANCELLED) {
        cancelledCount++;
        cancelledTotal = cancelledTotal.add(amt);
        continue;
      }

      activeCount++;
      totalOpex = totalOpex.add(amt);

      if (exp.paymentMethod === ExpensePaymentMethod.CASH) {
        cashOpex = cashOpex.add(amt);
      } else if (exp.paymentMethod === ExpensePaymentMethod.UPI) {
        upiOpex = upiOpex.add(amt);
      } else if (exp.paymentMethod === ExpensePaymentMethod.BANK_TRANSFER) {
        bankOpex = bankOpex.add(amt);
      }

      if (exp.category === ExpenseCategory.WORKER_WAGE || exp.category === ExpenseCategory.COOLIE_WAGES) {
        workerWages = workerWages.add(amt);
      }

      // By Category
      const catEntry = categoryMap.get(exp.category) || { count: 0, amount: new Prisma.Decimal('0.00') };
      catEntry.count++;
      catEntry.amount = catEntry.amount.add(amt);
      categoryMap.set(exp.category, catEntry);

      // By Method
      const methodEntry = methodMap.get(exp.paymentMethod) || { count: 0, amount: new Prisma.Decimal('0.00') };
      methodEntry.count++;
      methodEntry.amount = methodEntry.amount.add(amt);
      methodMap.set(exp.paymentMethod, methodEntry);
    }

    const otherOpex = totalOpex.sub(workerWages);

    const byCategory = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      amount: stats.amount.toFixed(2)
    }));

    const byPaymentMethod = Array.from(methodMap.entries()).map(([paymentMethod, stats]) => ({
      paymentMethod,
      count: stats.count,
      amount: stats.amount.toFixed(2)
    }));

    return {
      dateRange: {
        from: fromDateStr,
        to: toDateStr
      },
      totalOpex: totalOpex.toFixed(2),
      cashOpex: cashOpex.toFixed(2),
      upiOpex: upiOpex.toFixed(2),
      bankOpex: bankOpex.toFixed(2),
      workerWages: workerWages.toFixed(2),
      otherOpex: otherOpex.toFixed(2),
      activeCount,
      cancelledCount,
      cancelledTotal: cancelledTotal.toFixed(2),
      byCategory,
      byPaymentMethod
    };
  }
}
