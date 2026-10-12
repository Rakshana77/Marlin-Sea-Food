import { apiClient } from './client';
import { PnlSummary, PnlBreakdowns } from '../types/models';

export async function getDailyPnl(date?: string): Promise<PnlSummary> {
  return await apiClient<PnlSummary>('/pnl/daily', {
    method: 'GET',
    params: date ? { date } : undefined,
  });
}

export async function getPnlSummary(startDate?: string, endDate?: string): Promise<PnlSummary> {
  return await apiClient<PnlSummary>('/pnl/summary', {
    method: 'GET',
    params: {
      startDate,
      endDate,
    },
  });
}

export async function getPnlBreakdowns(startDate?: string, endDate?: string): Promise<PnlBreakdowns> {
  return await apiClient<PnlBreakdowns>('/pnl/breakdown', {
    method: 'GET',
    params: {
      startDate,
      endDate,
    },
  });
}
