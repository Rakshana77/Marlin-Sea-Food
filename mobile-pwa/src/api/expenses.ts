import { apiClient } from './client';
import { Expense } from '../types/models';
import { CreateExpensePayload } from '../types/api';

export async function getExpenses(params: {
  page?: number;
  limit?: number;
  date?: string;
  fromDate?: string;
  toDate?: string;
  category?: string;
  status?: string;
  search?: string;
} = {}): Promise<Expense[]> {
  return await apiClient<Expense[]>('/expenses', {
    method: 'GET',
    params: {
      ...params,
      page: params.page || 1,
      limit: params.limit || 30,
    },
  });
}

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  return await apiClient<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createWorkerWage(payload: {
  workerName: string;
  amount: string;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER';
  notes?: string;
  expenseDate?: string;
}): Promise<Expense> {
  return await apiClient<Expense>('/expenses/wages', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelExpense(id: string, reason?: string): Promise<Expense> {
  return await apiClient<Expense>(`/expenses/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
