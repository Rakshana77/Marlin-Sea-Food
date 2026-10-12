import { apiClient } from './client';
import { CreateSalePayload } from '../types/api';
import { Sale } from '../types/models';

export interface SaleQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  date?: string;
  fromDate?: string;
  toDate?: string;
  saleType?: 'WHOLESALE' | 'EXPORT';
  customerId?: string;
  paymentStatus?: string;
  status?: string;
}

export async function createSale(payload: CreateSalePayload): Promise<Sale> {
  return await apiClient<Sale>('/sales', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getSales(params: SaleQueryParams = {}): Promise<Sale[]> {
  return await apiClient<Sale[]>('/sales', {
    method: 'GET',
    params: {
      ...params,
      page: params.page || 1,
      limit: params.limit || 20,
    },
  });
}

export async function getSaleById(id: string): Promise<Sale> {
  return await apiClient<Sale>(`/sales/${id}`, {
    method: 'GET',
  });
}

export async function cancelSale(id: string): Promise<Sale> {
  return await apiClient<Sale>(`/sales/${id}/cancel`, {
    method: 'POST',
  });
}
