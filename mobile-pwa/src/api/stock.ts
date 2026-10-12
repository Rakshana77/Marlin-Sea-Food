import { apiClient } from './client';
import { StockItem, StockMovement, Seafood } from '../types/models';
import { RecordWastagePayload, RecordAdjustmentPayload } from '../types/api';

export interface StockQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  seafoodId?: string;
  gradeId?: string;
}

export async function getStockList(params: StockQueryParams = {}): Promise<StockItem[]> {
  return await apiClient<StockItem[]>('/stock', {
    method: 'GET',
    params: {
      ...params,
      page: params.page || 1,
      limit: params.limit || 100,
    },
  });
}

export async function getStockMovements(params: {
  page?: number;
  limit?: number;
  movementType?: string;
  fromDate?: string;
  toDate?: string;
  seafoodId?: string;
  gradeId?: string;
} = {}): Promise<StockMovement[]> {
  return await apiClient<StockMovement[]>('/stock/movements', {
    method: 'GET',
    params: {
      ...params,
      page: params.page || 1,
      limit: params.limit || 50,
    },
  });
}

export async function getSeafoodCatalog(): Promise<Seafood[]> {
  return await apiClient<Seafood[]>('/seafood', {
    method: 'GET',
    params: { page: 1, limit: 100 },
  });
}

export async function recordWastage(payload: RecordWastagePayload): Promise<StockMovement> {
  return await apiClient<StockMovement>('/stock/wastage', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function recordAdjustment(payload: RecordAdjustmentPayload): Promise<StockMovement> {
  return await apiClient<StockMovement>('/stock/adjustment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
