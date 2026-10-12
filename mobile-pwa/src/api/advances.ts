import { apiClient } from './client';
import { Fisherman, FishermanAdvance, AdvanceLedgerEntry } from '../types/models';

export async function getFishermen(search?: string, status?: 'ACTIVE' | 'INACTIVE'): Promise<Fisherman[]> {
  return await apiClient<Fisherman[]>('/fishermen', {
    method: 'GET',
    params: { search, status, limit: 100 },
  });
}

export async function getFishermanById(id: string): Promise<Fisherman> {
  return await apiClient<Fisherman>(`/fishermen/${id}`, {
    method: 'GET',
  });
}

export async function createFisherman(payload: {
  name: string;
  countryCode?: string;
  mobileNumber: string;
}): Promise<Fisherman> {
  return await apiClient<Fisherman>('/fishermen', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      countryCode: payload.countryCode || '+91',
    }),
  });
}

export async function updateFisherman(id: string, payload: Partial<{
  name: string;
  countryCode: string;
  mobileNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
}>): Promise<Fisherman> {
  return await apiClient<Fisherman>(`/fishermen/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteFisherman(id: string): Promise<Fisherman> {
  return await apiClient<Fisherman>(`/fishermen/${id}`, {
    method: 'DELETE',
  });
}

export async function getFishermanAdvanceBalance(fishermanId: string): Promise<{
  fishermanId: string;
  fishermanName: string;
  advanceRecoverableBalance: string;
}> {
  return await apiClient<{
    fishermanId: string;
    fishermanName: string;
    advanceRecoverableBalance: string;
  }>(`/fisherman-advances/fishermen/${fishermanId}/balance`, {
    method: 'GET',
  });
}

export async function getFishermanLedger(fishermanId: string): Promise<AdvanceLedgerEntry[]> {
  return await apiClient<AdvanceLedgerEntry[]>(`/fisherman-advances/fishermen/${fishermanId}/ledger`, {
    method: 'GET',
    params: { limit: 50 },
  });
}

export async function getGlobalAdvanceLedger(): Promise<AdvanceLedgerEntry[]> {
  return await apiClient<AdvanceLedgerEntry[]>('/fisherman-advances/ledger', {
    method: 'GET',
    params: { limit: 100 },
  });
}

export async function disburseAdvance(payload: {
  fishermanId: string;
  amount: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI';
  notes?: string;
}): Promise<FishermanAdvance> {
  return await apiClient<FishermanAdvance>('/fisherman-advances/disburse', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function repayAdvance(payload: {
  fishermanId: string;
  amount: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI';
  notes?: string;
}): Promise<FishermanAdvance> {
  return await apiClient<FishermanAdvance>('/fisherman-advances/repay', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function writeOffAdvance(payload: {
  advanceId: string;
  reason: string;
}): Promise<FishermanAdvance> {
  return await apiClient<FishermanAdvance>('/fisherman-advances/write-off', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelAdvance(id: string, reason?: string): Promise<FishermanAdvance> {
  return await apiClient<FishermanAdvance>(`/fisherman-advances/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
