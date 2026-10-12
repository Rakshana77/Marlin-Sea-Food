import { apiClient } from './client';
import { DailyRate } from '../types/models';
import { CreateDailyRatePayload } from '../types/api';

export async function getCurrentDailyRates(date?: string): Promise<DailyRate[]> {
  const queryDate = date || new Date().toISOString().split('T')[0];
  try {
    const dateRates = await apiClient<DailyRate[]>('/daily-rates', {
      method: 'GET',
      params: { date: queryDate, limit: 100 },
    });
    if (Array.isArray(dateRates) && dateRates.length > 0) {
      return dateRates;
    }
  } catch {
    // Fall back to general list
  }

  return await apiClient<DailyRate[]>('/daily-rates', {
    method: 'GET',
    params: { limit: 100 },
  });
}

export async function getDailyRatesList(date?: string, seafoodId?: string, gradeId?: string): Promise<DailyRate[]> {
  const queryDate = date || new Date().toISOString().split('T')[0];
  return await apiClient<DailyRate[]>('/daily-rates', {
    method: 'GET',
    params: {
      date: queryDate,
      seafoodId,
      gradeId,
      limit: 100,
    },
  });
}

export async function getRateHistory(seafoodId: string, gradeId: string, limit = 10): Promise<DailyRate[]> {
  return await apiClient<DailyRate[]>('/daily-rates/history', {
    method: 'GET',
    params: { seafoodId, gradeId, limit },
  });
}

export async function getSingleCurrentRate(
  date: string,
  seafoodId: string,
  gradeId: string
): Promise<DailyRate> {
  return await apiClient<DailyRate>('/daily-rates/current', {
    method: 'GET',
    params: { date, seafoodId, gradeId },
  });
}

export async function createDailyRate(payload: CreateDailyRatePayload): Promise<DailyRate> {
  return await apiClient<DailyRate>('/daily-rates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDailyRate(id: string, payload: Partial<CreateDailyRatePayload>): Promise<DailyRate> {
  return await apiClient<DailyRate>(`/daily-rates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function publishSingleRate(id: string): Promise<DailyRate> {
  return await apiClient<DailyRate>(`/daily-rates/${id}/publish`, {
    method: 'POST',
  });
}

export async function deleteDailyRate(id: string): Promise<DailyRate> {
  return await apiClient<DailyRate>(`/daily-rates/${id}`, {
    method: 'DELETE',
  });
}

export async function publishAllRatesForDate(date: string): Promise<{ count: number }> {
  return await apiClient<{ count: number }>('/daily-rates/publish', {
    method: 'POST',
    body: JSON.stringify({ rateDate: date }),
  });
}

export async function copyYesterdayRates(targetDate: string, sourceDate?: string): Promise<{ count: number }> {
  let calculatedSource = sourceDate;
  if (!calculatedSource) {
    const tDate = new Date(targetDate);
    tDate.setDate(tDate.getDate() - 1);
    calculatedSource = tDate.toISOString().split('T')[0];
  }
  return await apiClient<{ count: number }>('/daily-rates/copy-yesterday', {
    method: 'POST',
    body: JSON.stringify({ sourceDate: calculatedSource, targetDate }),
  });
}
