import { apiClient } from './client';
import { PurchaseBill } from '../types/models';
import { CreatePurchaseBillPayload } from '../types/api';

export async function getPurchaseBills(params: {
  page?: number;
  limit?: number;
  search?: string;
  billDate?: string;
  fromDate?: string;
  toDate?: string;
  fishermanId?: string;
  status?: string;
  paymentStatus?: string;
} = {}): Promise<PurchaseBill[]> {
  return await apiClient<PurchaseBill[]>('/purchase-bills', {
    method: 'GET',
    params: {
      ...params,
      page: params.page || 1,
      limit: params.limit || 20,
    },
  });
}

export async function createPurchaseBill(payload: CreatePurchaseBillPayload): Promise<PurchaseBill> {
  return await apiClient<PurchaseBill>('/purchase-bills', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelPurchaseBill(id: string): Promise<PurchaseBill> {
  return await apiClient<PurchaseBill>(`/purchase-bills/${id}/cancel`, {
    method: 'POST',
  });
}
